'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ApiV1Error } from '@repo/shared-domain'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { Textarea } from '@repo/ui/textarea'
import { ModalBase } from '@/components/common/ModalBase'
import { apiPost } from '@/lib/api/client'
import { withAuth } from '@/lib/hoc/withAuth'
import { useAuth } from '@/lib/hooks/useAuth'

const PROVIDER_LABEL: Record<string, string> = {
  password: 'メール/パスワード',
  'google.com': 'Google',
}

type QuitStep = 'form' | 'confirm'

function AccountPage() {
  const router = useRouter()
  const { user, isGuest } = useAuth()

  const [isQuitModalOpen, setIsQuitModalOpen] = useState(false)
  const [quitStep, setQuitStep] = useState<QuitStep>('form')
  const [quitReason, setQuitReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const providerLabel = isGuest
    ? 'ゲスト'
    : user?.providerData[0]?.providerId != null
      ? (PROVIDER_LABEL[user.providerData[0].providerId] ??
        user.providerData[0].providerId)
      : '-'

  const handleOpenQuitModal = () => {
    setQuitStep('form')
    setQuitReason('')
    setError(null)
    setIsQuitModalOpen(true)
  }

  const handleCloseQuitModal = () => {
    if (isSubmitting) return
    setIsQuitModalOpen(false)
  }

  const handleProceedToConfirm = () => {
    if (!quitReason.trim()) return
    setError(null)
    setQuitStep('confirm')
  }

  const handleConfirmQuit = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await apiPost('/api/v1/user/auth/quit', {
        quitReason: quitReason.trim(),
      })
      // サインアウトは遷移先の /app/quit-complete で行う。
      // ここで signOut すると withAuth のリダイレクトが先に発火し、
      // quit-complete への遷移と競合してログイン画面に飛ばされてしまう。
      router.push(
        `/app/quit-complete?token=${encodeURIComponent(result.data.recoveryToken)}`
      )
    } catch (e) {
      setError(
        e instanceof ApiV1Error
          ? e.message
          : '退会処理に失敗しました。もう一度お試しください。'
      )
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md flex flex-col gap-4">
      {isQuitModalOpen && (
        <ModalBase title="退会手続き" onClose={handleCloseQuitModal}>
          {error && (
            <div className="pb-2">
              <ErrorMessage>{error}</ErrorMessage>
            </div>
          )}

          {quitStep === 'form' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-3)',
              }}
            >
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-muted-foreground)',
                }}
              >
                退会理由を教えてください（今後のサービス改善に活用します）
              </p>
              <Textarea
                value={quitReason}
                onChange={(e) => setQuitReason(e.target.value)}
                placeholder="退会理由を入力してください"
                rows={4}
                maxLength={200}
              />
              <Button
                variant="danger"
                fullWidth
                disabled={!quitReason.trim()}
                onClick={handleProceedToConfirm}
              >
                次へ
              </Button>
            </div>
          )}

          {quitStep === 'confirm' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-4)',
              }}
            >
              <p style={{ fontSize: 'var(--font-size-sm)' }}>
                本当に退会しますか？退会するとログインできなくなります。
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-muted-foreground)',
                }}
              >
                退会日から30日間は、ご登録のメールアドレスに送信される案内メールから復帰できます。30日を過ぎるとアカウント情報は完全に削除され、復帰できなくなります。
              </p>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--spacing-2)',
                }}
              >
                <Button
                  variant="danger"
                  fullWidth
                  loading={isSubmitting}
                  onClick={handleConfirmQuit}
                >
                  退会する
                </Button>
                <Button
                  variant="danger"
                  outline
                  fullWidth
                  disabled={isSubmitting}
                  onClick={() => setQuitStep('form')}
                >
                  戻る
                </Button>
              </div>
            </div>
          )}
        </ModalBase>
      )}

      <BaseCard title="アカウント認証">
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">認証方式</span>
            <span>{providerLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">メールアドレス</span>
            <span>{user?.email ?? '-'}</span>
          </div>
        </div>
      </BaseCard>

      {!isGuest && (
        <BaseCard title="退会">
          <div className="flex flex-col gap-3 text-sm">
            <p style={{ color: 'var(--color-muted-foreground)' }}>
              退会すると、すべてのデータが利用できなくなります。30日間は復帰可能です。
            </p>
            <Button variant="danger" outline onClick={handleOpenQuitModal}>
              退会する
            </Button>
          </div>
        </BaseCard>
      )}
    </div>
  )
}

export default withAuth(AccountPage)
