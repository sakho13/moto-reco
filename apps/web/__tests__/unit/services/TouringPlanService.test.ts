import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  createMyUserBikeId,
  createTouringId,
  createTouringPlanId,
  createTouringPlanSpotId,
  createUserId,
  TouringPlan,
} from '@repo/shared-types'
import { MyUserBikeEntity } from '@/lib/api/server/entities/MyUserBikeEntity'
import { TouringEntity } from '@/lib/api/server/entities/TouringEntity'
import { TouringPlanEntity } from '@/lib/api/server/entities/TouringPlanEntity'
import { TouringPlanSpotEntity } from '@/lib/api/server/entities/TouringPlanSpotEntity'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { IMyUserBikeRepository } from '@/lib/api/server/interfaces/IMyUserBikeRepository'
import { ITouringPlanRepository } from '@/lib/api/server/interfaces/ITouringPlanRepository'
import { ITouringPlanSpotRepository } from '@/lib/api/server/interfaces/ITouringPlanSpotRepository'
import { ITouringRepository } from '@/lib/api/server/interfaces/ITouringRepository'
import { TouringPlanService } from '@/lib/api/server/services/TouringPlanService'

const myUserBikeId = createMyUserBikeId('bike-1')
const userId = createUserId('user-1')

const buildPlan = (overrides: Partial<TouringPlan> = {}) => {
  return new TouringPlanEntity({
    touringPlanId: createTouringPlanId('plan-1'),
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
    touringPlanId: createTouringPlanId('plan-1'),
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

describe('TouringPlanService', () => {
  let touringPlanRepository: ITouringPlanRepository
  let touringPlanSpotRepository: ITouringPlanSpotRepository
  let touringRepository: ITouringRepository
  let myUserBikeRepository: IMyUserBikeRepository
  let service: TouringPlanService

  beforeEach(() => {
    touringPlanRepository = {
      createPlan: vi.fn(),
      updatePlan: vi.fn(),
      findPlans: vi.fn(),
      findPlanById: vi.fn(),
      deletePlan: vi.fn(),
    }
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
    touringRepository = {
      createTouring: vi.fn(),
      updateTouring: vi.fn(),
      findTourings: vi.fn(),
      findTouringById: vi.fn(),
      findOngoingTouring: vi.fn(),
      updateTouringStatus: vi.fn(),
      deleteTouring: vi.fn(),
      countTourings: vi.fn(),
      findTouringsByPlanId: vi.fn().mockResolvedValue([]),
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

    service = new TouringPlanService(
      touringPlanRepository,
      touringPlanSpotRepository,
      touringRepository,
      myUserBikeRepository
    )
  })

  describe('registerPlan', () => {
    test('バイクが存在しない場合はNOT_FOUNDエラーになる', async () => {
      vi.mocked(myUserBikeRepository.findMyUserBikeById).mockResolvedValue(null)

      await expect(
        service.registerPlan({
          myUserBikeId,
          userId,
          title: 'プラン',
          departAt: new Date('2026-07-01T08:00:00.000Z'),
        })
      ).rejects.toThrow(ApiV1Error)
    })

    test('出発地・目的地を指定しない場合はプランのみ作成される', async () => {
      const createdPlan = buildPlan()
      vi.mocked(touringPlanRepository.createPlan).mockResolvedValue(createdPlan)

      const result = await service.registerPlan({
        myUserBikeId,
        userId,
        title: '日帰り箱根ツーリング',
        departAt: new Date('2026-07-01T08:00:00.000Z'),
      })

      expect(result.plan).toBe(createdPlan)
      expect(result.startSpot).toBeNull()
      expect(result.destinationSpot).toBeNull()
      expect(touringPlanSpotRepository.createPlanSpot).not.toHaveBeenCalled()

      const passedPlan = vi.mocked(touringPlanRepository.createPlan).mock
        .calls[0]?.[0]
      expect(passedPlan?.returnAt).toEqual(new Date('2026-07-01T08:00:00.000Z'))
    })

    test('目的地の到着予定が指定された場合returnAtに反映される', async () => {
      const createdPlan = buildPlan({
        returnAt: new Date('2026-07-01T18:00:00.000Z'),
      })
      vi.mocked(touringPlanRepository.createPlan).mockResolvedValue(createdPlan)
      vi.mocked(touringPlanSpotRepository.createPlanSpot).mockImplementation(
        async (spot) => spot
      )

      const result = await service.registerPlan({
        myUserBikeId,
        userId,
        title: '日帰り箱根ツーリング',
        departAt: new Date('2026-07-01T08:00:00.000Z'),
        startLocation: { latitude: 35.6812, longitude: 139.7671 },
        destinationLocation: {
          latitude: 35.2323,
          longitude: 139.1069,
          plannedArrivalAt: new Date('2026-07-01T18:00:00.000Z'),
        },
      })

      expect(result.startSpot?.type).toBe('START')
      expect(result.destinationSpot?.type).toBe('DESTINATION')

      const passedPlan = vi.mocked(touringPlanRepository.createPlan).mock
        .calls[0]?.[0]
      expect(passedPlan?.returnAt).toEqual(new Date('2026-07-01T18:00:00.000Z'))
    })
  })

  describe('getPlans', () => {
    test('バイクが存在しない場合はNOT_FOUNDエラーになる', async () => {
      vi.mocked(myUserBikeRepository.findMyUserBikeById).mockResolvedValue(null)

      await expect(service.getPlans(myUserBikeId, userId)).rejects.toThrow(
        ApiV1Error
      )
    })

    test('プラン一覧と目的地情報を取得できる', async () => {
      const plan = buildPlan()
      const destinationSpot = buildPlanSpot({ type: 'DESTINATION' })
      vi.mocked(touringPlanRepository.findPlans).mockResolvedValue([plan])
      vi.mocked(touringPlanSpotRepository.findPlanSpotByType).mockResolvedValue(
        destinationSpot
      )

      const result = await service.getPlans(myUserBikeId, userId)

      expect(result).toHaveLength(1)
      expect(result[0]?.plan).toBe(plan)
      expect(result[0]?.destinationSpot).toBe(destinationSpot)
    })
  })

  describe('getPlanById', () => {
    test('プランが存在しない場合はNOT_FOUNDエラーになる', async () => {
      vi.mocked(touringPlanRepository.findPlanById).mockResolvedValue(null)

      await expect(
        service.getPlanById(createTouringPlanId('plan-1'), myUserBikeId, userId)
      ).rejects.toThrow(ApiV1Error)
    })

    test('プラン詳細と紐づくツーリングID一覧を取得できる', async () => {
      const plan = buildPlan()
      const startSpot = buildPlanSpot({ type: 'START' })
      const destinationSpot = buildPlanSpot({ type: 'DESTINATION' })
      const touring = new TouringEntity({
        touringId: createTouringId('touring-1'),
        myUserBikeId,
        touringPlanId: plan.id,
        title: '日帰り箱根ツーリング',
        startDate: new Date('2026-07-01T08:00:00.000Z'),
        endDate: new Date('2026-07-01T08:00:00.000Z'),
        startMileage: null,
        endMileage: null,
        startLatitude: null,
        startLongitude: null,
        endLatitude: null,
        endLongitude: null,
        status: 'STARTED',
      })

      vi.mocked(touringPlanRepository.findPlanById).mockResolvedValue(plan)
      vi.mocked(
        touringPlanSpotRepository.findPlanSpotByType
      ).mockImplementation(async (_planId, type) =>
        type === 'START' ? startSpot : destinationSpot
      )
      vi.mocked(touringRepository.findTouringsByPlanId).mockResolvedValue([
        touring,
      ])

      const result = await service.getPlanById(plan.id, myUserBikeId, userId)

      expect(result.plan).toBe(plan)
      expect(result.startSpot).toBe(startSpot)
      expect(result.destinationSpot).toBe(destinationSpot)
      expect(result.touringIds).toEqual(['touring-1'])
    })
  })

  describe('updatePlan', () => {
    test('プランが存在しない場合はNOT_FOUNDエラーになる', async () => {
      vi.mocked(touringPlanRepository.findPlanById).mockResolvedValue(null)

      await expect(
        service.updatePlan({
          planId: createTouringPlanId('plan-1'),
          myUserBikeId,
          userId,
          title: '新しいタイトル',
        })
      ).rejects.toThrow(ApiV1Error)
    })

    test('タイトルのみ更新する場合returnAtは再計算されない', async () => {
      const plan = buildPlan({
        returnAt: new Date('2026-07-01T18:00:00.000Z'),
      })
      vi.mocked(touringPlanRepository.findPlanById).mockResolvedValue(plan)
      vi.mocked(touringPlanRepository.updatePlan).mockImplementation(
        async (p) => p
      )

      await service.updatePlan({
        planId: plan.id,
        myUserBikeId,
        userId,
        title: '新しいタイトル',
      })

      expect(
        touringPlanSpotRepository.findPlanSpotsByPlanId
      ).not.toHaveBeenCalled()
      const passedPlan = vi.mocked(touringPlanRepository.updatePlan).mock
        .calls[0]?.[0]
      expect(passedPlan?.title).toBe('新しいタイトル')
      expect(passedPlan?.returnAt).toEqual(new Date('2026-07-01T18:00:00.000Z'))
    })

    test('departAt変更時、目的地の到着予定があればreturnAtはそれに更新される', async () => {
      const plan = buildPlan({
        departAt: new Date('2026-07-01T08:00:00.000Z'),
        returnAt: new Date('2026-07-01T18:00:00.000Z'),
      })
      const destinationSpot = buildPlanSpot({
        type: 'DESTINATION',
        plannedArrivalAt: new Date('2026-07-02T20:00:00.000Z'),
      })

      vi.mocked(touringPlanRepository.findPlanById).mockResolvedValue(plan)
      vi.mocked(
        touringPlanSpotRepository.findPlanSpotsByPlanId
      ).mockResolvedValue([destinationSpot])
      vi.mocked(touringPlanRepository.updatePlan).mockImplementation(
        async (p) => p
      )

      await service.updatePlan({
        planId: plan.id,
        myUserBikeId,
        userId,
        departAt: new Date('2026-07-02T09:00:00.000Z'),
      })

      const passedPlan = vi.mocked(touringPlanRepository.updatePlan).mock
        .calls[0]?.[0]
      expect(passedPlan?.departAt).toEqual(new Date('2026-07-02T09:00:00.000Z'))
      expect(passedPlan?.returnAt).toEqual(new Date('2026-07-02T20:00:00.000Z'))
    })

    test('departAt変更時、目的地未設定で経由地の出発予定がある場合はmaxが採用される', async () => {
      const plan = buildPlan({
        departAt: new Date('2026-07-01T08:00:00.000Z'),
        returnAt: new Date('2026-07-01T18:00:00.000Z'),
      })
      const waypoint = buildPlanSpot({
        type: 'SPOT',
        plannedDepartureAt: new Date('2026-07-02T12:00:00.000Z'),
      })

      vi.mocked(touringPlanRepository.findPlanById).mockResolvedValue(plan)
      vi.mocked(
        touringPlanSpotRepository.findPlanSpotsByPlanId
      ).mockResolvedValue([waypoint])
      vi.mocked(touringPlanRepository.updatePlan).mockImplementation(
        async (p) => p
      )

      const newDepartAt = new Date('2026-07-02T15:00:00.000Z')
      await service.updatePlan({
        planId: plan.id,
        myUserBikeId,
        userId,
        departAt: newDepartAt,
      })

      const passedPlan = vi.mocked(touringPlanRepository.updatePlan).mock
        .calls[0]?.[0]
      // departAt(15:00) > waypoint.plannedDepartureAt(12:00) のため departAt が採用される
      expect(passedPlan?.returnAt).toEqual(newDepartAt)
    })

    test('departAt変更時、目的地・経由地が未設定の場合はreturnAt=departAtになる', async () => {
      const plan = buildPlan({
        departAt: new Date('2026-07-01T08:00:00.000Z'),
        returnAt: new Date('2026-07-01T08:00:00.000Z'),
      })

      vi.mocked(touringPlanRepository.findPlanById).mockResolvedValue(plan)
      vi.mocked(
        touringPlanSpotRepository.findPlanSpotsByPlanId
      ).mockResolvedValue([])
      vi.mocked(touringPlanRepository.updatePlan).mockImplementation(
        async (p) => p
      )

      const newDepartAt = new Date('2026-07-03T08:00:00.000Z')
      await service.updatePlan({
        planId: plan.id,
        myUserBikeId,
        userId,
        departAt: newDepartAt,
      })

      const passedPlan = vi.mocked(touringPlanRepository.updatePlan).mock
        .calls[0]?.[0]
      expect(passedPlan?.returnAt).toEqual(newDepartAt)
    })
  })

  describe('deletePlan', () => {
    test('プランが存在しない場合はNOT_FOUNDエラーになる', async () => {
      vi.mocked(touringPlanRepository.findPlanById).mockResolvedValue(null)

      await expect(
        service.deletePlan(createTouringPlanId('plan-1'), myUserBikeId, userId)
      ).rejects.toThrow(ApiV1Error)
    })

    test('プランを削除できる', async () => {
      const plan = buildPlan()
      vi.mocked(touringPlanRepository.findPlanById).mockResolvedValue(plan)

      await service.deletePlan(plan.id, myUserBikeId, userId)

      expect(touringPlanRepository.deletePlan).toHaveBeenCalledWith(
        plan.id,
        myUserBikeId
      )
    })
  })
})
