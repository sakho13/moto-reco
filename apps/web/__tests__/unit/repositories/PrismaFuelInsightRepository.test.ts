import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createMyUserBikeId } from '@repo/shared-types'
import { PrismaFuelInsightRepository } from '@/lib/api/server/repositories/PrismaFuelInsightRepository'

type FuelLogRow = {
  id: string
  amount: number
  price: number
  mileage: number
  isFullTank: boolean
  refueledAt: Date
}

const myUserBikeId = createMyUserBikeId('bike-1')

const buildRow = (
  overrides: Partial<FuelLogRow> & Pick<FuelLogRow, 'id'>
): FuelLogRow => ({
  amount: 10,
  price: 1500,
  mileage: 1000,
  isFullTank: true,
  refueledAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
})

describe('PrismaFuelInsightRepository', () => {
  let queryRaw: ReturnType<typeof vi.fn>
  let repository: PrismaFuelInsightRepository

  beforeEach(() => {
    queryRaw = vi.fn()
    repository = new PrismaFuelInsightRepository({
      $queryRaw: queryRaw,
    } as unknown as ConstructorParameters<typeof PrismaFuelInsightRepository>[0])
  })

  test('初回給油のみ登録されている場合、averageFuelEfficiencyは0ではなくnullになる', async () => {
    queryRaw.mockResolvedValue([
      buildRow({ id: 'log-1', mileage: 1000, amount: 10, price: 1500 }),
    ])

    const result = await repository.getFuelInsight(myUserBikeId, 'all')

    expect(result.averageFuelEfficiency).toBeNull()
    // 燃費とは無関係な集計は初回給油も母数に含まれる
    expect(result.averageAmount).toBe(10)
    expect(result.averageTotalPrice).toBe(1500)
    expect(result.averagePricePerLiter).toBeCloseTo(150, 10)
  })

  test('給油履歴が0件の場合、全ての集計値がnullになる', async () => {
    queryRaw.mockResolvedValue([])

    const result = await repository.getFuelInsight(myUserBikeId, 'all')

    expect(result.averageFuelEfficiency).toBeNull()
    expect(result.averageAmount).toBeNull()
    expect(result.averageTotalPrice).toBeNull()
    expect(result.averagePricePerLiter).toBeNull()
    expect(result.minPricePerLiter).toBeNull()
    expect(result.maxPricePerLiter).toBeNull()
  })

  test('満タン給油が2件以上の場合、従来どおりの平均燃費が算出される', async () => {
    queryRaw.mockResolvedValue([
      buildRow({
        id: 'full-1',
        mileage: 1000,
        amount: 10,
        price: 1500,
        refueledAt: new Date('2024-01-01T00:00:00.000Z'),
      }),
      buildRow({
        id: 'full-2',
        mileage: 1500,
        amount: 12,
        price: 1800,
        refueledAt: new Date('2024-02-01T00:00:00.000Z'),
      }),
    ])

    const result = await repository.getFuelInsight(myUserBikeId, 'all')

    // full-1は初回給油のため母数から除外。(1500-1000)/12
    expect(result.averageFuelEfficiency).toBeCloseTo(500 / 12, 10)
  })

  test('満タン→継ぎ足し→満タンの場合、継ぎ足し分の給油量が分母に含まれ、距離は最初の満タン〜最後の満タンで計算される', async () => {
    queryRaw.mockResolvedValue([
      buildRow({
        id: 'full-1',
        mileage: 1000,
        amount: 10,
        price: 1500,
        refueledAt: new Date('2024-01-01T00:00:00.000Z'),
      }),
      buildRow({
        id: 'partial-1',
        mileage: 1100,
        amount: 3,
        price: 450,
        isFullTank: false,
        refueledAt: new Date('2024-01-10T00:00:00.000Z'),
      }),
      buildRow({
        id: 'full-2',
        mileage: 1250,
        amount: 8,
        price: 1200,
        refueledAt: new Date('2024-01-20T00:00:00.000Z'),
      }),
    ])

    const result = await repository.getFuelInsight(myUserBikeId, 'all')

    // 距離: 1250-1000=250, 給油量: 3(継ぎ足し)+8(満タン)=11 => 250/11
    expect(result.averageFuelEfficiency).toBeCloseTo(250 / 11, 10)
    // averageAmountなどは燃費算出の可否に関わらず全給油イベントが母数のまま
    expect(result.averageAmount).toBeCloseTo((10 + 3 + 8) / 3, 10)
  })

  test('末尾が継ぎ足し給油で終わる場合、その区間は平均燃費の母数に含まれない', async () => {
    queryRaw.mockResolvedValue([
      buildRow({
        id: 'full-1',
        mileage: 1000,
        amount: 10,
        price: 1500,
        refueledAt: new Date('2024-01-01T00:00:00.000Z'),
      }),
      buildRow({
        id: 'partial-1',
        mileage: 1100,
        amount: 3,
        price: 450,
        isFullTank: false,
        refueledAt: new Date('2024-01-10T00:00:00.000Z'),
      }),
      buildRow({
        id: 'full-2',
        mileage: 1250,
        amount: 8,
        price: 1200,
        refueledAt: new Date('2024-01-20T00:00:00.000Z'),
      }),
      buildRow({
        id: 'partial-2',
        mileage: 1300,
        amount: 2,
        price: 300,
        isFullTank: false,
        refueledAt: new Date('2024-01-25T00:00:00.000Z'),
      }),
    ])

    const result = await repository.getFuelInsight(myUserBikeId, 'all')

    expect(result.averageFuelEfficiency).toBeCloseTo(250 / 11, 10)
  })
})
