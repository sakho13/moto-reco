// antd v5 が React 19 を未サポートとして出す互換性警告を抑制
const originalError = console.error.bind(console)
console.error = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('antd v5 support React is 16')) return
  originalError(...args)
}

// Next.js Turbopack + React 19 の Performance.measure 負タイムスタンプバグを抑制
if (typeof performance !== 'undefined') {
  const originalMeasure = performance.measure.bind(performance)
  performance.measure = (
    name: string,
    startOrOptions?: string | PerformanceMeasureOptions,
    endMark?: string,
  ): PerformanceMeasure => {
    try {
      return originalMeasure(name, startOrOptions as string, endMark as string)
    } catch {
      return { name, duration: 0, startTime: 0, entryType: 'measure', detail: null, toJSON: () => ({}) } as PerformanceMeasure
    }
  }
}
