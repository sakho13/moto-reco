const pad = (n: number) => String(n).padStart(2, '0')

/** 今日の日付を YYYY-MM-DD 形式で返す */
export const getTodayDateString = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Date または ISO 文字列を YYYY-MM-DDTHH:mm 形式に変換する */
export const toLocalDateTimeString = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * 現在日時を YYYY-MM-DDTHH:mm 形式で返す
 * @param minuteStep - 分を切り捨てる刻み幅（分単位）。デフォルト 1（丸めなし）
 */
export const getNowLocalDateTimeString = (minuteStep = 1): string => {
  const now = new Date()
  if (minuteStep > 1) {
    now.setMinutes(Math.floor(now.getMinutes() / minuteStep) * minuteStep, 0, 0)
  }
  return toLocalDateTimeString(now)
}

/** 今日の日付に指定時刻を組み合わせた YYYY-MM-DDTHH:mm 形式の文字列を返す */
export const getTodayAtTime = (timeStr: string): string => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${timeStr}`
}
