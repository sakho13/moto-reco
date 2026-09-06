import { describe, expect, test } from 'vitest'
import { createGuestUser, createTestUser } from '../helpers/authHelper'
import { createTestUserBike } from '../helpers/bikeHelper'
import { issueTestMcpAccessToken, setTestUserPlan } from '../helpers/mcpHelper'
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

  const WRITE_TOOL_NAMES = [
    'create_touring_plan',
    'update_touring_plan',
    'delete_touring_plan',
    'set_touring_plan_start_location',
    'set_touring_plan_destination_location',
    'add_touring_plan_spot',
    'update_touring_plan_spot',
    'delete_touring_plan_spot',
    'reorder_touring_plan_spots',
  ]

  const READ_TOOL_NAMES = [
    'list_bikes',
    'list_touring_plans',
    'get_touring_plan',
    'list_touring_history',
    'get_touring_history',
    'get_maintenance_status',
  ]

  /** tools/call を呼び出し、isErrorが立たないことを確認してレスポンスのdataを返す */
  async function callWriteTool(
    accessToken: string,
    name: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    const res = await postMcp(
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name, arguments: args },
      },
      accessToken
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.result.isError).toBeUndefined()
    return JSON.parse(json.result.content[0].text)
  }

  test('WRITE系9ツールの正常系フロー: プラン作成〜スポット操作〜削除までが一連で成功する', async () => {
    const user = await createTestUser()
    await setTestUserPlan(user.userId, 'PREMIUM')
    const accessToken = await issueTestMcpAccessToken(user.userId, [
      'READ',
      'WRITE',
    ])
    const { myUserBikeId } = await createTestUserBike(user.token, {
      displacement: 400,
    })

    // create_touring_plan（出発地・目的地付き）
    const created = (await callWriteTool(accessToken, 'create_touring_plan', {
      myUserBikeId,
      title: 'テストツーリングプラン',
      startLocation: { latitude: 35.0, longitude: 135.0, name: '出発地' },
      destinationLocation: {
        latitude: 35.5,
        longitude: 135.5,
        name: '目的地',
      },
    })) as {
      touringPlanId: string
      title: string
      startLocation: { name: string } | null
      destinationLocation: { name: string } | null
    }
    const touringPlanId = created.touringPlanId
    expect(created.title).toBe('テストツーリングプラン')
    expect(created.startLocation).toMatchObject({ name: '出発地' })
    expect(created.destinationLocation).toMatchObject({ name: '目的地' })

    // update_touring_plan（titleを変更）
    const updated = (await callWriteTool(accessToken, 'update_touring_plan', {
      myUserBikeId,
      touringPlanId,
      title: '更新後タイトル',
    })) as { title: string }
    expect(updated.title).toBe('更新後タイトル')

    // add_touring_plan_spot を2件追加
    const spot1 = (await callWriteTool(accessToken, 'add_touring_plan_spot', {
      myUserBikeId,
      touringPlanId,
      type: 'SPOT',
      name: 'スポット1',
      latitude: 35.1,
      longitude: 135.1,
    })) as { touringPlanSpotId: string }
    const spot2 = (await callWriteTool(accessToken, 'add_touring_plan_spot', {
      myUserBikeId,
      touringPlanId,
      type: 'SPOT',
      name: 'スポット2',
      latitude: 35.2,
      longitude: 135.2,
    })) as { touringPlanSpotId: string }
    const spotId1 = spot1.touringPlanSpotId
    const spotId2 = spot2.touringPlanSpotId

    // update_touring_plan_spot（1件目のmemoを変更）
    const updatedSpot = (await callWriteTool(
      accessToken,
      'update_touring_plan_spot',
      { myUserBikeId, touringPlanId, spotId: spotId1, memo: '更新後メモ' }
    )) as { memo: string | null }
    expect(updatedSpot.memo).toBe('更新後メモ')

    // reorder_touring_plan_spots（逆順に）
    // レスポンスにはSTART/DESTINATIONも含まれる（プラン全スポット一覧のため）
    const reordered = (await callWriteTool(
      accessToken,
      'reorder_touring_plan_spots',
      { myUserBikeId, touringPlanId, spotIds: [spotId2, spotId1] }
    )) as { touringPlanSpotId: string; type: string }[]
    const reorderedWaypointIds = reordered
      .filter((s) => s.type === 'SPOT')
      .map((s) => s.touringPlanSpotId)
    expect(reorderedWaypointIds).toEqual([spotId2, spotId1])

    // set_touring_plan_start_location（出発地を更新）
    const startLocation = (await callWriteTool(
      accessToken,
      'set_touring_plan_start_location',
      {
        myUserBikeId,
        touringPlanId,
        location: { latitude: 36.0, longitude: 136.0, name: '新出発地' },
      }
    )) as { name: string | null }
    expect(startLocation.name).toBe('新出発地')

    // set_touring_plan_destination_location（nullで解除）
    const destinationLocation = await callWriteTool(
      accessToken,
      'set_touring_plan_destination_location',
      { myUserBikeId, touringPlanId, location: null }
    )
    expect(destinationLocation).toBeNull()

    // delete_touring_plan_spot（1件削除）
    const deletedSpot = await callWriteTool(
      accessToken,
      'delete_touring_plan_spot',
      { myUserBikeId, touringPlanId, spotId: spotId1 }
    )
    expect(deletedSpot).toEqual({ spotId: spotId1, deleted: true })

    // delete_touring_plan（プラン削除）
    const deletedPlan = await callWriteTool(
      accessToken,
      'delete_touring_plan',
      { myUserBikeId, touringPlanId }
    )
    expect(deletedPlan).toEqual({ touringPlanId, deleted: true })

    // 削除後、list_touring_plansに含まれないこと
    const list = (await callWriteTool(accessToken, 'list_touring_plans', {
      myUserBikeId,
    })) as { touringPlanId: string }[]
    expect(list.map((p) => p.touringPlanId)).not.toContain(touringPlanId)

    // 削除後、get_touring_planはisErrorになること
    const getRes = await postMcp(
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'get_touring_plan',
          arguments: { myUserBikeId, touringPlanId },
        },
      },
      accessToken
    )
    const getJson = await getRes.json()
    expect(getJson.result.isError).toBe(true)
  })

  test('tools/list（PREMIUM + READ,WRITE）→ READ6種+WRITE9種の計15ツールが返る', async () => {
    const user = await createTestUser()
    await setTestUserPlan(user.userId, 'PREMIUM')
    const accessToken = await issueTestMcpAccessToken(user.userId, [
      'READ',
      'WRITE',
    ])

    const res = await postMcp(
      { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      accessToken
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    const toolNames = json.result.tools.map((t: { name: string }) => t.name)
    expect(toolNames).toHaveLength(15)
    expect(toolNames).toEqual(
      expect.arrayContaining([...READ_TOOL_NAMES, ...WRITE_TOOL_NAMES])
    )
  })

  test('実効スコープ計算: FREEプランのユーザーにWRITEを含むトークンを発行してもWRITE系ツールは登録されない', async () => {
    const user = await createTestUser()
    // createTestUser直後はFREE相当（setTestUserPlanは呼ばない）。
    // 本来のOAuthフローではWRITEは付与されないが、MCPサーバー側の実効スコープ計算のみで
    // 防げることを検証するため、あえて直接WRITEを含むトークンを発行する。
    const accessToken = await issueTestMcpAccessToken(user.userId, [
      'READ',
      'WRITE',
    ])

    const res = await postMcp(
      { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      accessToken
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    const toolNames = json.result.tools.map((t: { name: string }) => t.name)
    expect(toolNames).toEqual(expect.arrayContaining(READ_TOOL_NAMES))
    for (const writeToolName of WRITE_TOOL_NAMES) {
      expect(toolNames).not.toContain(writeToolName)
    }
  })

  test('実効スコープ計算: FREEユーザーのWRITEトークンでcreate_touring_planを呼ぶと未登録ツールとしてエラーになる', async () => {
    const user = await createTestUser()
    const accessToken = await issueTestMcpAccessToken(user.userId, [
      'READ',
      'WRITE',
    ])

    const res = await postMcp(
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'create_touring_plan',
          arguments: { myUserBikeId: 'dummy', title: 'テスト' },
        },
      },
      accessToken
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.error ?? json.result?.isError).toBeTruthy()
  })
})
