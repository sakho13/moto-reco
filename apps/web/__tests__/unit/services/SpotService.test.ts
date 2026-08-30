import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  MyUserBikeEntity,
  SpotEntity,
  TouringEntity,
  ApiV1Error,
  IMyUserBikeRepository,
  ISpotRepository,
  ITouringRepository,
} from '@repo/shared-domain'
import {
  createMyUserBikeId,
  createSpotId,
  createTouringId,
  createUserId,
  Spot,
} from '@repo/shared-types'
import { SpotService } from '@/lib/api/server/services/SpotService'

const myUserBikeId = createMyUserBikeId('bike-1')
const userId = createUserId('user-1')
const touringId = createTouringId('touring-1')

const buildSpot = (overrides: Partial<Spot> = {}) => {
  return new SpotEntity({
    spotId: createSpotId('spot-1'),
    touringId,
    type: 'SPOT',
    name: null,
    memo: null,
    latitude: null,
    longitude: null,
    plannedArrivalAt: null,
    plannedDepartureAt: null,
    arrivedAt: null,
    departedAt: null,
    isSkipped: false,
    skippedAt: null,
    sortOrder: 0,
    ...overrides,
  })
}

const buildTouring = () => {
  return new TouringEntity({
    touringId,
    myUserBikeId,
    touringPlanId: null,
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
}

describe('SpotService', () => {
  let spotRepository: ISpotRepository
  let touringRepository: ITouringRepository
  let myUserBikeRepository: IMyUserBikeRepository
  let service: SpotService

  beforeEach(() => {
    spotRepository = {
      createSpot: vi.fn().mockImplementation(async (s) => s),
      findSpotsByTouringId: vi.fn().mockResolvedValue([]),
      findSpotById: vi.fn(),
      updateSpot: vi.fn().mockImplementation(async (s) => s),
      deleteSpot: vi.fn(),
      reorderSpots: vi.fn(),
      shiftSortOrdersFrom: vi.fn(),
    }
    touringRepository = {
      createTouring: vi.fn(),
      updateTouring: vi.fn(),
      findTourings: vi.fn(),
      findTouringById: vi.fn().mockResolvedValue(buildTouring()),
      findTouringByIdForUser: vi.fn(),
      findOngoingTouring: vi.fn(),
      updateTouringStatus: vi.fn(),
      deleteTouring: vi.fn(),
      countTourings: vi.fn(),
      findTouringsByPlanId: vi.fn(),
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

    service = new SpotService(
      spotRepository,
      touringRepository,
      myUserBikeRepository
    )
  })

  describe('registerSpot', () => {
    test('ツーリングが存在しない場合はNOT_FOUNDエラーになる', async () => {
      vi.mocked(touringRepository.findTouringById).mockResolvedValue(null)

      await expect(
        service.registerSpot({
          touringId,
          myUserBikeId,
          userId,
          type: 'SPOT',
        })
      ).rejects.toThrow(ApiV1Error)
    })

    test('arrivedAt未指定の場合は現在時刻が設定される', async () => {
      const before = new Date()
      const result = await service.registerSpot({
        touringId,
        myUserBikeId,
        userId,
        type: 'SPOT',
        name: '休憩スポット',
      })
      const after = new Date()

      expect(result.arrivedAt).not.toBeNull()
      expect(result.arrivedAt!.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      )
      expect(result.arrivedAt!.getTime()).toBeLessThanOrEqual(after.getTime())
      expect(result.isSkipped).toBe(false)
      expect(result.plannedArrivalAt).toBeNull()
      expect(result.plannedDepartureAt).toBeNull()
    })

    test('typeを指定しない場合はSPOTとして登録される', async () => {
      const result = await service.registerSpot({
        touringId,
        myUserBikeId,
        userId,
      })

      expect(result.type).toBe('SPOT')
    })

    test('次の未到着SPOTが存在する場合はその直前に挿入される', async () => {
      const visited = buildSpot({
        spotId: createSpotId('spot-visited'),
        sortOrder: 0,
        arrivedAt: new Date('2026-07-01T09:00:00.000Z'),
      })
      const nextUnvisited = buildSpot({
        spotId: createSpotId('spot-next'),
        sortOrder: 1,
        arrivedAt: null,
      })
      vi.mocked(spotRepository.findSpotsByTouringId).mockResolvedValue([
        visited,
        nextUnvisited,
      ])

      const result = await service.registerSpot({
        touringId,
        myUserBikeId,
        userId,
        type: 'SPOT',
      })

      expect(spotRepository.shiftSortOrdersFrom).toHaveBeenCalledWith(
        touringId,
        1
      )
      expect(result.sortOrder).toBe(1)
    })

    test('スキップ済みのSPOTは次の未到着スポット判定から除外される', async () => {
      const skipped = buildSpot({
        spotId: createSpotId('spot-skipped'),
        sortOrder: 0,
        arrivedAt: null,
        isSkipped: true,
      })
      const nextUnvisited = buildSpot({
        spotId: createSpotId('spot-next'),
        sortOrder: 1,
        arrivedAt: null,
      })
      vi.mocked(spotRepository.findSpotsByTouringId).mockResolvedValue([
        skipped,
        nextUnvisited,
      ])

      const result = await service.registerSpot({
        touringId,
        myUserBikeId,
        userId,
        type: 'SPOT',
      })

      expect(spotRepository.shiftSortOrdersFrom).toHaveBeenCalledWith(
        touringId,
        1
      )
      expect(result.sortOrder).toBe(1)
    })

    test('BREAKを登録する場合は末尾に追加される', async () => {
      const nextUnvisited = buildSpot({
        spotId: createSpotId('spot-next'),
        sortOrder: 0,
        arrivedAt: null,
      })
      vi.mocked(spotRepository.findSpotsByTouringId).mockResolvedValue([
        nextUnvisited,
      ])

      const result = await service.registerSpot({
        touringId,
        myUserBikeId,
        userId,
        type: 'BREAK',
      })

      expect(spotRepository.shiftSortOrdersFrom).not.toHaveBeenCalled()
      expect(result.sortOrder).toBe(1)
      expect(result.type).toBe('BREAK')
    })
  })

  describe('updateSpot', () => {
    test('対象スポットが存在しない場合はNOT_FOUNDエラーになる', async () => {
      vi.mocked(spotRepository.findSpotById).mockResolvedValue(null)

      await expect(
        service.updateSpot({
          spotId: createSpotId('spot-1'),
          touringId,
          myUserBikeId,
          userId,
          name: '更新後',
        })
      ).rejects.toThrow(ApiV1Error)
    })

    test('isSkippedをtrueにするとskippedAtが設定される', async () => {
      const existing = buildSpot()
      vi.mocked(spotRepository.findSpotById).mockResolvedValue(existing)

      const before = new Date()
      const result = await service.updateSpot({
        spotId: existing.id,
        touringId,
        myUserBikeId,
        userId,
        isSkipped: true,
      })
      const after = new Date()

      expect(result.isSkipped).toBe(true)
      expect(result.skippedAt).not.toBeNull()
      expect(result.skippedAt!.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      )
      expect(result.skippedAt!.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    test('isSkippedをfalseに戻すとskippedAtはnullになる', async () => {
      const existing = buildSpot({
        isSkipped: true,
        skippedAt: new Date('2026-07-01T09:00:00.000Z'),
      })
      vi.mocked(spotRepository.findSpotById).mockResolvedValue(existing)

      const result = await service.updateSpot({
        spotId: existing.id,
        touringId,
        myUserBikeId,
        userId,
        isSkipped: false,
      })

      expect(result.isSkipped).toBe(false)
      expect(result.skippedAt).toBeNull()
    })

    test('isSkipped未指定の場合は既存の値が維持される', async () => {
      const existing = buildSpot({
        isSkipped: true,
        skippedAt: new Date('2026-07-01T09:00:00.000Z'),
      })
      vi.mocked(spotRepository.findSpotById).mockResolvedValue(existing)

      const result = await service.updateSpot({
        spotId: existing.id,
        touringId,
        myUserBikeId,
        userId,
        name: '更新後',
      })

      expect(result.isSkipped).toBe(true)
      expect(result.skippedAt).toEqual(new Date('2026-07-01T09:00:00.000Z'))
      expect(result.name).toBe('更新後')
    })

    test('plannedArrivalAt/plannedDepartureAtはAPIから変更できない（Bug #1）', async () => {
      const plannedArrivalAt = new Date('2026-07-01T10:00:00.000Z')
      const plannedDepartureAt = new Date('2026-07-01T10:30:00.000Z')
      const existing = buildSpot({ plannedArrivalAt, plannedDepartureAt })
      vi.mocked(spotRepository.findSpotById).mockResolvedValue(existing)

      const result = await service.updateSpot({
        spotId: existing.id,
        touringId,
        myUserBikeId,
        userId,
        name: '更新後',
      })

      expect(result.plannedArrivalAt).toEqual(plannedArrivalAt)
      expect(result.plannedDepartureAt).toEqual(plannedDepartureAt)
    })

    test('latitude/longitudeにnullを指定すると解除できる', async () => {
      const existing = buildSpot({ latitude: 35.6812, longitude: 139.7671 })
      vi.mocked(spotRepository.findSpotById).mockResolvedValue(existing)

      const result = await service.updateSpot({
        spotId: existing.id,
        touringId,
        myUserBikeId,
        userId,
        latitude: null,
        longitude: null,
      })

      expect(result.latitude).toBeNull()
      expect(result.longitude).toBeNull()
    })
  })

  describe('deleteSpot', () => {
    test('対象スポットが存在しない場合はNOT_FOUNDエラーになる', async () => {
      vi.mocked(spotRepository.findSpotById).mockResolvedValue(null)

      await expect(
        service.deleteSpot(
          createSpotId('spot-1'),
          touringId,
          myUserBikeId,
          userId
        )
      ).rejects.toThrow(ApiV1Error)
    })

    test('スポットを削除できる', async () => {
      const existing = buildSpot()
      vi.mocked(spotRepository.findSpotById).mockResolvedValue(existing)

      await service.deleteSpot(existing.id, touringId, myUserBikeId, userId)

      expect(spotRepository.deleteSpot).toHaveBeenCalledWith(
        existing.id,
        touringId
      )
    })
  })

  describe('reorderSpots', () => {
    test('ツーリングが存在しない場合はNOT_FOUNDエラーになる', async () => {
      vi.mocked(touringRepository.findTouringById).mockResolvedValue(null)

      await expect(
        service.reorderSpots(['spot-1'], touringId, myUserBikeId, userId)
      ).rejects.toThrow(ApiV1Error)
    })

    test('スポットを並び替えできる', async () => {
      await service.reorderSpots(
        ['spot-2', 'spot-1'],
        touringId,
        myUserBikeId,
        userId
      )

      expect(spotRepository.reorderSpots).toHaveBeenCalledWith(
        ['spot-2', 'spot-1'],
        touringId
      )
    })
  })
})
