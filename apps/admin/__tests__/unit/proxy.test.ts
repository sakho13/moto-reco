import { NextRequest } from 'next/server'
import { afterEach, describe, expect, test, vi } from 'vitest'

const ALLOWED_IP = '203.0.113.10'
const DENIED_IP = '198.51.100.1'

const loadProxy = async (allowedIps: string) => {
  vi.resetModules()
  vi.stubEnv('ALLOWED_IPS', allowedIps)
  const { proxy } = await import('@/proxy')
  return proxy
}

const buildRequest = (forwardedFor?: string) =>
  new NextRequest('http://localhost/users', {
    headers: forwardedFor ? { 'x-forwarded-for': forwardedFor } : {},
  })

describe('proxy', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test('ALLOWED_IPS 未設定の場合は制限しない', async () => {
    const proxy = await loadProxy('')
    expect(proxy(buildRequest()).status).toBe(200)
  })

  test('許可IPからのリクエストは通過する', async () => {
    const proxy = await loadProxy(ALLOWED_IP)
    expect(proxy(buildRequest(ALLOWED_IP)).status).toBe(200)
  })

  test('許可されていないIPからのリクエストは403となる', async () => {
    const proxy = await loadProxy(ALLOWED_IP)
    expect(proxy(buildRequest(DENIED_IP)).status).toBe(403)
  })

  test('X-Forwarded-For がない場合は403となる', async () => {
    const proxy = await loadProxy(ALLOWED_IP)
    expect(proxy(buildRequest()).status).toBe(403)
  })

  test('クライアントが先頭に許可IPを偽装しても末尾の実IPで判定し403となる', async () => {
    const proxy = await loadProxy(ALLOWED_IP)
    expect(proxy(buildRequest(`${ALLOWED_IP}, ${DENIED_IP}`)).status).toBe(403)
  })

  test('クライアント送信の値の後ろに許可IPが追記された場合は通過する', async () => {
    const proxy = await loadProxy(ALLOWED_IP)
    expect(proxy(buildRequest(`${DENIED_IP}, ${ALLOWED_IP}`)).status).toBe(200)
  })

  test('複数の許可IPのいずれかに一致すれば通過する', async () => {
    const proxy = await loadProxy(`192.0.2.1, ${ALLOWED_IP}`)
    expect(proxy(buildRequest(ALLOWED_IP)).status).toBe(200)
  })
})
