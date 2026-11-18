import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApiClient, handleApiResponse } from '@repo/api-client'
import { ApiV1Error } from '@repo/shared-domain'

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), init)

describe('handleApiResponse', () => {
  it('成功レスポンスはそのまま返す', async () => {
    const body = { status: 'success', data: { id: '1' } }
    await expect(handleApiResponse(jsonResponse(body))).resolves.toEqual(body)
  })

  it('エラーレスポンスはエラーコードとメッセージを持つ ApiV1Error を投げる', async () => {
    const response = jsonResponse(
      { status: 'error', errorCode: 'USER_QUIT', message: '退会済みです' },
      { status: 403 }
    )
    const error = await handleApiResponse(response).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiV1Error)
    expect((error as ApiV1Error).errorCode).toBe('USER_QUIT')
    expect((error as ApiV1Error).message).toBe('退会済みです')
  })

  it('HTTP ステータスが失敗でボディがエラー形式でなければ SERVER_ERROR を投げる', async () => {
    const response = jsonResponse(
      {},
      { status: 502, statusText: 'Bad Gateway' }
    )
    const error = await handleApiResponse(response).catch((e: unknown) => e)
    expect((error as ApiV1Error).errorCode).toBe('SERVER_ERROR')
    expect((error as ApiV1Error).message).toBe('HTTP 502: Bad Gateway')
  })

  it('JSON として読めなければ SERVER_ERROR を投げる', async () => {
    const response = new Response('<html></html>', { status: 500 })
    const error = await handleApiResponse(response).catch((e: unknown) => e)
    expect((error as ApiV1Error).errorCode).toBe('SERVER_ERROR')
  })
})

describe('createApiClient', () => {
  const fetchMock = vi.fn(async () =>
    jsonResponse({ status: 'success', data: null })
  )

  beforeEach(() => {
    fetchMock.mockClear()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('baseUrl を先頭に付け、IDトークンを Authorization ヘッダーに付ける', async () => {
    const { apiPost } = createApiClient({
      baseUrl: 'https://api.example.com',
      getIdToken: async () => 'token-1',
    })

    await apiPost('/api/v1/user/auth/register', { name: '太郎' })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/user/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ name: '太郎' }),
        headers: {
          Authorization: 'Bearer token-1',
          'Content-Type': 'application/json',
        },
      }
    )
  })

  it('IDトークンが無ければリクエストせずエラーを投げる', async () => {
    const { apiGet } = createApiClient({
      baseUrl: '',
      getIdToken: async () => null,
    })

    await expect(apiGet('/api/v1/user/profile')).rejects.toThrow(
      '認証されていません'
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('apiPostPublic は IDトークンを取得せず Authorization ヘッダーも付けない', async () => {
    const getIdToken = vi.fn(async () => 'token-1')
    const { apiPostPublic } = createApiClient({ baseUrl: '', getIdToken })

    await apiPostPublic('/api/v1/user/auth/recover', { email: 'a@example.com' })

    expect(getIdToken).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/user/auth/recover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@example.com' }),
    })
  })
})
