import { type NextRequest } from 'next/server'
import { toJstDateRange } from '@/lib/jstPeriod'

/** 履歴一覧で行に含めるマイバイクとユーザーの項目 */
export const MY_BIKE_SUMMARY_SELECT = {
  id: true,
  nickname: true,
  user: { select: { id: true, name: true } },
  userBike: {
    select: {
      bike: {
        select: {
          modelName: true,
          manufacturer: { select: { name: true } },
        },
      },
    },
  },
} as const

type MyBikeSummarySource = {
  id: string
  nickname: string | null
  user: { id: string; name: string }
  userBike: {
    bike: { modelName: string; manufacturer: { name: string } } | null
  }
}

export type MyBikeSummary = {
  myBikeId: string
  bikeLabel: string
  userId: string
  userName: string
}

/** ニックネーム →「メーカー名 モデル名」→「名称未設定」の順でバイクの表示名を決める */
export function buildBikeLabel(myBike: MyBikeSummarySource): string {
  const nickname = myBike.nickname?.trim()
  if (nickname) return nickname
  const bike = myBike.userBike.bike
  if (bike) return `${bike.manufacturer.name} ${bike.modelName}`
  return '名称未設定'
}

export function toMyBikeSummary(myBike: MyBikeSummarySource): MyBikeSummary {
  return {
    myBikeId: myBike.id,
    bikeLabel: buildBikeLabel(myBike),
    userId: myBike.user.id,
    userName: myBike.user.name,
  }
}

/** 並べ替え項目が許可されていなければ先頭の項目を返す */
export function resolveSortField<T extends string>(
  sort: string,
  allowed: readonly [T, ...T[]]
): T {
  return allowed.find((field) => field === sort) ?? allowed[0]
}

/** クエリの `from` / `to`（JSTの日付）から登録日時の条件を作る */
export function parseCreatedAtRange(request: NextRequest) {
  const { searchParams } = request.nextUrl
  return toJstDateRange(searchParams.get('from'), searchParams.get('to'))
}

export function buildListHeaders(
  resource: string,
  skip: number,
  count: number,
  total: number
): HeadersInit {
  return {
    'X-Total-Count': String(total),
    'Content-Range': `${resource} ${skip}-${skip + count}/${total}`,
    'Access-Control-Expose-Headers': 'Content-Range,X-Total-Count',
  }
}
