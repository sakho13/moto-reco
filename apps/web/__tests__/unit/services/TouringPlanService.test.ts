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
import { UserEntity } from '@/lib/api/server/entities/UserEntity'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { IMyUserBikeRepository } from '@/lib/api/server/interfaces/IMyUserBikeRepository'
import { ITouringPlanRepository } from '@/lib/api/server/interfaces/ITouringPlanRepository'
import { ITouringPlanSpotRepository } from '@/lib/api/server/interfaces/ITouringPlanSpotRepository'
import { ITouringRepository } from '@/lib/api/server/interfaces/ITouringRepository'
import { TouringPlanService } from '@/lib/api/server/services/TouringPlanService'

const myUserBikeId = createMyUserBikeId('bike-1')
const userId = createUserId('user-1')

const buildUserEntity = (
  overrides: Partial<{ role: 'USER' | 'ADMIN' | 'GUEST' }> = {}
) =>
  new UserEntity({
    id: userId,
    name: 'Test User',
    role: overrides.role ?? 'USER',
    status: 'ACTIVE',
    plan: 'FREE',
    notificationEmail: null,
    isProfilePublic: true,
  })

const buildPlan = (overrides: Partial<TouringPlan> = {}) => {
  return new TouringPlanEntity({
    touringPlanId: createTouringPlanId('plan-1'),
    myUserBikeId,
    title: '日帰り箱根ツーリング',
    createdAt: new Date('2026-07-01T08:00:00.000Z'),
    updatedAt: new Date('2026-07-01T08:00:00.000Z'),
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
    stayMinutes: number | null
    travelMinutesFromPrev: number | null
    routeTypeFromPrev: 'GENERAL' | 'HIGHWAY' | 'MIXED' | null
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
    stayMinutes: null,
    travelMinutesFromPrev: null,
    routeTypeFromPrev: null,
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
      countPlans: vi.fn().mockResolvedValue(0),
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
          user: buildUserEntity(),
          title: 'プラン',
        })
      ).rejects.toThrow(ApiV1Error)
    })

    test('出発地・目的地を指定しない場合はプランのみ作成される', async () => {
      const createdPlan = buildPlan()
      vi.mocked(touringPlanRepository.createPlan).mockResolvedValue(createdPlan)

      const result = await service.registerPlan({
        myUserBikeId,
        user: buildUserEntity(),
        title: '日帰り箱根ツーリング',
      })

      expect(result.plan).toBe(createdPlan)
      expect(result.startSpot).toBeNull()
      expect(result.destinationSpot).toBeNull()
      expect(touringPlanSpotRepository.createPlanSpot).not.toHaveBeenCalled()

      const passedPlan = vi.mocked(touringPlanRepository.createPlan).mock
        .calls[0]?.[0]
      expect(passedPlan?.title).toBe('日帰り箱根ツーリング')
    })

    test('登録後にstartSpot/destinationSpotの予定時刻がオンザフライで計算される', async () => {
      vi.mocked(touringPlanRepository.createPlan).mockImplementation(
        async (p) => p
      )

      // createPlanSpotで作成されたスポットを記録し、
      // computeTouringPlanSpotTimes内のfindPlanSpotsByPlanIdから
      // 作成済みのstartSpot/destinationSpotを返せるようにする
      const createdSpots: TouringPlanSpotEntity[] = []
      vi.mocked(touringPlanSpotRepository.createPlanSpot).mockImplementation(
        async (spot) => {
          createdSpots.push(spot)
          return spot
        }
      )
      vi.mocked(
        touringPlanSpotRepository.findPlanSpotsByPlanId
      ).mockImplementation(async () => createdSpots)

      const result = await service.registerPlan({
        myUserBikeId,
        user: buildUserEntity(),
        title: '日帰り箱根ツーリング',
        startLocation: { latitude: 35.6812, longitude: 139.7671 },
        destinationLocation: {
          latitude: 35.2323,
          longitude: 139.1069,
          travelMinutesFromPrev: 600,
        },
      })

      expect(result.startSpot?.spot.type).toBe('START')
      expect(result.destinationSpot?.spot.type).toBe('DESTINATION')

      // 出発(START)を0分とし、目的地までの移動時間(600分)が経過分数に反映される
      expect(result.startSpot?.plannedDepartureOffsetMinutes).toBe(0)
      expect(result.destinationSpot?.plannedArrivalOffsetMinutes).toBe(600)

      // 計算結果は永続化されない
      expect(touringPlanSpotRepository.updatePlanSpot).not.toHaveBeenCalled()
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
        touringPlanSpotRepository.findPlanSpotsByPlanId
      ).mockResolvedValue([startSpot, destinationSpot])
      vi.mocked(touringRepository.findTouringsByPlanId).mockResolvedValue([
        touring,
      ])

      const result = await service.getPlanById(plan.id, myUserBikeId, userId)

      expect(result.plan).toBe(plan)
      expect(result.startSpot?.spot).toBe(startSpot)
      expect(result.destinationSpot?.spot).toBe(destinationSpot)
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

    test('タイトルを更新できる', async () => {
      const plan = buildPlan()
      vi.mocked(touringPlanRepository.findPlanById).mockResolvedValue(plan)
      vi.mocked(touringPlanRepository.updatePlan).mockImplementation(
        async (p) => p
      )

      const result = await service.updatePlan({
        planId: plan.id,
        myUserBikeId,
        userId,
        title: '新しいタイトル',
      })

      expect(result.title).toBe('新しいタイトル')
      const passedPlan = vi.mocked(touringPlanRepository.updatePlan).mock
        .calls[0]?.[0]
      expect(passedPlan?.title).toBe('新しいタイトル')
      expect(passedPlan?.id).toBe(plan.id)
      expect(touringPlanRepository.updatePlan).toHaveBeenCalledTimes(1)
    })

    test('titleを指定しない場合は既存のタイトルが維持される', async () => {
      const plan = buildPlan({ title: '既存タイトル' })
      vi.mocked(touringPlanRepository.findPlanById).mockResolvedValue(plan)
      vi.mocked(touringPlanRepository.updatePlan).mockImplementation(
        async (p) => p
      )

      const result = await service.updatePlan({
        planId: plan.id,
        myUserBikeId,
        userId,
      })

      expect(result.title).toBe('既存タイトル')
    })

    test('タイトルが不正な場合はINVALID_REQUESTエラーになる', async () => {
      const plan = buildPlan()
      vi.mocked(touringPlanRepository.findPlanById).mockResolvedValue(plan)

      await expect(
        service.updatePlan({
          planId: plan.id,
          myUserBikeId,
          userId,
          title: '',
        })
      ).rejects.toThrow(ApiV1Error)
      expect(touringPlanRepository.updatePlan).not.toHaveBeenCalled()
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
