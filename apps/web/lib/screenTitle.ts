import type { Metadata } from 'next'
import { APP_NAME } from '@/lib/statics'

/**
 * アプリ画面の `metadata.title` を作る
 *
 * @remarks
 * タイトルは「{画面名} | MotoReco」になる。
 * Next.js は文字列の `title` を持つ階層から下へ `template` を引き継がないため、
 * 配下の画面のタイトルにも同じ形式が付くよう `template` を持たせる。
 *
 * @param screenName 画面名。ユーザーが入力した値は GA に送られるため含めない
 */
export function createScreenTitle(screenName: string): Metadata['title'] {
  return {
    default: screenName,
    template: `%s | ${APP_NAME}`,
  }
}
