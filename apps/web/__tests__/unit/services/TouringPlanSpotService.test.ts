import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  createMyUserBikeId,
  createTouringPlanId,
  createTouringPlanSpotId,
  createUserId,
  TouringPlan,
} from '@repo/shared-types'
import { MyUserBikeEntity } from '@/lib/api/server/entities/MyUserBikeEntity'
import { TouringPlanEntity } from '@/lib/api/server/entities/TouringPlanEntity'
import { TouringPlanSpotEntity } from '@/lib/api/server/entities/TouringPlanSpotEntity'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { IMyUserBikeRepository } from '@/lib/api/server/interfaces/IMyUserBikeRepository'
import { ITouringPlanRepository } from '@/lib/api/server/interfaces/ITouringPlanRepository'
import { ITouringPlanSpotRepository } from '@/lib/api/server/interfaces/ITouringPlanSpotRepository'
import { TouringPlanSpotService } from '@/lib/api/server/services/TouringPlanSpotService'

const myUserBikeId = createMyUserBikeId('bike-1')
const userId = createUserId('user-1')
const planId = createTouringPlanId('plan-1')

const buildPlan = (overrides: Partial<TouringPlan> = {}) => {
  return new TouringPlanEntity({
    touringPlanId: planId,
    myUserBikeId,
    title: '日帰り箱根ツーリング',
    departAt: new Date('2026-07-01T08:00:00.000Z'),
    returnAt: new Date('2026-07-01T08:00:00.000Z'),
    ...overrides,
  })
}

const buildPlanSpot = (
  overrides: Partial<{
    touringPlanSpotId: ReturnType<typeof createTouringPlanSpotId>
    type: 'START' | 'SPOT' | 'BREAK' | 'DESTINATION'
    name: string | null
    memo: string | null
    latitude: number | null
    longitude: number | null
    plannedArrivalAt: Date | null
    plannedDepartureAt: Date | null
    sortOrder: number
  }> = {}
) => {
  return new TouringPlanSpotEntity({
    touringPlanSpotId: createTouringPlanSpotId('plan-spot-1'),
    touringPlanId: planId,
    type: 'SPOT',
    name: null,
    memo: null,
    latitude: null,
    longitude: null,
    plannedArrivalAt: null,
    plannedDepartureAt: null,
    sortOrder: 0,
    ...overrides,
  })
}

