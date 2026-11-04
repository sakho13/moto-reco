import { describe, expect, it } from 'vitest'
import { resolveLongplayPlan } from '../../../lib/api/server/services/longplayPlan'

const user = {
  id: 'trusted-user',
  role: 'USER',
  status: 'ACTIVE',
  plan: 'FREE' as const,
}
const env = {
  LONGPLAY_PREMIUM_FEATURE_ID: '11111111-1111-4111-8111-111111111111',
  LONGPLAY_BASE_URL: 'https://billing.invalid',
  LONGPLAY_SECRET_KEY: 'server-key',
  LONGPLAY_APP_ID: 'app',
  LONGPLAY_ENVIRONMENT: 'sandbox',
}

describe('online Premium resolution', () => {
  it('does not initialize billing by default or for existing manual grants', async () => {
    const noClient = () => {
      throw new Error('must not initialize')
    }
    expect(await resolveLongplayPlan(user, {}, noClient)).toBe('FREE')
    expect(
      await resolveLongplayPlan({ ...user, plan: 'PREMIUM' }, env, noClient)
    ).toBe('PREMIUM')
  })
  it('never upgrades guests, administrators or inactive users', async () => {
    const noClient = () => {
      throw new Error('must not initialize')
    }
    for (const role of ['GUEST', 'ADMIN'])
      expect(await resolveLongplayPlan({ ...user, role }, env, noClient)).toBe(
        'FREE'
      )
    expect(
      await resolveLongplayPlan({ ...user, status: 'SUSPENDED' }, env, noClient)
    ).toBe('FREE')
  })
  it('uses the database identity and observes revocation on the next read', async () => {
    let allowed = true
    const fake = (() => ({
      getOrCreateCustomer: async (input: unknown) => {
        expect(input).toEqual({ externalUserId: 'motoreco:user:trusted-user' })
        return { customer: { id: 'customer' } }
      },
      checkEntitlement: async (input: unknown) => {
        expect(input).toEqual({
          customerId: 'customer',
          requirement: {
            internal_feature_id: env.LONGPLAY_PREMIUM_FEATURE_ID,
            quantity: '1',
            properties: {},
          },
        })
        return { check: { kind: 'access', allowed } }
      },
    })) as unknown as Parameters<typeof resolveLongplayPlan>[2]
    expect(await resolveLongplayPlan(user, env, fake)).toBe('PREMIUM')
    allowed = false
    expect(await resolveLongplayPlan(user, env, fake)).toBe('FREE')
  })
  it('keeps the base plan on configuration or service failure', async () => {
    expect(
      await resolveLongplayPlan(user, { LONGPLAY_PREMIUM_FEATURE_ID: 'set' })
    ).toBe('FREE')
    expect(
      await resolveLongplayPlan(user, env, () => {
        throw new Error('private')
      })
    ).toBe('FREE')
  })
  it('does not turn a credit observation into a Premium grant', async () => {
    const fake = (() => ({
      getOrCreateCustomer: async () => ({ customer: { id: 'customer' } }),
      checkEntitlement: async () => ({
        check: { kind: 'credit', allowed: true },
      }),
    })) as unknown as Parameters<typeof resolveLongplayPlan>[2]
    expect(await resolveLongplayPlan(user, env, fake)).toBe('FREE')
  })
})
