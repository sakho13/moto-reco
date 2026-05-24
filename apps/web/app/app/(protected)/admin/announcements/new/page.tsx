'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import styles from './page.module.css'
import { authenticatedFetch } from '@/lib/api/client'
import { withAuth } from '@/lib/hoc/withAuth'

function NewAnnouncementPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await authenticatedFetch('/api/v1/admin/announcements', {
        method: 'POST',
        body: JSON.stringify({ type: 'SYSTEM_MAINTENANCE', title, body }),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.message ?? '作成に失敗しました')
        return
      }
      router.push('/app/admin/announcements')
    } catch {
      setError('作成に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-lg flex flex-col gap-4">
      <h1 className={styles.pageTitle}>アナウンス新規作成</h1>
      <BaseCard title="">
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="title" className={styles.label}>
              タイトル
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: メンテナンスのお知らせ"
              required
              maxLength={100}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="body" className={styles.label}>
              本文
            </label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="メンテナンス内容を記載してください"
              required
              maxLength={1000}
              rows={6}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <Button
              type="button"
              variant="cloud"
              onClick={() => router.back()}
              disabled={submitting}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? '作成中...' : '下書き保存'}
            </Button>
          </div>
        </form>
      </BaseCard>
    </div>
  )
}

export default withAuth(NewAnnouncementPage)
