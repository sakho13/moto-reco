'use client'

import { FormEvent, useState } from 'react'
import { ApiV1Error } from '@repo/shared-domain'
import type { ProviderType } from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'
import { toast } from '@repo/ui/sonner'
import styles from './AuthProviderSwitch.module.css'
import { ModalBase } from '@/components/common/ModalBase'
import { apiPut } from '@/lib/api/client'
import {
  ERROR_MESSAGES,
  getFirebaseErrorMessage,
} from '@/lib/constants/errorMessages'
import type { SwitchableProviderId } from '@/lib/firebase/auth'
import { useAuth } from '@/lib/hooks/useAuth'
import { validatePassword, validatePasswordMatch } from '@/lib/utils/validation'

/** 切り替え先として選択できる認証方式 */
type SwitchTarget = Extract<ProviderType, 'FIREBASE_EMAIL' | 'FIREBASE_GOOGLE'>

/** ユーザー操作によるキャンセルを示すFirebaseエラーコード */
const CANCEL_ERROR_CODES: readonly string[] = [
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
]

/** 切り替え先に対応する Firebase の認証方式ID */
const TARGET_PROVIDER_ID: Record<SwitchTarget, SwitchableProviderId> = {
  FIREBASE_EMAIL: 'password',
  FIREBASE_GOOGLE: 'google.com',
}

/** 切り替え先の表示名 */
const TARGET_LABEL: Record<SwitchTarget, string> = {
  FIREBASE_EMAIL: 'メール/パスワード',
  FIREBASE_GOOGLE: 'Google',
}

type Props = {
  /** 「Googleに切り替える」を表示するか */
  isGoogleSwitchEnabled: boolean
}

const getErrorCode = (err: unknown): string | undefined =>
  typeof err === 'object' &&
  err !== null &&
  'code' in err &&
  typeof err.code === 'string'
    ? err.code
    : undefined

/**
 * ログイン方法（メール/パスワード・Google）を切り替える操作群
 */
export function AuthProviderSwitch({ isGoogleSwitchEnabled }: Props) {
  const {
    user,
    linkWithGoogle,
    linkWithEmailPassword,
    unlinkProvidersExcept,
    reloadUser,
  } = useAuth()

  const [modalTarget, setModalTarget] = useState<SwitchTarget | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const providerIds = user?.providerData.map((p) => p.providerId) ?? []
  const hasPassword = providerIds.includes('password')
  const hasGoogle = providerIds.includes('google.com')

  const showGoogleSwitch = isGoogleSwitchEnabled && hasPassword
  const showEmailSwitch = hasGoogle

  if (!showGoogleSwitch && !showEmailSwitch) return null

  const openModal = (target: SwitchTarget) => {
    setPassword('')
    setConfirmPassword('')
    setPasswordError(null)
    setConfirmPasswordError(null)
    setError(null)
    setModalTarget(target)
  }

  const closeModal = () => {
    if (isSubmitting) return
    setModalTarget(null)
  }

  const switchProvider = async (target: SwitchTarget) => {
    await unlinkProvidersExcept(TARGET_PROVIDER_ID[target])
    await apiPut('/api/v1/user/auth/provider', { providerType: target })
    await reloadUser()
    toast.success(`ログイン方法を${TARGET_LABEL[target]}に切り替えました`)
    setModalTarget(null)
  }

  const handleSwitchToGoogle = async () => {
    setError(null)
    setIsSubmitting(true)
    try {
      if (!hasGoogle) {
        try {
          await linkWithGoogle()
        } catch (linkError: unknown) {
          const code = getErrorCode(linkError)
          if (code && CANCEL_ERROR_CODES.includes(code)) return
          if (code !== 'auth/provider-already-linked') throw linkError
        }
      }
      await switchProvider('FIREBASE_GOOGLE')
    } catch (err: unknown) {
      console.error('Google switch error:', err)
      setError(toErrorMessage(err))
      await reloadUser()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSwitchToEmail = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!hasPassword) {
      const passwordErr = validatePassword(password)
      const confirmErr = validatePasswordMatch(password, confirmPassword)
      setPasswordError(passwordErr)
      setConfirmPasswordError(confirmErr)
      if (passwordErr || confirmErr) return
    }

    setIsSubmitting(true)
    try {
      if (!hasPassword) {
        try {
          await linkWithEmailPassword(password)
        } catch (linkError: unknown) {
          if (getErrorCode(linkError) !== 'auth/provider-already-linked') {
            throw linkError
          }
        }
      }
      await switchProvider('FIREBASE_EMAIL')
    } catch (err: unknown) {
      console.error('Email switch error:', err)
      setError(toErrorMessage(err))
      await reloadUser()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className={styles.actions}>
        {showGoogleSwitch && (
          <Button
            variant="cloud"
            fullWidth
            onClick={() => openModal('FIREBASE_GOOGLE')}
          >
            Googleに切り替える
          </Button>
        )}
        {showEmailSwitch && (
          <Button
            variant="cloud"
            fullWidth
            onClick={() => openModal('FIREBASE_EMAIL')}
          >
            メール/パスワードに切り替える
          </Button>
        )}
      </div>

      {modalTarget === 'FIREBASE_GOOGLE' && (
        <ModalBase title="Googleに切り替える" onClose={closeModal} size="sm">
          <div className={styles.body}>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <p className={styles.description}>
              Googleアカウントでログインするように切り替えます。切り替えるとメール/パスワードではログインできなくなります。
            </p>
            <Button
              variant="primary"
              fullWidth
              loading={isSubmitting}
              onClick={handleSwitchToGoogle}
            >
              Googleアカウントを選択して切り替える
            </Button>
          </div>
        </ModalBase>
      )}

      {modalTarget === 'FIREBASE_EMAIL' && (
        <ModalBase
          title="メール/パスワードに切り替える"
          onClose={closeModal}
          size="sm"
        >
          <form className={styles.body} onSubmit={handleSwitchToEmail}>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <p className={styles.description}>
              {hasPassword
                ? 'メールアドレスと設定済みのパスワードでログインするように切り替えます。'
                : '新しいパスワードを設定し、メールアドレスとパスワードでログインするように切り替えます。'}
              切り替えるとGoogleではログインできなくなります。
            </p>
            <div className={styles.emailRow}>
              <span className={styles.emailLabel}>メールアドレス</span>
              <span>{user?.email ?? '-'}</span>
            </div>
            {!hasPassword && (
              <>
                <FormField
                  label="新しいパスワード"
                  htmlFor="switch-password"
                  required
                  error={passwordError ?? undefined}
                >
                  <Input
                    id="switch-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                </FormField>
                <FormField
                  label="新しいパスワード（確認）"
                  htmlFor="switch-confirm-password"
                  required
                  error={confirmPasswordError ?? undefined}
                >
                  <Input
                    id="switch-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                </FormField>
              </>
            )}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isSubmitting}
            >
              切り替える
            </Button>
          </form>
        </ModalBase>
      )}
    </>
  )
}

const toErrorMessage = (err: unknown): string => {
  if (err instanceof ApiV1Error) return err.message
  const code = getErrorCode(err)
  if (code?.startsWith('auth/')) return getFirebaseErrorMessage(code)
  return ERROR_MESSAGES.AUTH.PROVIDER_SWITCH_FAILED
}
