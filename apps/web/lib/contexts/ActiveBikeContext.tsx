'use client'

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import useSWR from 'swr'
import { apiGet } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import type {
  ActiveBikeContextType,
  ActiveBikeSummary,
} from '@/types/activeBike'

export const ActiveBikeContext = createContext<
  ActiveBikeContextType | undefined
>(undefined)

const ACTIVE_BIKE_STORAGE_KEY = 'motoreco:active-bike-id'

function readStoredActiveBikeId(): string | null {
  try {
    return window.localStorage.getItem(ACTIVE_BIKE_STORAGE_KEY)
  } catch {
    // プライベートモード等、localStorageが使用できない環境では無視する
    return null
  }
}

function writeStoredActiveBikeId(bikeId: string | null): void {
  try {
    if (bikeId) {
      window.localStorage.setItem(ACTIVE_BIKE_STORAGE_KEY, bikeId)
    } else {
      window.localStorage.removeItem(ACTIVE_BIKE_STORAGE_KEY)
    }
  } catch {
    // プライベートモード等、localStorageが使用できない環境では無視する
  }
}

/**
 * 保存済み・現在のIDが使えない場合のフォールバック先を選ぶ
 *
 * @remarks
 * バイク一覧APIは「直近で給油・ツーリングした」フラグを持たないため、
 * 給油・ツーリング登録時に更新される `updatedAt` が最も新しいバイクを
 * 「直近で利用した車両」の近似値として扱う。
 */
function pickFallbackBike(
  bikes: ActiveBikeSummary[]
): ActiveBikeSummary | null {
  if (bikes.length === 0) return null

  const sorted = [...bikes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
  return sorted[0] ?? null
}

type ActiveBikeProviderProps = {
  children: React.ReactNode
}

export const ActiveBikeProvider = ({ children }: ActiveBikeProviderProps) => {
  const { user } = useAuth()
  const [activeBikeId, setActiveBikeIdState] = useState<string | null>(null)

  // localStorageの読み取りは1度だけ行う。useEffect内で読むと、
  // React 18 Strict Mode（開発時）のeffect二重実行で
  // 「読み取り済みフラグ」だけが先に立ってしまい、
  // 2回目の実行が古いstateを見て誤ったフォールバックへ上書きする不具合があったため、
  // レンダー時に確定するrefで一度だけ読み取る
  const storedBikeIdRef = useRef<string | null | undefined>(undefined)
  if (storedBikeIdRef.current === undefined) {
    storedBikeIdRef.current = readStoredActiveBikeId()
  }

  const { data, error, isLoading } = useSWR(
    user ? '/api/v1/user-bike/bikes' : null,
    async (url) => {
      const response = await apiGet(url)
      return response.data
    }
  )

  const bikes = useMemo(() => data?.bikes ?? [], [data])

  useEffect(() => {
    if (isLoading) return

    // 関数更新式にすることで、直前のactiveBikeIdを常に最新の状態から読み取る
    // （StrictModeの二重呼び出しに対しても副作用を起こさない純粋な計算にする）
    setActiveBikeIdState((current) => {
      if (bikes.length === 0) {
        return current === null ? current : null
      }

      const candidateId = current ?? storedBikeIdRef.current ?? null
      const isValid =
        candidateId !== null &&
        bikes.some((bike) => bike.myUserBikeId === candidateId)

      if (isValid) {
        return candidateId
      }

      return pickFallbackBike(bikes)?.myUserBikeId ?? null
    })
  }, [bikes, isLoading])

  useEffect(() => {
    // 一覧取得中（初期化未確定）の間に書き込むと、
    // 確定前の null で既存の選択を消してしまうため待つ
    if (isLoading) return
    writeStoredActiveBikeId(activeBikeId)
  }, [activeBikeId, isLoading])

  const activeBike = useMemo(
    () => bikes.find((bike) => bike.myUserBikeId === activeBikeId) ?? null,
    [bikes, activeBikeId]
  )

  // useCallbackで参照を安定させる。安定化しないと Provider が再レンダーする
  // たびに新しい関数参照になり、これを依存配列に含む呼び出し側の useEffect
  // （例: 愛車詳細ページの「開いたら自身をアクティブにする」処理）が再実行され、
  // BikeSwitcher で切り替えた直後のアクティブ車両を元の車両へ強制的に
  // 戻してしまう不具合があった。
  const setActiveBikeId = useCallback((bikeId: string) => {
    setActiveBikeIdState(bikeId)
  }, [])

  const value: ActiveBikeContextType = {
    activeBikeId,
    activeBike,
    bikes,
    isLoading,
    error,
    setActiveBikeId,
  }

  return (
    <ActiveBikeContext.Provider value={value}>
      {children}
    </ActiveBikeContext.Provider>
  )
}
