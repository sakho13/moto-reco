import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  createMaintenanceLogId,
  createMyUserBikeId,
  createUserId,
} from '@repo/shared-types'
import { MaintenanceLogEntity } from '@/lib/api/server/entities/MaintenanceLogEntity'
import { MyUserBikeEntity } from '@/lib/api/server/entities/MyUserBikeEntity'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { IMaintenanceLogRepository } from '@/lib/api/server/interfaces/IMaintenanceLogRepository'
import { IMyUserBikeRepository } from '@/lib/api/server/interfaces/IMyUserBikeRepository'
import { MaintenanceLogService } from '@/lib/api/server/services/MaintenanceLogService'

const myUserBikeId = createMyUserBikeId('bike-1')
const userId = createUserId('user-1')

const buildMaintenanceLog = (index: number) =>
  new MaintenanceLogEntity({
    maintenanceLogId: createMaintenanceLogId(`log-${index}`),
    myUserBikeId,
    performedAt: new Date(
      `2020-01-${String((index % 28) + 1).padStart(2, '0')}T00:00:00.000Z`
    ),
    mileage: index,
    memo: null,
    items: [{ maintenanceType: 'ENGINE_OIL', value: null }],
  })

describe('MaintenanceLogService', () => {
  let maintenanceLogRepository: IMaintenanceLogRepository
  let myUserBikeRepository: IMyUserBikeRepository
  let service: MaintenanceLogService

  beforeEach(() => {
    maintenanceLogRepository = {
      createMaintenanceLog: vi.fn(),
      findMaintenanceLogById: vi.fn(),
      findMaintenanceLogs: vi.fn().mockResolvedValue([]),
      findAllMaintenanceLogs: vi.fn().mockResolvedValue([]),
      updateMaintenanceLog: vi.fn(),
      countMaintenanceLogs: vi.fn(),
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
    } as unknown as IMyUserBikeRepository

    service = new MaintenanceLogService(
      maintenanceLogRepository,
      myUserBikeRepository
    )
  })

  describe('getAllMaintenanceLogs', () => {
    test('バイクが見つからない場合はNOT_FOUNDを投げる', async () => {
      vi.mocked(myUserBikeRepository.findMyUserBikeById).mockResolvedValue(null)

      await expect(
        service.getAllMaintenanceLogs({ myUserBikeId, userId })
      ).rejects.toThrow(ApiV1Error)
      expect(
        maintenanceLogRepository.findAllMaintenanceLogs
      ).not.toHaveBeenCalled()
    })

    test('件数によらず単一クエリで全件取得する（ページング分割しない）', async () => {
      const logs = Array.from({ length: 230 }, (_, i) => buildMaintenanceLog(i))
      const findAllMaintenanceLogs = vi.mocked(
        maintenanceLogRepository.findAllMaintenanceLogs
      )
      findAllMaintenanceLogs.mockResolvedValue(logs)

      const result = await service.getAllMaintenanceLogs({
        myUserBikeId,
        userId,
      })

      expect(result).toHaveLength(230)
      expect(findAllMaintenanceLogs).toHaveBeenCalledTimes(1)
      expect(findAllMaintenanceLogs).toHaveBeenCalledWith(myUserBikeId, 'desc')
    })

    test('sortOrderを指定した場合はそのまま渡す', async () => {
      const findAllMaintenanceLogs = vi.mocked(
        maintenanceLogRepository.findAllMaintenanceLogs
      )

      await service.getAllMaintenanceLogs({
        myUserBikeId,
        userId,
        sortOrder: 'asc',
      })

      expect(findAllMaintenanceLogs).toHaveBeenCalledWith(myUserBikeId, 'asc')
    })
  })
})
