import { describe, expect, it, vi } from 'vitest'
import { createUserId } from '@repo/shared-types'
import { PrismaUserRepository } from '../../../lib/api/server/repositories/PrismaUserRepository'
import { resolveLongplayPlan } from '../../../lib/api/server/services/longplayPlan'
import { UserPlanService } from '../../../lib/api/server/services/UserPlanService'

vi.mock('../../../lib/api/server/repositories/PrismaRepositoryBase', () => ({
  PrismaRepositoryBase: class {
    constructor(public connection: unknown) {}
  },
}))
vi.mock('../../../lib/api/server/services/longplayPlan', () => ({
  resolveLongplayPlan: vi.fn(async () => 'PREMIUM'),
}))

describe('Premium uses the existing user entity and account read', () => {
  it('decorates only a row already resolved by the repository', async () => {
    const stored = {
      id: 'stored-user',
      name: 'Test',
      status: 'ACTIVE',
      role: 'USER',
      notificationEmail: null,
      isProfilePublic: false,
      planHistories: [{ plan: 'FREE' }],
    }
    const query = vi.fn(async () => stored)
    const repository = new PrismaUserRepository({
      mUser: { findFirst: query },
    } as never)
    const user = await repository.findById(createUserId('stored-user'))
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'stored-user', status: 'ACTIVE' },
      })
    )
    expect(resolveLongplayPlan).toHaveBeenCalledWith({
      ...stored,
      plan: 'FREE',
    })
    expect(user?.plan).toBe('PREMIUM')
  })
  it('returns the same effective plan to the existing plan-status service', async () => {
    const service = new UserPlanService(
      { findById: async () => ({ role: 'USER', plan: 'PREMIUM' }) } as never,
      {
        findCurrentPlanByUserId: () => {
          throw new Error('stale history must not override the effective plan')
        },
      } as never
    )
    expect(await service.getCurrentPlan(createUserId('stored-user'))).toBe(
      'PREMIUM'
    )
    const adminService = new UserPlanService(
      { findById: async () => ({ role: 'ADMIN', plan: 'PREMIUM' }) } as never,
      {} as never
    )
    expect(await adminService.getCurrentPlan(createUserId('admin'))).toBeNull()
  })
})
