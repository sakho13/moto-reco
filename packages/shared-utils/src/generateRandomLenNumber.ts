/**
 * ランダムな桁数の数字を生成する
 * @param len デフォルト1桁
 * @returns 生成されたランダムな数字
 */
export function generateRandNumberStr(len: number = 1): string {
  const min = Math.pow(10, len - 1)
  const max = Math.pow(10, len) - 1
  return String(Math.floor(Math.random() * (max - min + 1)) + min)
}
