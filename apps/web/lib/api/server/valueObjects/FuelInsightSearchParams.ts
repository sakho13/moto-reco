import { FuelInsightPeriod } from '@repo/shared-types'

export class FuelInsightSearchParams {
  private readonly _period: FuelInsightPeriod

  constructor(params: { period?: FuelInsightPeriod }) {
    this._period = params.period ?? 'all'
  }

  get period(): FuelInsightPeriod {
    return this._period
  }
}
