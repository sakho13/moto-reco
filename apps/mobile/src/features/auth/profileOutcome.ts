import { ApiV1Error } from '@repo/shared-domain'

/**
 * ログイン後にプロフィールを取得した結果、アプリをどの状態にするか
 *
 * - `registered`: 登録済み。アプリ本体を表示する
 * - `needsRegistration`: Firebase のアカウントはあるが、ユーザー登録（API）が済んでいない
 * - `quit`: 退会済み。ログアウトしてメッセージを出す
 * - `invalidSession`: IDトークンが無効。ログアウトする
 * - `unavailable`: 通信できないなど。ログイン状態は保ったままアプリ本体を表示する
 */
export type ProfileOutcome =
  | 'registered'
  | 'needsRegistration'
  | 'quit'
  | 'invalidSession'
  | 'unavailable'

/**
 * プロフィール取得に失敗したときのエラーから、アプリの状態を決める
 *
 * @remarks
 * 通信できない・サーバーエラーなどでログイン画面に戻すと、電波の悪い場所で
 * 開くたびにログアウトされてしまうため、`unavailable` としてログイン状態を保つ。
 */
export function classifyProfileError(error: unknown): ProfileOutcome {
  if (!(error instanceof ApiV1Error)) return 'unavailable'
  switch (error.errorCode) {
    case 'USER_NOT_REGISTERED':
      return 'needsRegistration'
    case 'USER_QUIT':
      return 'quit'
    case 'AUTH_FAILED':
      return 'invalidSession'
    default:
      return 'unavailable'
  }
}
