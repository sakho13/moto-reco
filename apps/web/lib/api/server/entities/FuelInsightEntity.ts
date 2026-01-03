import { FuelInsight } from '@repo/shared-types'

export class FuelInsightEntity {
  private _value: FuelInsight

  constructor(fuelInsight: FuelInsight) {
    const values = [
      fuelInsight.averageFuelEfficiency,
      fuelInsight.averageAmount,
      fuelInsight.averageTotalPrice,
      fuelInsight.averagePricePerLiter,
      fuelInsight.minPricePerLiter,
      fuelInsight.maxPricePerLiter,
    ]

    values.forEach((value) => {
      if (value !== null && value < 0) {
        throw new Error('燃費インサイトは0以上である必要があります')
      }
    })

    this._value = fuelInsight
  }

  public get averageFuelEfficiency(): number | null {
    return this._value.averageFuelEfficiency
  }

  public get averageAmount(): number | null {
    return this._value.averageAmount
  }

  public get averageTotalPrice(): number | null {
    return this._value.averageTotalPrice
  }

  public get averagePricePerLiter(): number | null {
    return this._value.averagePricePerLiter
  }

  public get minPricePerLiter(): number | null {
    return this._value.minPricePerLiter
  }

  public get maxPricePerLiter(): number | null {
    return this._value.maxPricePerLiter
  }

  public toJson(): FuelInsight {
    return this._value
  }
}
