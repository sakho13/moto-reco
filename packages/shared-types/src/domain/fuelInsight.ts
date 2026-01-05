export type FuelInsightPeriod =
  | 'last-5'
  | 'past-month'
  | 'past-half-year'
  | 'past-year'
  | 'all'

export type FuelInsight = {
  averageFuelEfficiency: number | null
  averageAmount: number | null
  averageTotalPrice: number | null
  averagePricePerLiter: number | null
  minPricePerLiter: number | null
  maxPricePerLiter: number | null
}
