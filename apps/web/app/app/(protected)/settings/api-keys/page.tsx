'use client'

import { useCallback, useEffect, useState } from 'react'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { ModalBase } from '@/components/common/ModalBase'
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
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
      setIsAddModalOpen(false)
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
      {/* 新規発行モーダル */}
      {isAddModalOpen && (
        <ModalBase
          title="新規APIキー発行"
          onClose={() => {
            setIsAddModalOpen(false)
            setNewKeyName('')
            setError(null)
          }}
        >
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
            <Input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="キー名（例: My Claude Code）"
              maxLength={50}
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
        </ModalBase>
      )}

      {/* 発行後モーダル */}
      {generatedKey && (
        <ModalBase title="APIキーを発行しました" onClose={handleCloseModal}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-4)',
            }}
          >
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
        </ModalBase>
      )}

      {/* APIキー一覧 */}
      <BaseCard
        title="MCP APIキー管理"
        headerAction={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
          >
            ＋ 追加
          </Button>
        }
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-muted-foreground)',
              marginBottom: 'var(--spacing-3)',
            }}
          >
            Claude Code などのMCPクライアントからバイクデータを参照できます
          </p>
          {error && !isAddModalOpen && (
            <p
              style={{
                color: 'var(--color-destructive)',
                fontSize: 'var(--font-size-sm)',
                marginBottom: 'var(--spacing-2)',
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
            keys.map((key, index) => (
              <div key={key.apiKeyId}>
                {index > 0 && (
                  <hr
                    style={{
                      border: 'none',
                      borderTop: '1px solid var(--color-border)',
                      margin: 0,
                    }}
                  />
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--spacing-3) 0',
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontWeight: 600,
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
              </div>
            ))
          )}
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
