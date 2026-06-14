import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  createMyUserBikeId,
  createTouringId,
  createTouringPlanId,
  createTouringPlanSpotId,
  createUserId,
  Touring,
} from '@repo/shared-types'
import { MyUserBikeEntity } from '@/lib/api/server/entities/MyUserBikeEntity'
import { SpotEntity } from '@/lib/api/server/entities/SpotEntity'
import { TouringEntity } from '@/lib/api/server/entities/TouringEntity'
import { TouringPlanEntity } from '@/lib/api/server/entities/TouringPlanEntity'
import { TouringPlanSpotEntity } from '@/lib/api/server/entities/TouringPlanSpotEntity'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { IFuelLogRepository } from '@/lib/api/server/interfaces/IFuelLogRepository'
import { IMyUserBikeRepository } from '@/lib/api/server/interfaces/IMyUserBikeRepository'
import { ISpotRepository } from '@/lib/api/server/interfaces/ISpotRepository'
import { ITouringPlanRepository } from '@/lib/api/server/interfaces/ITouringPlanRepository'
import { ITouringPlanSpotRepository } from '@/lib/api/server/interfaces/ITouringPlanSpotRepository'
import { ITouringRepository } from '@/lib/api/server/interfaces/ITouringRepository'
import { TouringService } from '@/lib/api/server/services/TouringService'

const myUserBikeId = createMyUserBikeId('bike-1')
const userId = createUserId('user-1')

const buildTouring = (overrides: Partial<Touring> = {}) => {
  return new TouringEntity({
    touringId: createTouringId('touring-1'),
    myUserBikeId,
    touringPlanId: null,
    title: '日帰り箱根ツーリング',
    startDate: new Date('2020-07-01T08:00:00.000Z'),
    endDate: new Date('2020-07-01T08:00:00.000Z'),
    startMileage: 1000,
    endMileage: null,
    startLatitude: null,
    startLongitude: null,
    endLatitude: null,
    endLongitude: null,
    status: 'STARTED',
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
    plannedArrivalAt: null,
    plannedDepartureAt: null,
    stayMinutes: null,
    travelMinutesFromPrev: null,
    routeTypeFromPrev: null,
    sortOrder: 0,
    ...overrides,
  })
}

