import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type MockUser = { getIdToken: () => Promise<string> }

const mockAuth: {
  currentUser: MockUser | null
  authStateReady: () => Promise<void>
} = {
  currentUser: null,
  authStateReady: async () => {},
}

vi.mock('@/lib/firebase/config', () => ({
  getFirebaseAuth: () => mockAuth,
}))

const { authenticatedFetch } = await import('@/lib/api/client')

describe('authenticatedFetch', () => {
  const fetchMock = vi.fn(async () => new Response('{}'))

  beforeEach(() => {
    mockAuth.currentUser = null
    mockAuth.authStateReady = async () => {}
    fetchMock.mockClear()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('認証状態の復元完了を待ってから IDトークンを付与してリクエストする', async () => {
    mockAuth.authStateReady = async () => {
      mockAuth.currentUser = { getIdToken: async () => 'restored-token' }
    }

    await authenticatedFetch('/api/v1/user/profile', { method: 'GET' })

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/user/profile', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer restored-token',
        'Content-Type': 'application/json',
      },
    })
  })

  it('認証状態の復元後も未ログインの場合はリクエストせずエラーを投げる', async () => {
    await expect(
      authenticatedFetch('/api/v1/user/profile', { method: 'GET' })
    ).rejects.toThrow('認証されていません')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