describe('TouringPlanSpotService', () => {
  let touringPlanSpotRepository: ITouringPlanSpotRepository
  let touringPlanRepository: ITouringPlanRepository
  let myUserBikeRepository: IMyUserBikeRepository
  let service: TouringPlanSpotService

  beforeEach(() => {
    touringPlanSpotRepository = {
      createPlanSpot: vi.fn(),
      findPlanSpotsByPlanId: vi.fn().mockResolvedValue([]),
      findPlanSpotById: vi.fn(),
      findPlanSpotByType: vi.fn().mockResolvedValue(null),
      updatePlanSpot: vi.fn(),
      deletePlanSpot: vi.fn(),
      reorderPlanSpots: vi.fn(),
      shiftSortOrdersFrom: vi.fn(),
      upsertSingletonSpot: vi.fn(),
    }
    touringPlanRepository = {
      createPlan: vi.fn(),
      updatePlan: vi.fn().mockImplementation(async (p) => p),
      findPlans: vi.fn(),
      findPlanById: vi.fn().mockResolvedValue(buildPlan()),
      deletePlan: vi.fn(),
    }
    myUserBikeRepository = {
      createMyUserBike: vi.fn(),
      findMyUserBikes: vi.fn(),
      findPublicBikesByUserId: vi.fn(),
      findMyUserBikeById: vi
        .fn()
        .mockResolvedValue({} as unknown as MyUserBikeEntity),
      updateMyUserBike: vi.fn(),
      updateTotalMileage: vi.fn(),
      findMyUserBikeDetail: vi.fn(),
      countOwnedBikes: vi.fn(),
      findMyUserBikeTotalMileage: vi.fn(),
    }

    service = new TouringPlanSpotService(
      touringPlanSpotRepository,
      touringPlanRepository,
      myUserBikeRepository
    )
  })

  describe('registerPlanSpot', () => {
    test('プランが存在しない場合はNOT_FOUNDエラーになる', async () => {
      vi.mocked(touringPlanRepository.findPlanById).mockResolvedValue(null)

      await expect(
        service.registerPlanSpot({
          planId,
          myUserBikeId,
          userId,
          type: 'SPOT',
        })
      ).rejects.toThrow(ApiV1Error)
    })

    test('経由地を末尾のsortOrderで追加できる', async () => {
      const existing = [
        buildPlanSpot({ type: 'SPOT', sortOrder: 0 }),
        buildPlanSpot({ type: 'BREAK', sortOrder: 1 }),
      ]
      vi.mocked(touringPlanSpotRepository.findPlanSpotsByPlanId)
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(existing)
      vi.mocked(touringPlanSpotRepository.createPlanSpot).mockImplementation(
        async (spot) => spot
      )

      const result = await service.registerPlanSpot({
        planId,
        myUserBikeId,
        userId,
        type: 'SPOT',
        name: '新しい経由地',
      })

      expect(result.sortOrder).toBe(2)
      expect(result.type).toBe('SPOT')
    })
  })

  describe('getPlanSpots', () => {
    test('START -> 経由地・休憩(sortOrder順) -> DESTINATION の順で返す', async () => {
      const start = buildPlanSpot({ type: 'START', sortOrder: 0 })
      const waypoint2 = buildPlanSpot({
        touringPlanSpotId: createTouringPlanSpotId('plan-spot-2'),
        type: 'BREAK',
        sortOrder: 1,
      })
      const waypoint1 = buildPlanSpot({
        touringPlanSpotId: createTouringPlanSpotId('plan-spot-3'),
        type: 'SPOT',
        sortOrder: 0,
      })
      const destination = buildPlanSpot({
        touringPlanSpotId: createTouringPlanSpotId('plan-spot-4'),
        type: 'DESTINATION',
        sortOrder: 9999,
      })

      vi.mocked(
        touringPlanSpotRepository.findPlanSpotsByPlanId
      ).mockResolvedValue([waypoint2, start, destination, waypoint1])

      const result = await service.getPlanSpots(planId, myUserBikeId, userId)

      expect(result.map((s) => s.id)).toEqual([
        'plan-spot-1', // START
        'plan-spot-3', // SPOT sortOrder 0
        'plan-spot-2', // BREAK sortOrder 1
        'plan-spot-4', // DESTINATION
      ])
    })
  })

  describe('updatePlanSpot', () => {
    test('対象スポットが存在しない場合はNOT_FOUNDエラーになる', async () => {
      vi.mocked(touringPlanSpotRepository.findPlanSpotById).mockResolvedValue(
        null
      )

      await expect(
        service.updatePlanSpot({
          spotId: createTouringPlanSpotId('plan-spot-1'),
          planId,
          myUserBikeId,
          userId,
          name: '更新後',
        })
      ).rejects.toThrow(ApiV1Error)
    })

    test('START/DESTINATIONは更新できない', async () => {
      const startSpot = buildPlanSpot({ type: 'START' })
      vi.mocked(touringPlanSpotRepository.findPlanSpotById).mockResolvedValue(
        startSpot
      )

      await expect(
        service.updatePlanSpot({
          spotId: startSpot.id,
          planId,
          myUserBikeId,
          userId,
          name: '更新後',
        })
      ).rejects.toThrow('出発地・目的地はこのAPIから更新できません')
    })

    test('経由地の名前・メモを更新できる', async () => {
      const spot = buildPlanSpot({ type: 'SPOT', name: '旧名称' })
      vi.mocked(touringPlanSpotRepository.findPlanSpotById).mockResolvedValue(
        spot
      )
      vi.mocked(touringPlanSpotRepository.updatePlanSpot).mockImplementation(
        async (s) => s
      )

      const result = await service.updatePlanSpot({
        spotId: spot.id,
        planId,
        myUserBikeId,
        userId,
        name: '新名称',
      })

      expect(result.name).toBe('新名称')
    })

    test('plannedDepartureAt更新後はプランのreturnAtが再計算される', async () => {
      const spot = buildPlanSpot({ type: 'SPOT' })
      vi.mocked(touringPlanSpotRepository.findPlanSpotById).mockResolvedValue(
        spot
      )
      vi.mocked(touringPlanSpotRepository.updatePlanSpot).mockImplementation(
        async (s) => s
      )
      const newPlannedDepartureAt = new Date('2026-07-02T12:00:00.000Z')
      vi.mocked(
        touringPlanSpotRepository.findPlanSpotsByPlanId
      ).mockResolvedValue([
        new TouringPlanSpotEntity({
          ...spot.toJson(),
          plannedDepartureAt: newPlannedDepartureAt,
        }),
      ])

      await service.updatePlanSpot({
        spotId: spot.id,
        planId,
        myUserBikeId,
        userId,
        plannedDepartureAt: newPlannedDepartureAt,
      })

      const passedPlan = vi.mocked(touringPlanRepository.updatePlan).mock
        .calls[0]?.[0]
      expect(passedPlan?.returnAt).toEqual(newPlannedDepartureAt)
    })
  })

  describe('deletePlanSpot', () => {
    test('START/DESTINATIONは削除できない', async () => {
      const destinationSpot = buildPlanSpot({ type: 'DESTINATION' })
      vi.mocked(touringPlanSpotRepository.findPlanSpotById).mockResolvedValue(
        destinationSpot
      )

      await expect(
        service.deletePlanSpot(destinationSpot.id, planId, myUserBikeId, userId)
      ).rejects.toThrow('出発地・目的地はこのAPIから削除できません')
    })

    test('経由地を削除できる', async () => {
      const spot = buildPlanSpot({ type: 'SPOT' })
      vi.mocked(touringPlanSpotRepository.findPlanSpotById).mockResolvedValue(
        spot
      )
      vi.mocked(
        touringPlanSpotRepository.findPlanSpotsByPlanId
      ).mockResolvedValue([])

      await service.deletePlanSpot(spot.id, planId, myUserBikeId, userId)

      expect(touringPlanSpotRepository.deletePlanSpot).toHaveBeenCalledWith(
        spot.id,
        planId
      )
    })
  })

  describe('setStartSpot', () => {
    test('出発地を新規設定できる', async () => {
      const startSpot = buildPlanSpot({
        type: 'START',
        latitude: 35.6812,
        longitude: 139.7671,
      })
      vi.mocked(
        touringPlanSpotRepository.upsertSingletonSpot
      ).mockResolvedValue(startSpot)

      const result = await service.setStartSpot(planId, myUserBikeId, userId, {
        latitude: 35.6812,
        longitude: 139.7671,
      })

      expect(result).toBe(startSpot)
      expect(
        touringPlanSpotRepository.upsertSingletonSpot
      ).toHaveBeenCalledWith(
        planId,
        'START',
        expect.objectContaining({ latitude: 35.6812, longitude: 139.7671 })
      )
    })

    test('nullを指定すると出発地を解除できる', async () => {
      vi.mocked(
        touringPlanSpotRepository.upsertSingletonSpot
      ).mockResolvedValue(null)

      const result = await service.setStartSpot(
        planId,
        myUserBikeId,
        userId,
        null
      )

      expect(result).toBeNull()
      expect(
        touringPlanSpotRepository.upsertSingletonSpot
      ).toHaveBeenCalledWith(planId, 'START', null)
    })
  })

  describe('setDestinationSpot', () => {
    test('目的地を新規設定するとプランのreturnAtが到着予定に更新される', async () => {
      const plannedArrivalAt = new Date('2026-07-01T20:00:00.000Z')
      const destinationSpot = buildPlanSpot({
        type: 'DESTINATION',
        latitude: 35.2323,
        longitude: 139.1069,
        plannedArrivalAt,
      })
      vi.mocked(
        touringPlanSpotRepository.upsertSingletonSpot
      ).mockResolvedValue(destinationSpot)
      vi.mocked(
        touringPlanSpotRepository.findPlanSpotsByPlanId
      ).mockResolvedValue([destinationSpot])

      await service.setDestinationSpot(planId, myUserBikeId, userId, {
        latitude: 35.2323,
        longitude: 139.1069,
        plannedArrivalAt,
      })

      const passedPlan = vi.mocked(touringPlanRepository.updatePlan).mock
        .calls[0]?.[0]
      expect(passedPlan?.returnAt).toEqual(plannedArrivalAt)
    })
  })
})
