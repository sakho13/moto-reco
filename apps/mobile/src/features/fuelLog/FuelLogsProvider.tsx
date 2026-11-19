import { createContext, useCallback, useContext, type ReactNode } from 'react'
import { useSWRConfig } from 'swr'
import { isFuelLogDetailKeyOf } from './fuelLogApi'
import { useFuelLogs, type FuelLogsState } from './useFuelLogs'
import { useActiveBike } from '@/features/bike/useActiveBike'

const FuelLogsContext = createContext<FuelLogsState | undefined>(undefined)

/**
 * 選択中の愛車の給油履歴一覧を、ログイン後の画面全体で共有する
 *
 * @remarks
 * 一覧画面はナビゲーション中もマウントされたままのため、登録・編集・削除の
 * 画面から一覧を取り直せるよう、一覧の `useSWRInfinite` をここに置く。
 * `ActiveBikeProvider` の内側に置くこと。
 */
export function FuelLogsProvider({ children }: { children: ReactNode }) {
  const { activeBike } = useActiveBike()
  const fuelLogs = useFuelLogs(activeBike?.myUserBikeId ?? null)
  return (
    <FuelLogsContext.Provider value={fuelLogs}>
      {children}
    </FuelLogsContext.Provider>
  )
}

/**
 * 選択中の愛車の給油履歴一覧を取得する
 *
 * @throws {Error} `FuelLogsProvider` の外で呼んだ場合
 */
export function useActiveBikeFuelLogs(): FuelLogsState {
  const context = useContext(FuelLogsContext)
  if (!context) {
    throw new Error(
      'useActiveBikeFuelLogs は FuelLogsProvider の中で使ってください'
    )
  }
  return context
}

/**
 * 給油記録を登録・更新・削除した後に、関係するキャッシュを取り直す関数を返す
 *
 * @remarks
 * 選択中の愛車の給油履歴一覧（全ページ）と、その愛車の給油記録の詳細を取り直す。
 * 総走行距離が変わることがあるため、愛車一覧は呼び出し側で取り直すこと。
 */
export function useRevalidateFuelLogs() {
  const { mutate } = useSWRConfig()
  const { refresh } = useActiveBikeFuelLogs()
  return useCallback(
    async (myUserBikeId: string) => {
      await Promise.all([
        refresh(),
        mutate((key) => isFuelLogDetailKeyOf(myUserBikeId, key)),
      ])
    },
    [mutate, refresh]
  )
}
