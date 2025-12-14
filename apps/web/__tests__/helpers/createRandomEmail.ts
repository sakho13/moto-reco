import { generateRandNumberStr } from '@packages/shared-utils'

export function createRandomEmail() {
  const now = _generateDateStringNow()
  const randomNum = generateRandNumberStr(8)
  return `test+${now}${randomNum}@example.com`
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
