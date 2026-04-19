'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'
import { useAuth } from '@/lib/hooks/useAuth'

export function ResetPasswordCard() {
  const { requestPasswordReset } = useAuth()

  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      await requestPasswordReset(email)
      setSuccess(
        'パスワード再設定メールを送信しました。メールをご確認ください。'
      )
    } catch (err) {
      console.error('Password reset error:', err)
      setError(
        'パスワード再設定メールの送信に失敗しました。メールアドレスを確認して再度お試しください。'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <BaseCard
      title="パスワード再設定"
      footer={
        <p>
          ログイン画面に戻る <Link href="/app/login">ログイン</Link>
        </p>
      }
    >
      {error && (
        <div className="pb-2">
          <ErrorMessage>{error}</ErrorMessage>
        </div>
      )}

      {success && (
        <div className="pb-2 text-sm text-green-600" role="status">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col">
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

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
        >
          再設定メールを送信
        </Button>
      </form>
    </BaseCard>
  )
}
