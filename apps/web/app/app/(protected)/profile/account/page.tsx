'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ApiV1Error } from '@repo/shared-domain'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { Textarea } from '@repo/ui/textarea'
import styles from './page.module.css'
import { AuthProviderSwitch } from '@/components/AuthProviderSwitch'
import { ModalBase } from '@/components/common/ModalBase'
import { trackEvent } from '@/lib/analytics'
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
  const [hasAcknowledgedQuit, setHasAcknowledgedQuit] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const providerLabels = isGuest
    ? ['ゲスト']
    : (user?.providerData ?? []).map(
        ({ providerId }) => PROVIDER_LABEL[providerId] ?? providerId
      )

  const handleOpenQuitModal = () => {
    setQuitStep('form')
    setQuitReason('')
    setHasAcknowledgedQuit(false)
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
    if (!hasAcknowledgedQuit) return
    setIsSubmitting(true)
    setError(null)
    try {
      await apiPost('/api/v1/user/auth/quit', {
        quitReason: quitReason.trim(),
      })
      trackEvent('account_quit', {
        has_reason: quitReason.trim().length > 0,
        provider: isGuest
          ? 'guest'
          : (user?.providerData[0]?.providerId ?? 'unknown'),
        is_guest: isGuest,
      })
      // サインアウトは遷移先の /app/quit-complete で行う。
      // ここで signOut すると withAuth のリダイレクトが先に発火し、
      // quit-complete への遷移と競合してログイン画面に飛ばされてしまう。
      // 復帰用トークンはURLに載せない（ブラウザ履歴に残さないため、案内メールでのみ届ける）。
      router.push('/app/quit-complete')
    } catch (e) {
      trackEvent('account_quit_error', {
        ...(e instanceof ApiV1Error
          ? { error_code: e.errorCode, error_message: e.message }
          : {}),
      })
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
                  color: 'var(--color-inkLight)',
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
                  color: 'var(--color-inkLight)',
                }}
              >
                退会日から30日間は、ご登録のメールアドレス
                {user?.email ? `（${user.email}）` : ''}
                に届く案内メールのリンクからのみ復帰できます。案内メールが届かない場合は復帰できず、30日後にアカウント情報が完全に削除されるまで、同じメールアドレス・Googleアカウントでの再登録もできません。
              </p>
              {/* 復帰手段は案内メールのみのため、届かない場合の影響を理解してから退会させる */}
              <Checkbox
                id="quit-acknowledge"
                checked={hasAcknowledgedQuit}
                onChange={(e) => setHasAcknowledgedQuit(e.target.checked)}
                disabled={isSubmitting}
                label="上記を理解しました"
              />
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
                  disabled={!hasAcknowledgedQuit}
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
            <span className={styles.itemLabel}>認証方式</span>
            <span>
              {providerLabels.length > 0 ? providerLabels.join(' / ') : '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={styles.itemLabel}>メールアドレス</span>
            <span>{user?.email ?? '-'}</span>
          </div>
        </div>
        {!isGuest && <AuthProviderSwitch />}
      </BaseCard>

      {!isGuest && (
        <BaseCard title="退会">
          <div className="flex flex-col gap-3 text-sm">
            <p style={{ color: 'var(--color-inkLight)' }}>
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
