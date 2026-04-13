'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'
import { trackEvent } from '@/lib/analytics'
import { apiPost } from '@/lib/api/client'
import { useAuth } from '@/lib/hooks/useAuth'

/**
 * ゲストアカウントから本登録へのアップグレードカード
 *
 * Firebase Account Linking を使用して匿名アカウントをメール/Google に連携し、
 * バックエンドでロールを USER に更新する。
 */
export function GuestUpgradeCard() {
  const router = useRouter()
  const { isGuest, upgradeGuestWithGoogle, upgradeGuestWithEmail } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleUpgradeWithEmail = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await upgradeGuestWithEmail(email, password)
      await apiPost('/api/v1/user/auth/guest/upgrade', {})
      trackEvent('web_guest_upgrade', { method: 'email' })
      router.push('/app/home')
    } catch (err) {
      console.error('Upgrade error:', err)
      setError('本登録に失敗しました。入力内容を確認してください。')
    } finally {
      setLoading(false)
    }
  }

  const handleUpgradeWithGoogle = async () => {
    setError(null)
    setLoading(true)

    try {
      await upgradeGuestWithGoogle()
      await apiPost('/api/v1/user/auth/guest/upgrade', {})
      trackEvent('web_guest_upgrade', { method: 'google' })
      router.push('/app/home')
    } catch (err) {
      console.error('Upgrade with Google error:', err)
      setError(
        'Googleアカウントとの連携に失敗しました。もう一度お試しください。'
      )
    } finally {
      setLoading(false)
    }
  }

  if (!isGuest) {
    return (
      <BaseCard title="本登録">
        <p className="text-center text-sm text-gray-600">
          既に本登録済みのアカウントです。
        </p>
      </BaseCard>
    )
  }

  return (
    <BaseCard title="本登録に切り替える">
      <p className="text-sm text-gray-600 mb-4">
        メールアドレスまたはGoogleアカウントを登録すると、ゲストの制限が解除され、データが永続的に保存されます。
      </p>

      {error && (
        <div className="pb-2">
          <ErrorMessage>{error}</ErrorMessage>
        </div>
      )}

      <form onSubmit={handleUpgradeWithEmail} className="flex flex-col">
        <FormField label="メールアドレス" htmlFor="email" required>
          <Input
            id="email"
            type="email"
            placeholder="example@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            autoComplete="email"
          />
        </FormField>

        <FormField label="パスワード（6文字以上）" htmlFor="password" required>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            autoComplete="new-password"
          />
        </FormField>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
        >
          メールで本登録する
        </Button>
      </form>

      <div className="divider">
        <span>または</span>
      </div>

      <Button
        onClick={handleUpgradeWithGoogle}
        variant="social"
        size="lg"
        fullWidth
        loading={loading}
        disabled={true}
      >
        Googleで本登録する
      </Button>
    </BaseCard>
  )
}
