import { prisma } from '@repo/database'
import { FuelEfficiencyCalculationService } from '@repo/shared-domain'

const fuelEfficiencyCalculationService = new FuelEfficiencyCalculationService()

/**
 * 指定した複数バイクの給油履歴（mileage昇順）から、
 * バイクIDごとの燃費（km/L）Mapを算出する
 *
 * @remarks
 * `TUserMyBikeHistory` の `include` で取得した燃料ログのように、
 * 単体では「直前の満タン給油」を判定できないレコードに燃費を付与する際に使用する。
 * `PrismaFuelLogRepository` を経由せず生のPrismaクライアントを直接使う箇所
 * （/history系エンドポイント）向けのユーティリティ。
 *
 * @param myUserBikeIds 対象バイクIDの配列（重複可）
 * @returns バイクIDをキーとした、fuelLogIdごとの燃費(km/L)Mapのマップ
 */
export async function buildFuelEfficiencyMapsByBike(
  myUserBikeIds: string[]
): Promise<Map<string, Map<string, number | null>>> {
  const uniqueBikeIds = [...new Set(myUserBikeIds)]
  const result = new Map<string, Map<string, number | null>>()

  await Promise.all(
    uniqueBikeIds.map(async (bikeId) => {
      const logs = await prisma.tUserMyBikeFuelLog.findMany({
        where: { userMyBikeId: bikeId },
        select: {
          id: true,
          mileage: true,
          amount: true,
          isFullTank: true,
        },
        orderBy: [{ mileage: 'asc' }, { refueledAt: 'asc' }],
      })

      result.set(
        bikeId,
        fuelEfficiencyCalculationService.calculate(
          logs.map((log) => ({
            fuelLogId: log.id,
            mileage: log.mileage,
            amount: log.amount,
            isFullTank: log.isFullTank,
          }))
        )
      )
    })
  )

  return result
}
