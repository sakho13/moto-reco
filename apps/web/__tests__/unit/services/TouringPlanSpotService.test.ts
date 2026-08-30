import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  MyUserBikeEntity,
  TouringPlanEntity,
  TouringPlanSpotEntity,
  ApiV1Error,
  IMyUserBikeRepository,
  ITouringPlanRepository,
  ITouringPlanSpotRepository,
} from '@repo/shared-domain'
import {
  createMyUserBikeId,
  createTouringPlanId,
  createTouringPlanSpotId,
  createUserId,
  TouringPlan,
} from '@repo/shared-types'
import { TouringPlanSpotService } from '@/lib/api/server/services/TouringPlanSpotService'

const myUserBikeId = createMyUserBikeId('bike-1')
const userId = createUserId('user-1')
const planId = createTouringPlanId('plan-1')

const buildPlan = (overrides: Partial<TouringPlan> = {}) => {
  return new TouringPlanEntity({
    touringPlanId: planId,
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
    touringPlanId: planId,
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
        buildPlanSpot({
          touringPlanSpotId: createTouringPlanSpotId('plan-spot-2'),
          type: 'BREAK',
          sortOrder: 1,
        }),
      ]
      const created = buildPlanSpot({
        touringPlanSpotId: createTouringPlanSpotId('plan-spot-3'),
        type: 'SPOT',
        name: '新しい経由地',
        sortOrder: 2,
      })
      vi.mocked(touringPlanSpotRepository.createPlanSpot).mockResolvedValue(
        created
      )
      vi.mocked(touringPlanSpotRepository.findPlanSpotsByPlanId)
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce([...existing, created])

      const result = await service.registerPlanSpot({
        planId,
        myUserBikeId,
        userId,
        type: 'SPOT',
        name: '新しい経由地',
      })

      expect(result.spot.sortOrder).toBe(2)
      expect(result.spot.type).toBe('SPOT')
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

      expect(result.map((s) => s.spot.id)).toEqual([
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
      vi.mocked(
        touringPlanSpotRepository.findPlanSpotsByPlanId
      ).mockImplementation(async () => [
        new TouringPlanSpotEntity({ ...spot.toJson(), name: '新名称' }),
      ])

      const result = await service.updatePlanSpot({
        spotId: spot.id,
        planId,
        myUserBikeId,
        userId,
        name: '新名称',
      })

      expect(result.spot.name).toBe('新名称')
    })

    test('travelMinutesFromPrev更新後は各スポットの予定時刻がオンザフライで再計算される', async () => {
      const startSpot = buildPlanSpot({
        touringPlanSpotId: createTouringPlanSpotId('plan-spot-start'),
        type: 'START',
        sortOrder: 0,
      })
      const spot = buildPlanSpot({
        type: 'SPOT',
        sortOrder: 0,
        stayMinutes: 30,
        travelMinutesFromPrev: null,
      })
      const destinationSpot = buildPlanSpot({
        touringPlanSpotId: createTouringPlanSpotId('plan-spot-destination'),
        type: 'DESTINATION',
        sortOrder: 9999,
        travelMinutesFromPrev: 60,
      })

      vi.mocked(touringPlanSpotRepository.findPlanSpotById).mockResolvedValue(
        spot
      )
      vi.mocked(touringPlanSpotRepository.updatePlanSpot).mockImplementation(
        async (s) => s
      )

      // 更新後（travelMinutesFromPrev: 90）のスポット一覧をcompute用に返す
      const updatedSpot = new TouringPlanSpotEntity({
        ...spot.toJson(),
        travelMinutesFromPrev: 90,
      })
      vi.mocked(
        touringPlanSpotRepository.findPlanSpotsByPlanId
      ).mockResolvedValue([startSpot, updatedSpot, destinationSpot])

      const result = await service.updatePlanSpot({
        spotId: spot.id,
        planId,
        myUserBikeId,
        userId,
        travelMinutesFromPrev: 90,
      })

      expect(result.spot.travelMinutesFromPrev).toBe(90)

      // travelMinutesFromPrev(90分) = 出発から90分後に到着、stayMinutes(30分)で120分後に出発
      expect(result.plannedArrivalOffsetMinutes).toBe(90)
      expect(result.plannedDepartureOffsetMinutes).toBe(120)

      // DESTINATIONの到着(120分後 + 60分 = 180分後)も併せて再計算される
      const spots = await service.getPlanSpots(planId, myUserBikeId, userId)
      const destinationSpotWithTimes = spots.find(
        (s) => s.spot.id === destinationSpot.id
      )
      expect(destinationSpotWithTimes?.plannedArrivalOffsetMinutes).toBe(180)

      // 計算結果は永続化されない
      expect(touringPlanSpotRepository.updatePlanSpot).toHaveBeenCalledTimes(1)
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
      vi.mocked(
        touringPlanSpotRepository.findPlanSpotsByPlanId
      ).mockResolvedValue([startSpot])

      const result = await service.setStartSpot(planId, myUserBikeId, userId, {
        latitude: 35.6812,
        longitude: 139.7671,
      })

      expect(result?.spot).toBe(startSpot)
      expect(
        touringPlanSpotRepository.upsertSingletonSpot
      ).toHaveBeenCalledWith(
        planId,
        'START',
        expect.objectContaining({
          latitude: 35.6812,
          longitude: 139.7671,
          travelMinutesFromPrev: null,
          routeTypeFromPrev: null,
        })
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
    test('目的地を新規設定するとtravelMinutesFromPrevに基づき予定到着時刻がオンザフライで計算される', async () => {
      const startSpot = buildPlanSpot({
        touringPlanSpotId: createTouringPlanSpotId('plan-spot-start'),
        type: 'START',
        sortOrder: 0,
      })
      const travelMinutesFromPrev = 120
      const destinationSpot = buildPlanSpot({
        touringPlanSpotId: createTouringPlanSpotId('plan-spot-destination'),
        type: 'DESTINATION',
        sortOrder: 9999,
        latitude: 35.2323,
        longitude: 139.1069,
        travelMinutesFromPrev,
      })
      vi.mocked(
        touringPlanSpotRepository.upsertSingletonSpot
      ).mockResolvedValue(destinationSpot)
      vi.mocked(
        touringPlanSpotRepository.findPlanSpotsByPlanId
      ).mockResolvedValue([startSpot, destinationSpot])

      const result = await service.setDestinationSpot(
        planId,
        myUserBikeId,
        userId,
        {
          latitude: 35.2323,
          longitude: 139.1069,
          travelMinutesFromPrev,
        }
      )

      expect(
        touringPlanSpotRepository.upsertSingletonSpot
      ).toHaveBeenCalledWith(
        planId,
        'DESTINATION',
        expect.objectContaining({
          latitude: 35.2323,
          longitude: 139.1069,
          travelMinutesFromPrev,
          routeTypeFromPrev: null,
        })
      )

      // 出発(0分後) + travelMinutesFromPrev(120分) = 120分後が
      // 予定到着までの経過分数として反映される
      expect(result?.plannedArrivalOffsetMinutes).toBe(120)

      // 計算結果は永続化されない
      expect(touringPlanSpotRepository.updatePlanSpot).not.toHaveBeenCalled()
    })
  })
})
