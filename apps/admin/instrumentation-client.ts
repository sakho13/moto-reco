// antd v5 が React 19 環境で出す互換性警告を抑制
const _ce = console.error.bind(console)
console.error = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : ''
  if (msg.includes('antd v5 support React is 16')) return
  _ce(...args)
}
const _cw = console.warn.bind(console)
console.warn = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : ''
  if (msg.includes('[antd] There exists deprecated usage')) return
  _cw(...args)
}

// Next.js Turbopack + React 19 の Performance.measure 負タイムスタンプバグを抑制
if (typeof performance !== 'undefined') {
  const originalMeasure = performance.measure.bind(performance)
  performance.measure = (
    name: string,
    startOrOptions?: string | PerformanceMeasureOptions,
    endMark?: string
  ): PerformanceMeasure => {
    try {
      return originalMeasure(name, startOrOptions as string, endMark as string)
    } catch {
      return {
        name,
        duration: 0,
        startTime: 0,
        entryType: 'measure',
        detail: null,
        toJSON: () => ({}),
      } as PerformanceMeasure
    }
  }
}
