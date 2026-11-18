import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useSWRConfig } from 'swr'
import { ApiV1Error } from '@repo/shared-domain'
import type { ApiResponseUserProfile } from '@repo/shared-types'
import { classifyProfileError, type ProfileOutcome } from './profileOutcome'
import { apiClient } from '@/lib/api'
import { getErrorMessage } from '@/lib/errorMessage'
import { firebaseAuth } from '@/lib/firebase'
import { keyValueStorage, STORAGE_KEYS } from '@/lib/keyValueStorage'

/**
 * アプリの認証状態
 *
 * - `initializing`: 端末に保存されたログイン状態を復元中
 * - `signedOut`: 未ログイン（ログイン・新規登録の画面を出す）
 * - `needsRegistration`: Firebase にはログイン済みだが、ユーザー名の登録が済んでいない
 * - `signedIn`: ログイン済み（アプリ本体を出す）
 */
export type AuthStatus =
  | 'initializing'
  | 'signedOut'
  | 'needsRegistration'
  | 'signedIn'

export type AuthContextValue = {
  status: AuthStatus
  /** Firebase のユーザー（未ログインなら null） */
  user: User | null
  /** API のプロフィール（取得できていなければ null） */
  profile: ApiResponseUserProfile | null
  /**
   * 画面を切り替えた先で伝えたいメッセージ
   *
   * @remarks
   * 退会済みでログアウトしたときや、ユーザー登録に失敗したときに使う。
   */
  notice: string | null
  clearNotice: () => void
  /** メールアドレスとパスワードでログインする。失敗したら例外を投げる */
  signIn: (email: string, password: string) => Promise<void>
  /** アカウントを作り、ユーザー名を登録する。失敗したら例外を投げる */
  register: (params: {
    name: string
    email: string
    password: string
  }) => Promise<void>
  /** Firebase のアカウント作成後に残ったユーザー名の登録を済ませる */
  completeRegistration: (name: string) => Promise<void>
  /** ログアウトする */
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
)

const QUIT_MESSAGE =
  '退会済みのアカウントです。ご登録のメールアドレスをご確認ください。'

/**
 * 認証状態を管理し、子コンポーネントへ渡す
 *
 * @remarks
 * Firebase のログイン状態に加えて、API のプロフィールが取れるか（ユーザー登録が
 * 済んでいるか・退会していないか）まで確認してから `signedIn` にする。
 * `SWRConfig` の内側に置くこと（ログアウト時にキャッシュを消すため）。
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { mutate } = useSWRConfig()
  const [status, setStatus] = useState<AuthStatus>('initializing')
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ApiResponseUserProfile | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  /**
   * ログイン・新規登録の処理中は、Firebase の状態変化を受けてプロフィールを
   * 取りに行かない（処理側が順番に行うため。並行すると登録前に「未登録」と判定される）
   */
  const isExplicitFlowRef = useRef(false)

  /** プロフィールを取得し、その結果に合わせて状態を更新する */
  const loadProfile = useCallback(async (): Promise<ProfileOutcome> => {
    try {
      const response = await apiClient.apiGet('/api/v1/user/profile')
      setProfile(response.data)
      setStatus('signedIn')
      return 'registered'
    } catch (error: unknown) {
      const outcome = classifyProfileError(error)
      setProfile(null)
      switch (outcome) {
        case 'needsRegistration':
          setStatus('needsRegistration')
          break
        case 'quit':
        case 'invalidSession':
          await firebaseSignOut(firebaseAuth)
          setStatus('signedOut')
          break
        default:
          setStatus('signedIn')
      }
      return outcome
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      setUser(firebaseUser)
      if (!firebaseUser) {
        setProfile(null)
        setStatus('signedOut')
        return
      }
      if (isExplicitFlowRef.current) return

      // 端末に保存されていたログイン状態の復元
      void loadProfile().then((outcome) => {
        if (outcome === 'quit') setNotice(QUIT_MESSAGE)
      })
    })
    return unsubscribe
  }, [loadProfile])

  /** ログイン・新規登録の処理を、状態変化の自動処理を止めた状態で行う */
  const runExplicitFlow = useCallback(
    async <T,>(flow: () => Promise<T>): Promise<T> => {
      isExplicitFlowRef.current = true
      try {
        return await flow()
      } finally {
        isExplicitFlowRef.current = false
      }
    },
    []
  )

  const signIn = useCallback(
    (email: string, password: string) =>
      runExplicitFlow(async () => {
        setNotice(null)
        await signInWithEmailAndPassword(firebaseAuth, email, password)
        const outcome = await loadProfile()
        if (outcome === 'quit') throw new ApiV1Error('USER_QUIT', QUIT_MESSAGE)
      }),
    [loadProfile, runExplicitFlow]
  )

  const register = useCallback(
    ({
      name,
      email,
      password,
    }: {
      name: string
      email: string
      password: string
    }) =>
      runExplicitFlow(async () => {
        setNotice(null)
        await createUserWithEmailAndPassword(firebaseAuth, email, password)
        try {
          await apiClient.apiPost('/api/v1/user/auth/register', {
            name: name.trim(),
          })
        } catch (error: unknown) {
          // Firebase のアカウントはできているため、ユーザー名の登録だけをやり直せる画面へ移す
          setNotice(
            getErrorMessage(
              error,
              'ユーザー登録に失敗しました。もう一度お試しください。'
            )
          )
          setStatus('needsRegistration')
          return
        }
        await loadProfile()
      }),
    [loadProfile, runExplicitFlow]
  )

  const completeRegistration = useCallback(
    async (name: string) => {
      setNotice(null)
      await apiClient.apiPost('/api/v1/user/auth/register', {
        name: name.trim(),
      })
      await loadProfile()
    },
    [loadProfile]
  )

  const signOut = useCallback(async () => {
    await firebaseSignOut(firebaseAuth)
    // 次にログインした人に前の人のデータを見せないよう、キャッシュと保存値を消す
    await mutate(() => true, undefined, { revalidate: false })
    await keyValueStorage.removeItem(STORAGE_KEYS.ACTIVE_BIKE_ID)
  }, [mutate])

  const clearNotice = useCallback(() => setNotice(null), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      profile,
      notice,
      clearNotice,
      signIn,
      register,
      completeRegistration,
      signOut,
    }),
    [
      status,
      user,
      profile,
      notice,
      clearNotice,
      signIn,
      register,
      completeRegistration,
      signOut,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
