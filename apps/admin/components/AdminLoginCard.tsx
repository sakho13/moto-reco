'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/hooks/useAuth'

/**
 * 管理者ログインカード
 * メール/パスワードでFirebase Authにログインし、ADMINロールを確認する
 */
export function AdminLoginCard() {
  const router = useRouter()
  const { signInWithEmail, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const token = await signInWithEmail(email, password)

      // ADMINロール確認
      const res = await fetch('/api/admin/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 403) {
        // 管理者権限なし → ログアウトしてエラー表示
        await signOut()
        toast.error(
          '管理者権限が必要です。一般ユーザーアカウントではログインできません。'
        )
        return
      }

      if (!res.ok) {
        await signOut()
        toast.error('認証に失敗しました。もう一度お試しください。')
        return
      }

      router.push('/dashboard')
    } catch {
      toast.error('メールアドレスまたはパスワードが正しくありません。')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">管理者ログイン</CardTitle>
        <CardDescription>
          管理者アカウントでログインしてください
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
