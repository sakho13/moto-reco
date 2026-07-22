'use client'

import { useCallback, useEffect, useState } from 'react'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { ModalBase } from '@/components/common/ModalBase'
import { apiGet, apiPatch, apiPost } from '@/lib/api/client'
import { withAuth } from '@/lib/hoc/withAuth'

type SystemApiKeyItem = {
  systemApiKeyId: string
  name: string
  prefix: string
  isActive: boolean
  lastUsedAt: string | null
  createdAt: string
}

type GeneratedKey = {
  systemApiKeyId: string
  name: string
  prefix: string
  fullKey: string
}

/**
 * システムAPIキー管理ページ（管理者専用）
 *
 * @remarks
 * 完全削除バッチ等の内部APIを保護する `MSystemApiKey` の発行・失効を行う。
 * このアプリで最初のADMIN専用画面。
 */
function SystemApiKeysPage() {
  const [role, setRole] = useState<string | null>(null)
  const [keys, setKeys] = useState<SystemApiKeyItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [generatedKey, setGeneratedKey] = useState<GeneratedKey | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchKeys = useCallback(async () => {
    try {
      const res = await apiGet('/api/v1/admin/system-api-keys')
      setKeys(res.data.systemApiKeys)
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'システムAPIキーの取得に失敗しました'
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    apiGet('/api/v1/user/profile')
      .then((res) => {
        setRole(res.data.role)
        if (res.data.role === 'ADMIN') {
          fetchKeys()
        } else {
          setIsLoading(false)
        }
      })
      .catch(() => setIsLoading(false))
  }, [fetchKeys])

  const handleOpenAddModal = () => {
    setNewKeyName('')
    setError(null)
    setIsAddModalOpen(true)
  }

  const handleGenerate = async () => {
    if (!newKeyName.trim()) return
    setIsGenerating(true)
    setError(null)
    try {
      const res = await apiPost('/api/v1/admin/system-api-keys', {
        name: newKeyName.trim(),
      })
      setGeneratedKey({
        systemApiKeyId: res.data.systemApiKeyId,
        name: res.data.name,
        prefix: res.data.prefix,
        fullKey: res.data.fullKey,
      })
      setNewKeyName('')
      setIsAddModalOpen(false)
      await fetchKeys()
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'システムAPIキーの発行に失敗しました'
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const handleToggleActive = async (key: SystemApiKeyItem) => {
    setError(null)
    try {
      await apiPatch(`/api/v1/admin/system-api-keys/${key.systemApiKeyId}`, {
        isActive: !key.isActive,
      })
      await fetchKeys()
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'システムAPIキーの更新に失敗しました'
      )
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

  if (isLoading) {
    return (
      <div className="w-full max-w-md flex flex-col gap-4">
        <BaseCard title="システムAPIキー管理">
          <p
            style={{
              color: 'var(--color-muted-foreground)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            読み込み中...
          </p>
        </BaseCard>
      </div>
    )
  }

  if (role !== 'ADMIN') {
    return (
      <div className="w-full max-w-md flex flex-col gap-4">
        <BaseCard title="システムAPIキー管理">
          <p
            style={{
              color: 'var(--color-destructive)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            このページは管理者のみ閲覧できます。
          </p>
        </BaseCard>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md flex flex-col gap-4">
      {isAddModalOpen && (
        <ModalBase
          title="新規システムAPIキー発行"
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
              キーの用途がわかる名前をつけてください（例: purge-quit-users
              batch）
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
              placeholder="キー名（例: GitHub Actions purge batch）"
              maxLength={50}
            />
            <Button
              onClick={handleGenerate}
              loading={isGenerating}
              disabled={!newKeyName.trim()}
              fullWidth
            >
              システムAPIキーを発行する
            </Button>
          </div>
        </ModalBase>
      )}

      {generatedKey && (
        <ModalBase
          title="システムAPIキーを発行しました"
          onClose={handleCloseModal}
        >
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

      <BaseCard
        title="システムAPIキー管理"
        headerAction={
          <Button variant="primary" size="sm" onClick={handleOpenAddModal}>
            ＋ 追加
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-muted-foreground)',
              marginBottom: 'var(--spacing-3)',
            }}
          >
            完全削除バッチなど、内部APIの認証に使用するシステム共通のAPIキーです。
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

          {keys.length === 0 ? (
            <p
              style={{
                color: 'var(--color-muted-foreground)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              システムAPIキーはまだ発行されていません
            </p>
          ) : (
            keys.map((key, index) => (
              <div key={key.systemApiKeyId}>
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
                      {!key.isActive && (
                        <span
                          style={{
                            marginLeft: 'var(--spacing-2)',
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--color-destructive)',
                          }}
                        >
                          失効済み
                        </span>
                      )}
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
                        marginTop: 'var(--spacing-1)',
                      }}
                    >
                      {new Date(key.createdAt).toLocaleDateString('ja-JP')} 発行
                      {key.lastUsedAt &&
                        ` / 最終利用: ${new Date(key.lastUsedAt).toLocaleDateString('ja-JP')}`}
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    outline={!key.isActive}
                    onClick={() => handleToggleActive(key)}
                  >
                    {key.isActive ? '失効させる' : '再有効化'}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </BaseCard>
    </div>
  )
}

export default withAuth(SystemApiKeysPage)