describe('TouringService', () => {
  let touringRepository: ITouringRepository
  let myUserBikeRepository: IMyUserBikeRepository
  let fuelLogRepository: IFuelLogRepository
  let touringPlanRepository: ITouringPlanRepository
  let touringPlanSpotRepository: ITouringPlanSpotRepository
  let spotRepository: ISpotRepository
  let service: TouringService

  beforeEach(() => {
    touringRepository = {
      createTouring: vi.fn().mockImplementation(async (t) => t),
      updateTouring: vi.fn().mockImplementation(async (t) => t),
      findTourings: vi.fn(),
      findTouringById: vi.fn(),
      findOngoingTouring: vi.fn().mockResolvedValue(null),
      updateTouringStatus: vi.fn(),
      deleteTouring: vi.fn(),
      countTourings: vi.fn().mockResolvedValue(0),
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
      findMyUserBikeTotalMileage: vi.fn().mockResolvedValue(1000),
    }
    fuelLogRepository = {
      createFuelLog: vi.fn(),
      findFuelLogs: vi.fn().mockResolvedValue([]),
      findFuelLogById: vi.fn(),
      updateFuelLog: vi.fn(),
      deleteFuelLog: vi.fn(),
      updateFuelLogTouringId: vi.fn(),
      updateMultipleFuelLogsTouringId: vi.fn(),
      countFuelLogs: vi.fn(),
    }
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
    spotRepository = {
      createSpot: vi.fn().mockImplementation(async (s) => s),
      findSpotsByTouringId: vi.fn().mockResolvedValue([]),
      findSpotById: vi.fn(),
      updateSpot: vi.fn(),
      deleteSpot: vi.fn(),
      reorderSpots: vi.fn(),
      shiftSortOrdersFrom: vi.fn(),
    }

    service = new TouringService(
      touringRepository,
      myUserBikeRepository,
      fuelLogRepository,
      touringPlanRepository,
      touringPlanSpotRepository,
      spotRepository
    )
  })

  describe('registerTouring', () => {
    test('statusを指定しない場合COMPLETEDで登録される', async () => {
      const result = await service.registerTouring({
        myUserBikeId,
        userId,
        role: 'USER',
        title: 'ツーリング',
        startDate: new Date('2026-07-01T08:00:00.000Z'),
        endDate: new Date('2026-07-01T18:00:00.000Z'),
      })

      expect(result.status).toBe('COMPLETED')
      expect(result.touringPlanId).toBeNull()
    })

    test('既に進行中のツーリングがある場合、STARTEDで登録するとエラーになる', async () => {
      vi.mocked(touringRepository.findOngoingTouring).mockResolvedValue(
        buildTouring()
      )

      await expect(
        service.registerTouring({
          myUserBikeId,
          userId,
          role: 'USER',
          title: 'ツーリング',
          startDate: new Date('2026-07-01T08:00:00.000Z'),
          endDate: new Date('2026-07-01T18:00:00.000Z'),
          status: 'STARTED',
        })
      ).rejects.toThrow(ApiV1Error)
    })

    test('ゲストアカウントは上限を超えると登録できない', async () => {
      vi.mocked(touringRepository.countTourings).mockResolvedValue(2)

      await expect(
        service.registerTouring({
          myUserBikeId,
          userId,
          role: 'GUEST',
          title: 'ツーリング',
          startDate: new Date('2026-07-01T08:00:00.000Z'),
          endDate: new Date('2026-07-01T18:00:00.000Z'),
        })
      ).rejects.toThrow(ApiV1Error)
    })
  })

  describe('handleTouringAction (start)', () => {
    test('既に進行中のツーリングがある場合はエラーになる', async () => {
      vi.mocked(touringRepository.findOngoingTouring).mockResolvedValue(
        buildTouring()
      )

      await expect(
        service.handleTouringAction({
          action: 'start',
          myUserBikeId,
          userId,
          role: 'USER',
        })
      ).rejects.toThrow(ApiV1Error)
    })

    test('プラン未指定の場合、titleはデフォルト値が使用される', async () => {
      const result = await service.handleTouringAction({
        action: 'start',
        myUserBikeId,
        userId,
        role: 'USER',
      })

      expect(result.title).toBe('ツーリング')
      expect(result.status).toBe('STARTED')
      expect(result.touringPlanId).toBeNull()
    })

    test('startMileage未指定の場合は現在の総走行距離が使用される', async () => {
      vi.mocked(
        myUserBikeRepository.findMyUserBikeTotalMileage
      ).mockResolvedValue(12345)

      const result = await service.handleTouringAction({
        action: 'start',
        myUserBikeId,
        userId,
        role: 'USER',
      })

      expect(result.startMileage).toBe(12345)
    })

    test('プランから開始する場合、プランのタイトルが引き継がれる（#9）', async () => {
      const plan = new TouringPlanEntity({
        touringPlanId: createTouringPlanId('plan-1'),
        myUserBikeId,
        title: 'プランタイトル',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      })
      vi.mocked(touringPlanRepository.findPlanById).mockResolvedValue(plan)
      vi.mocked(
        touringPlanSpotRepository.findPlanSpotsByPlanId
      ).mockResolvedValue([])

      const result = await service.handleTouringAction({
        action: 'start',
        myUserBikeId,
        userId,
        role: 'USER',
        touringPlanId: 'plan-1',
      })

      expect(result.title).toBe('プランタイトル')
      expect(result.touringPlanId).toBe('plan-1')
    })

    test('プランから開始する場合、titleを指定すればそれが優先される（#9）', async () => {
      const plan = new TouringPlanEntity({
        touringPlanId: createTouringPlanId('plan-1'),
        myUserBikeId,
        title: 'プランタイトル',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      })
      vi.mocked(touringPlanRepository.findPlanById).mockResolvedValue(plan)
      vi.mocked(
        touringPlanSpotRepository.findPlanSpotsByPlanId
      ).mockResolvedValue([])

      const result = await service.handleTouringAction({
        action: 'start',
        myUserBikeId,
        userId,
        role: 'USER',
        touringPlanId: 'plan-1',
        title: '個別タイトル',
      })

      expect(result.title).toBe('個別タイトル')
    })

    test('プランから開始する場合、START/DESTINATIONの座標が引き継がれる', async () => {
      const plan = new TouringPlanEntity({
        touringPlanId: createTouringPlanId('plan-1'),
        myUserBikeId,
        title: 'プランタイトル',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      })
      const startSpot = buildPlanSpot({
        touringPlanSpotId: createTouringPlanSpotId('plan-spot-start'),
        type: 'START',
        latitude: 35.6812,
        longitude: 139.7671,
        sortOrder: 0,
      })
      const destinationSpot = buildPlanSpot({
        touringPlanSpotId: createTouringPlanSpotId('plan-spot-destination'),
        type: 'DESTINATION',
        latitude: 35.2323,
        longitude: 139.1069,
        sortOrder: 9999,
      })
      vi.mocked(touringPlanRepository.findPlanById).mockResolvedValue(plan)
      vi.mocked(
        touringPlanSpotRepository.findPlanSpotsByPlanId
      ).mockResolvedValue([startSpot, destinationSpot])

      const result = await service.handleTouringAction({
        action: 'start',
        myUserBikeId,
        userId,
        role: 'USER',
        touringPlanId: 'plan-1',
      })

      expect(result.startLatitude).toBe(35.6812)
      expect(result.startLongitude).toBe(139.7671)
      expect(result.endLatitude).toBe(35.2323)
      expect(result.endLongitude).toBe(139.1069)
    })

    test('プランの経由地・休憩が実績スポットとしてコピーされる', async () => {
      const plan = new TouringPlanEntity({
        touringPlanId: createTouringPlanId('plan-1'),
        myUserBikeId,
        title: 'プランタイトル',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      })
      // PLAN_SPOT_TIME_BASE_DATE(1999-12-31T15:00:00.000Z)起点で
      // waypoint1は+4時間着/+4時間30分発、waypoint2は+5時間着/+5時間15分発
      const waypoint1 = buildPlanSpot({
        touringPlanSpotId: createTouringPlanSpotId('plan-spot-1'),
        type: 'SPOT',
        name: '経由地1',
        sortOrder: 0,
        plannedArrivalAt: new Date('1999-12-31T19:00:00.000Z'),
        plannedDepartureAt: new Date('1999-12-31T19:30:00.000Z'),
      })
      const waypoint2 = buildPlanSpot({
        touringPlanSpotId: createTouringPlanSpotId('plan-spot-2'),
        type: 'BREAK',
        name: '休憩',
        sortOrder: 1,
        plannedArrivalAt: new Date('1999-12-31T20:00:00.000Z'),
        plannedDepartureAt: new Date('1999-12-31T20:15:00.000Z'),
      })
      vi.mocked(touringPlanRepository.findPlanById).mockResolvedValue(plan)
      vi.mocked(
        touringPlanSpotRepository.findPlanSpotsByPlanId
      ).mockResolvedValue([waypoint2, waypoint1])

      const startDate = new Date('2024-07-01T06:00:00.000Z')
      await service.handleTouringAction({
        action: 'start',
        myUserBikeId,
        userId,
        role: 'USER',
        touringPlanId: 'plan-1',
        startDate,
      })

      expect(spotRepository.createSpot).toHaveBeenCalledTimes(2)
      const createdSpots = vi
        .mocked(spotRepository.createSpot)
        .mock.calls.map((call) => call[0] as SpotEntity)

      expect(createdSpots[0]?.name).toBe('経由地1')
      expect(createdSpots[0]?.sortOrder).toBe(0)
      expect(createdSpots[0]?.type).toBe('SPOT')
      expect(createdSpots[0]?.arrivedAt).toBeNull()
      expect(createdSpots[0]?.isSkipped).toBe(false)
      // startDate(06:00) + 4時間 = 10:00、+4時間30分 = 10:30に再アンカーされる
      expect(createdSpots[0]?.plannedArrivalAt).toEqual(
        new Date('2024-07-01T10:00:00.000Z')
      )
      expect(createdSpots[0]?.plannedDepartureAt).toEqual(
        new Date('2024-07-01T10:30:00.000Z')
      )

      expect(createdSpots[1]?.name).toBe('休憩')
      expect(createdSpots[1]?.sortOrder).toBe(1)
      expect(createdSpots[1]?.type).toBe('BREAK')
      // startDate(06:00) + 5時間 = 11:00、+5時間15分 = 11:15に再アンカーされる
      expect(createdSpots[1]?.plannedArrivalAt).toEqual(
        new Date('2024-07-01T11:00:00.000Z')
      )
      expect(createdSpots[1]?.plannedDepartureAt).toEqual(
        new Date('2024-07-01T11:15:00.000Z')
      )
    })

    test('存在しないプランを指定するとNOT_FOUNDエラーになる', async () => {
      vi.mocked(touringPlanRepository.findPlanById).mockResolvedValue(null)

      await expect(
        service.handleTouringAction({
          action: 'start',
          myUserBikeId,
          userId,
          role: 'USER',
          touringPlanId: 'plan-unknown',
        })
      ).rejects.toThrow(ApiV1Error)
    })
  })

  describe('handleTouringAction (end)', () => {
    test('存在しないツーリングを指定するとNOT_FOUNDエラーになる', async () => {
      vi.mocked(touringRepository.findTouringById).mockResolvedValue(null)

      await expect(
        service.handleTouringAction({
          action: 'end',
          myUserBikeId,
          userId,
          touringId: 'touring-1',
        })
      ).rejects.toThrow(ApiV1Error)
    })

    test('endLatitude/endLongitude未指定の場合は既存値（プラン由来の終着地）が保持される（Bug #2）', async () => {
      const existing = buildTouring({
        endLatitude: 35.2323,
        endLongitude: 139.1069,
      })
      vi.mocked(touringRepository.findTouringById).mockResolvedValue(existing)

      const result = await service.handleTouringAction({
        action: 'end',
        myUserBikeId,
        userId,
        touringId: 'touring-1',
      })

      expect(result.endLatitude).toBe(35.2323)
      expect(result.endLongitude).toBe(139.1069)
      expect(result.status).toBe('COMPLETED')
    })

    test('endLatitude/endLongitudeを指定した場合は新しい値で上書きされる（Bug #2）', async () => {
      const existing = buildTouring({
        endLatitude: 35.2323,
        endLongitude: 139.1069,
      })
      vi.mocked(touringRepository.findTouringById).mockResolvedValue(existing)

      const result = await service.handleTouringAction({
        action: 'end',
        myUserBikeId,
        userId,
        touringId: 'touring-1',
        endLatitude: 36.0,
        endLongitude: 140.0,
      })

      expect(result.endLatitude).toBe(36.0)
      expect(result.endLongitude).toBe(140.0)
    })

    test('endMileage未指定の場合は現在の総走行距離が使用される', async () => {
      const existing = buildTouring()
      vi.mocked(touringRepository.findTouringById).mockResolvedValue(existing)
      vi.mocked(
        myUserBikeRepository.findMyUserBikeTotalMileage
      ).mockResolvedValue(2000)

      const result = await service.handleTouringAction({
        action: 'end',
        myUserBikeId,
        userId,
        touringId: 'touring-1',
      })

      expect(result.endMileage).toBe(2000)
    })
  })

  describe('updateTouring', () => {
    test('存在しないツーリングを指定するとNOT_FOUNDエラーになる', async () => {
      vi.mocked(touringRepository.findTouringById).mockResolvedValue(null)

      await expect(
        service.updateTouring({
          touringId: createTouringId('touring-1'),
          myUserBikeId,
          userId,
          title: '新タイトル',
        })
      ).rejects.toThrow(ApiV1Error)
    })

    test('statusをSTARTEDに変更する場合、他に進行中のツーリングがあればエラーになる', async () => {
      const existing = buildTouring({ status: 'COMPLETED' })
      vi.mocked(touringRepository.findTouringById).mockResolvedValue(existing)
      vi.mocked(touringRepository.findOngoingTouring).mockResolvedValue(
        buildTouring({ touringId: createTouringId('touring-other') })
      )

      await expect(
        service.updateTouring({
          touringId: existing.id,
          myUserBikeId,
          userId,
          status: 'STARTED',
        })
      ).rejects.toThrow(ApiV1Error)
    })

    test('endLatitude/endLongitudeにnullを指定すると解除できる', async () => {
      const existing = buildTouring({
        status: 'COMPLETED',
        endLatitude: 35.2323,
        endLongitude: 139.1069,
      })
      vi.mocked(touringRepository.findTouringById).mockResolvedValue(existing)

      const result = await service.updateTouring({
        touringId: existing.id,
        myUserBikeId,
        userId,
        endLatitude: null,
        endLongitude: null,
      })

      expect(result.endLatitude).toBeNull()
      expect(result.endLongitude).toBeNull()
    })

    test('endLatitude/endLongitude未指定の場合は既存値が維持される', async () => {
      const existing = buildTouring({
        status: 'COMPLETED',
        endLatitude: 35.2323,
        endLongitude: 139.1069,
      })
      vi.mocked(touringRepository.findTouringById).mockResolvedValue(existing)

      const result = await service.updateTouring({
        touringId: existing.id,
        myUserBikeId,
        userId,
        title: '更新後タイトル',
      })

      expect(result.endLatitude).toBe(35.2323)
      expect(result.endLongitude).toBe(139.1069)
      expect(result.title).toBe('更新後タイトル')
    })

    test('touringPlanIdは変更されない', async () => {
      const existing = buildTouring({
        status: 'COMPLETED',
        touringPlanId: createTouringPlanId('plan-1'),
      })
      vi.mocked(touringRepository.findTouringById).mockResolvedValue(existing)

      const result = await service.updateTouring({
        touringId: existing.id,
        myUserBikeId,
        userId,
        title: '更新後タイトル',
      })

      expect(result.touringPlanId).toBe('plan-1')
    })
  })

  describe('deleteTouring', () => {
    test('存在しないツーリングを指定するとNOT_FOUNDエラーになる', async () => {
      vi.mocked(touringRepository.findTouringById).mockResolvedValue(null)

      await expect(
        service.deleteTouring({
          touringId: createTouringId('touring-1'),
          myUserBikeId,
          userId,
        })
      ).rejects.toThrow(ApiV1Error)
    })

    test('ツーリングを削除できる', async () => {
      const existing = buildTouring()
      vi.mocked(touringRepository.findTouringById).mockResolvedValue(existing)

      await service.deleteTouring({
        touringId: existing.id,
        myUserBikeId,
        userId,
      })

      expect(touringRepository.deleteTouring).toHaveBeenCalledWith(
        existing.id,
        myUserBikeId
      )
    })
  })
})
