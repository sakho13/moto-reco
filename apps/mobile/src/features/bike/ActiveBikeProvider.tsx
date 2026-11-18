import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import useSWR, { type KeyedMutator } from 'swr'
import type {
  ApiResponseUserBikeList,
  SuccessResponse,
} from '@repo/shared-types'
import { selectActiveBike } from './selectActiveBike'
import { apiClient } from '@/lib/api'
import { keyValueStorage, STORAGE_KEYS } from '@/lib/keyValueStorage'

/** 愛車一覧の1台分 */
export type UserBike = ApiResponseUserBikeList['bikes'][number]

/** 愛車一覧の SWR キー */
export const USER_BIKES_KEY = '/api/v1/user-bike/bikes'

export type ActiveBikeContextValue = {
  /** 登録済みの愛車（読み込み前は空配列） */
  bikes: UserBike[]
  /** 選択中の愛車。愛車が無い・読み込み前は null */
  activeBike: UserBike | null
  /** 愛車一覧を読み込み中か（初回のみ） */
  isLoading: boolean
  /** 愛車一覧の読み込みエラー */
  error: unknown
  /** 選択中の愛車を切り替える（次回の起動でも同じ愛車を選ぶ） */
  selectBike: (myUserBikeId: string) => void
  /** 愛車一覧を取り直す（総走行距離の更新後など） */
  refreshBikes: KeyedMutator<SuccessResponse<ApiResponseUserBikeList>>
}

export const ActiveBikeContext = createContext<
  ActiveBikeContextValue | undefined
>(undefined)

/**
 * 愛車一覧と、選択中の愛車を管理する
 *
 * @remarks
 * Web の `ActiveBikeContext` と同じく、記録の対象にする愛車を1台選んでおく。
 * 選んだ愛車は端末に保存し、次回の起動でも同じ愛車を表示する。
 */
export function ActiveBikeProvider({ children }: { children: ReactNode }) {
  const { data, error, isLoading, mutate } = useSWR(USER_BIKES_KEY, () =>
    apiClient.apiGet(USER_BIKES_KEY)
  )
  const [savedBikeId, setSavedBikeId] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    void keyValueStorage.getItem(STORAGE_KEYS.ACTIVE_BIKE_ID).then((value) => {
      if (isMounted) setSavedBikeId(value)
    })
    return () => {
      isMounted = false
    }
  }, [])

  const selectBike = useCallback((myUserBikeId: string) => {
    setSavedBikeId(myUserBikeId)
    void keyValueStorage.setItem(STORAGE_KEYS.ACTIVE_BIKE_ID, myUserBikeId)
  }, [])

  const value = useMemo<ActiveBikeContextValue>(() => {
    const bikes = data?.data.bikes ?? []
    return {
      bikes,
      activeBike: selectActiveBike(bikes, savedBikeId),
      isLoading,
      error,
      selectBike,
      refreshBikes: mutate,
    }
  }, [data, savedBikeId, isLoading, error, selectBike, mutate])

  return (
    <ActiveBikeContext.Provider value={value}>
      {children}
    </ActiveBikeContext.Provider>
  )
}
