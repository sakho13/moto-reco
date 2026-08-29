import { describe, expect, test } from 'vitest'
import { createGuestUser, createTestUser } from '../../helpers/authHelper'
import { app } from '@/lib/api/server/app'

describe('POST /api/v1/mcp/oauth/authorize', () => {
  test('ゲストアカウント → 403 FORBIDDEN（クライアント検証より前に拒否される）', async () => {
    const guest = await createGuestUser()

    const res = await app.request('/api/v1/mcp/oauth/authorize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${guest.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: 'mcpc_nonexistent',
        redirectUri: 'https://example.com/callback',
        codeChallenge: 'dummy-challenge',
        codeChallengeMethod: 'S256',
        decision: 'approve',
      }),
    })

    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.errorCode).toBe('FORBIDDEN')
  })

  test('通常ユーザー・未登録クライアント → 400 INVALID_REQUEST（ゲストチェックは通過する）', async () => {
    const user = await createTestUser()

    const res = await app.request('/api/v1/mcp/oauth/authorize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: 'mcpc_nonexistent',
        redirectUri: 'https://example.com/callback',
        codeChallenge: 'dummy-challenge',
        codeChallengeMethod: 'S256',
        decision: 'approve',
      }),
    })

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.errorCode).toBe('INVALID_REQUEST')
  })
})
