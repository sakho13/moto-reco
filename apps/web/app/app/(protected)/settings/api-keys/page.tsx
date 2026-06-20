'use client'

import { useCallback, useEffect, useState } from 'react'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { TrashIcon } from '@/components/icons/TrashIcon'
import { apiDelete, apiGet, apiPost } from '@/lib/api/client'
import { withAuth } from '@/lib/hoc/withAuth'
import { useAuth } from '@/lib/hooks/useAuth'

type ApiKeyItem = {
  apiKeyId: string
  name: string
  prefix: string
  createdAt: string
}

type GeneratedKey = {
  apiKeyId: string
  name: string
  prefix: string
  fullKey: string
}

function ApiKeysSettingsPage() {
  const { isGuest } = useAuth()
  const [keys, setKeys] = useState<ApiKeyItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [generatedKey, setGeneratedKey] = useState<GeneratedKey | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchKeys = useCallback(async () => {
    try {
      const res = await apiGet('/api/v1/mcp/api-keys')
      setKeys(res.data.apiKeys)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'APIキーの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isGuest) {
      fetchKeys()
    } else {
      setIsLoading(false)
    }
  }, [isGuest, fetchKeys])

  const handleGenerate = async () => {
    if (!newKeyName.trim()) return
    setIsGenerating(true)
    setError(null)
    try {
      const res = await apiPost('/api/v1/mcp/api-keys', {
        name: newKeyName.trim(),
      })
      setGeneratedKey({
        apiKeyId: res.data.apiKeyId,
        name: res.data.name,
        prefix: res.data.prefix,
        fullKey: res.data.fullKey,
      })
      setNewKeyName('')
      await fetchKeys()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'APIキーの発行に失敗しました')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDelete = async (apiKeyId: string) => {
    setError(null)
    try {
      await apiDelete(`/api/v1/mcp/api-keys/${apiKeyId}`)
      setKeys((prev) => prev.filter((k) => k.apiKeyId !== apiKeyId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'APIキーの削除に失敗しました')
    }
  }

  const handleCopy = async () => {
    if (!generatedKey) return
    await navigator.clipboard.writeText(generatedKey.fullKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCloseModal = () => {
    setGeneratedKey(null)
    setCopied(false)
  }

  if (isGuest) {
    return (
      <div className="w-full max-w-md flex flex-col gap-4">
        <BaseCard title="MCP APIキー管理">
          <p
            style={{
              color: 'var(--color-muted-foreground)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            この機能はゲストアカウントではご利用いただけません。本登録後にご利用ください。
          </p>
        </BaseCard>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md flex flex-col gap-4">
      {/* 発行後モーダル */}
      {generatedKey && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 'var(--spacing-4)',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-background)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-6)',
              width: '100%',
              maxWidth: '24rem',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-4)',
            }}
          >
            <h2 style={{ fontWeight: 'bold', fontSize: 'var(--font-size-lg)' }}>
              APIキーを発行しました
            </h2>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-destructive)',
              }}
            >
              このキーは今後二度と表示されません。必ずコピーして保管してください。
            </p>
            <div
              style={{
                backgroundColor: 'var(--color-muted)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-3)',
                fontFamily: 'monospace',
                fontSize: 'var(--font-size-xs)',
                wordBreak: 'break-all',
              }}
            >
              {generatedKey.fullKey}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-2)',
              }}
            >
              <Button onClick={handleCopy} variant="primary" fullWidth>
                {copied ? 'コピーしました ✓' : 'クリップボードにコピー'}
              </Button>
              <Button
                onClick={handleCloseModal}
                variant="primary"
                outline
                fullWidth
              >
                閉じる
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* APIキー一覧 */}
      <BaseCard title="MCP APIキー管理">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-3)',
          }}
        >
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-muted-foreground)',
            }}
          >
            Claude Code などのMCPクライアントからバイクデータを参照できます
          </p>
          {error && (
            <p
              style={{
                color: 'var(--color-destructive)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              {error}
            </p>
          )}

          {isLoading ? (
            <p
              style={{
                color: 'var(--color-muted-foreground)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              読み込み中...
            </p>
          ) : keys.length === 0 ? (
            <p
              style={{
                color: 'var(--color-muted-foreground)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              APIキーはまだ発行されていません
            </p>
          ) : (
            keys.map((key) => (
              <div
                key={key.apiKeyId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--spacing-3)',
                  backgroundColor: 'var(--color-muted)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div>
                  <p
                    style={{
                      fontWeight: 'bold',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    {key.name}
                  </p>
                  <p
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-muted-foreground)',
                    }}
                  >
                    {key.prefix}_****
                  </p>
                  <p
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-muted-foreground)',
                    }}
                  >
                    {new Date(key.createdAt).toLocaleDateString('ja-JP')} 発行
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(key.apiKeyId)}
                  aria-label="削除"
                >
                  <TrashIcon />
                </Button>
              </div>
            ))
          )}
        </div>
      </BaseCard>

      {/* 新規発行フォーム */}
      <BaseCard title="新規APIキー発行">
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
            キーに識別用の名前をつけてください（例: Claude Code、Claude
            Desktop）
          </p>
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="キー名（例: My Claude Code）"
            maxLength={50}
            style={{
              width: '100%',
              padding: 'var(--spacing-2) var(--spacing-3)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
              backgroundColor: 'var(--color-background)',
            }}
          />
          <Button
            onClick={handleGenerate}
            loading={isGenerating}
            disabled={!newKeyName.trim()}
            fullWidth
          >
            APIキーを発行する
          </Button>
        </div>
      </BaseCard>

      <a
        href="/docs/mcp"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--spacing-3) var(--spacing-4)',
          backgroundColor: 'var(--color-muted)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-foreground)',
          textDecoration: 'none',
        }}
      >
        <span>設定方法を確認する</span>
        <span style={{ color: 'var(--color-muted-foreground)' }}>›</span>
      </a>
    </div>
  )
}

export default withAuth(ApiKeysSettingsPage)
