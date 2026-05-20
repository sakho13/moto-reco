/**
 * E2E テスト用のランダムなメールアドレスを生成する
 *
 * @remarks
 * apps/web/__tests__/helpers/createRandomEmail.ts と同等の実装。
 * shared-utils への依存を避けるためここでは独自実装。
 */
export function createRandomEmail(): string {
  const now = _generateDateStringNow()
  const randomNum = _generateRandNumberStr(8)
  return `e2e+${now}${randomNum}@example.com`
}

function _generateDateStringNow(): string {
  const now = new Date()
  const year = now.getFullYear().toString().padStart(4, '0')
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const seconds = now.getSeconds().toString().padStart(2, '0')
  const milliseconds = now.getMilliseconds().toString().padStart(3, '0')
  return `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`
}

function _generateRandNumberStr(length: number): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('')
}
