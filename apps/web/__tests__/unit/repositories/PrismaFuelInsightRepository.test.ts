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
    } as unknown as ConstructorParameters<
      typeof PrismaFuelInsightRepository
    >[0])
  })

  /**
   * 期間内クエリ（1回目）と境界より前を探すbridgeクエリ（2回目）を
   * この順で個別にモックする。`bridgeRows` を渡さない場合は空（該当なし）扱い。
   */
  function mockQueries(
    inPeriodRows: FuelLogRow[],
    bridgeRows: FuelLogRow[] = []
  ) {
    queryRaw.mockResolvedValueOnce(inPeriodRows)
    if (inPeriodRows.length > 0) {
      queryRaw.mockResolvedValueOnce(bridgeRows)
    }
  }

  test('初回給油のみ登録されている場合、averageFuelEfficiencyは0ではなくnullになる', async () => {
    mockQueries([
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
    mockQueries([])

    const result = await repository.getFuelInsight(myUserBikeId, 'all')

    expect(result.averageFuelEfficiency).toBeNull()
    expect(result.averageAmount).toBeNull()
    expect(result.averageTotalPrice).toBeNull()
    expect(result.averagePricePerLiter).toBeNull()
    expect(result.minPricePerLiter).toBeNull()
    expect(result.maxPricePerLiter).toBeNull()
  })

  test('満タン給油が2件以上の場合、従来どおりの平均燃費が算出される', async () => {
    mockQueries([
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
    mockQueries([
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
    mockQueries([
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

  describe('期間境界をまたぐ満タン法の区間判定（bridgeRows）', () => {
    test('境界より前に満タン給油があり、境界内に満タン給油が1件だけの場合、初回扱いにならない', async () => {
      // 境界（past-month等）より前の満タン給油（bridge）と、境界内の1件の満タン給油。
      // bridgeを使わずに境界内だけで満タン法を適用すると、境界内の1件が
      // 「直前の満タン給油が無い（初回）」と誤判定され null になっていた。
      mockQueries(
        [
          buildRow({
            id: 'in-period-full',
            mileage: 1300,
            amount: 9,
            price: 1350,
            refueledAt: new Date('2024-03-15T00:00:00.000Z'),
          }),
        ],
        [
          buildRow({
            id: 'bridge-full',
            mileage: 1250,
            amount: 8,
            price: 1200,
            refueledAt: new Date('2024-03-01T00:00:00.000Z'),
          }),
        ]
      )

      const result = await repository.getFuelInsight(myUserBikeId, 'past-month')

      // 距離: 1300-1250=50, 給油量: 9 => 50/9（bridgeの給油量はamountAverage等の
      // 母数には含めず、区間の距離判定のみに使う）
      expect(result.averageFuelEfficiency).toBeCloseTo(50 / 9, 10)
      // 期間内の集計（1回のイベント単位）はbridgeを含まない
      expect(result.averageAmount).toBe(9)
    })

    test('境界より前に満タン給油＋継ぎ足しがあり、境界内に満タン給油が1件だけの場合、継ぎ足し分の給油量も繰り込まれる', async () => {
      mockQueries(
        [
          buildRow({
            id: 'in-period-full',
            mileage: 1350,
            amount: 7,
            price: 1050,
            refueledAt: new Date('2024-03-15T00:00:00.000Z'),
          }),
        ],
        [
          buildRow({
            id: 'bridge-partial',
            mileage: 1300,
            amount: 3,
            price: 450,
            isFullTank: false,
            refueledAt: new Date('2024-03-05T00:00:00.000Z'),
          }),
          buildRow({
            id: 'bridge-full',
            mileage: 1250,
            amount: 8,
            price: 1200,
            refueledAt: new Date('2024-03-01T00:00:00.000Z'),
          }),
        ]
      )

      const result = await repository.getFuelInsight(myUserBikeId, 'past-month')

      // 距離: 1350-1250=100, 給油量: 3(bridgeの継ぎ足し)+7(境界内の満タン)=10 => 100/10
      expect(result.averageFuelEfficiency).toBeCloseTo(10, 10)
    })

    test('境界より前に満タン給油が無い場合は、従来どおり境界内の最初の給油が初回扱いになる', async () => {
      mockQueries(
        [
          buildRow({
            id: 'in-period-full-1',
            mileage: 1000,
            amount: 10,
            price: 1500,
            refueledAt: new Date('2024-03-01T00:00:00.000Z'),
          }),
          buildRow({
            id: 'in-period-full-2',
            mileage: 1400,
            amount: 11,
            price: 1650,
            refueledAt: new Date('2024-03-20T00:00:00.000Z'),
          }),
        ],
        [] // 境界より前に記録なし
      )

      const result = await repository.getFuelInsight(myUserBikeId, 'past-month')

      expect(result.averageFuelEfficiency).toBeCloseTo(400 / 11, 10)
    })

    test('last-5でも5件目より前の満タン給油を基準に区間を判定する', async () => {
      mockQueries(
        [
          buildRow({
            id: 'log-5',
            mileage: 1450,
            amount: 6,
            price: 900,
            refueledAt: new Date('2024-05-01T00:00:00.000Z'),
          }),
          buildRow({
            id: 'log-4',
            mileage: 1400,
            amount: 8,
            price: 1200,
            refueledAt: new Date('2024-04-01T00:00:00.000Z'),
          }),
          buildRow({
            id: 'log-3',
            mileage: 1350,
            amount: 7,
            price: 1050,
            refueledAt: new Date('2024-03-01T00:00:00.000Z'),
          }),
          buildRow({
            id: 'log-2',
            mileage: 1300,
            amount: 8,
            price: 1200,
            refueledAt: new Date('2024-02-01T00:00:00.000Z'),
          }),
          buildRow({
            id: 'log-1(oldest-of-5)',
            mileage: 1250,
            amount: 9,
            price: 1350,
            refueledAt: new Date('2024-01-15T00:00:00.000Z'),
          }),
        ],
        [
          buildRow({
            id: 'bridge-full',
            mileage: 1200,
            amount: 10,
            price: 1500,
            refueledAt: new Date('2024-01-01T00:00:00.000Z'),
          }),
        ]
      )

      const result = await repository.getFuelInsight(myUserBikeId, 'last-5')

      // 距離: 1450-1200=250, 給油量: 9+8+7+8+6=38（bridgeの10はつなぎのみで母数外）
      expect(result.averageFuelEfficiency).toBeCloseTo(250 / 38, 10)
    })
  })
})
