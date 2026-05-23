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
