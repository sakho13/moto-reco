import { describe, expect, test } from 'vitest'
import { createGuestUser, createTestUser } from '../helpers/authHelper'
import { createTestUserBike } from '../helpers/bikeHelper'
import { issueTestMcpAccessToken } from '../helpers/mcpHelper'
import { createTestSpot, createTestTouring } from '../helpers/touringHelper'
import { mcpApp } from '@/lib/api/server/mcpApp'

async function postMcp(body: unknown, accessToken?: string) {
  return mcpApp.request('/api/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/mcp', () => {
  test('Authorizationヘッダーがない → 401、WWW-Authenticateヘッダー付き', async () => {
    const res = await postMcp({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
    })

    expect(res.status).toBe(401)
    expect(res.headers.get('www-authenticate')).toContain('resource_metadata=')
    const json = await res.json()
    expect(json.error.code).toBe(-32001)
  })

  test('不正なアクセストークン → 401', async () => {
    const res = await postMcp(
      { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      'mcpat_invalid-token'
    )

    expect(res.status).toBe(401)
  })

  test('ゲストアカウントに紐づくアクセストークン → 401', async () => {
    const guest = await createGuestUser()
    const accessToken = await issueTestMcpAccessToken(guest.userId)

    const res = await postMcp(
      { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      accessToken
    )

    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error.code).toBe(-32001)
  })

  test('不正なJSONボディ → 400 Parse error', async () => {
    const user = await createTestUser()
    const accessToken = await issueTestMcpAccessToken(user.userId)

    const res = await mcpApp.request('/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: '{invalid-json',
    })

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error.code).toBe(-32700)
  })

  test('通知（idなし） → 202で本文なし', async () => {
    const user = await createTestUser()
    const accessToken = await issueTestMcpAccessToken(user.userId)

    const res = await postMcp(
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      accessToken
    )

    expect(res.status).toBe(202)
  })

  test('initializeリクエスト → serverInfoが返る', async () => {
    const user = await createTestUser()
    const accessToken = await issueTestMcpAccessToken(user.userId)

    const res = await postMcp(
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'vitest', version: '1.0.0' },
        },
      },
      accessToken
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.result.serverInfo.name).toBe('motoreco')
  })

  test('tools/list → READ系の6ツールが返る', async () => {
    const user = await createTestUser()
    const accessToken = await issueTestMcpAccessToken(user.userId, ['READ'])

    const res = await postMcp(
      { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      accessToken
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    const toolNames = json.result.tools.map((t: { name: string }) => t.name)
    expect(toolNames).toEqual(
      expect.arrayContaining([
        'list_bikes',
        'list_touring_plans',
        'get_touring_plan',
        'list_touring_history',
        'get_touring_history',
        'get_maintenance_status',
      ])
    )
  })

  test('list_bikesツール呼び出し → 未登録の場合は空配列', async () => {
    const user = await createTestUser()
    const accessToken = await issueTestMcpAccessToken(user.userId)

    const res = await postMcp(
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: 'list_bikes', arguments: {} },
      },
      accessToken
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.result.isError).toBeUndefined()
    expect(JSON.parse(json.result.content[0].text)).toEqual([])
  })

  test('get_touring_historyツール呼び出し → 立ち寄りスポットが含まれる', async () => {
    const user = await createTestUser()
    const accessToken = await issueTestMcpAccessToken(user.userId)
    const { myUserBikeId } = await createTestUserBike(user.token, {
      displacement: 400,
    })
    const touringId = await createTestTouring(user.token, myUserBikeId, {
      title: 'テストツーリング',
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-01-01T10:00:00.000Z',
    })
    await createTestSpot(user.token, myUserBikeId, touringId, {
      name: '道の駅テスト',
      latitude: 35.0,
      longitude: 135.0,
    })

    const res = await postMcp(
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'get_touring_history',
          arguments: { myUserBikeId, touringId },
        },
      },
      accessToken
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.result.isError).toBeUndefined()
    const result = JSON.parse(json.result.content[0].text)
    expect(result.spots).toHaveLength(1)
    expect(result.spots[0]).toMatchObject({
      name: '道の駅テスト',
      latitude: 35.0,
      longitude: 135.0,
    })
  })

  test('存在しないツール呼び出し → isError: trueのレスポンス', async () => {
    const user = await createTestUser()
    const accessToken = await issueTestMcpAccessToken(user.userId)

    const res = await postMcp(
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: 'unknown_tool', arguments: {} },
      },
      accessToken
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.error ?? json.result?.isError).toBeTruthy()
  })
})
