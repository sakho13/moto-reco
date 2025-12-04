import { Bike, BikeId } from '@shared-types/index'

export class BikeEntity {
  private _value: Bike

  constructor(bike: Bike) {
    this._value = bike
  }

  public get id(): BikeId {
    return this._value.id
  }

  public get manufacturerId(): string {
    return this._value.manufacturerId
  }

  public get manufacturer(): string {
    return this._value.manufacturer
  }

  public get modelName(): string {
    return this._value.modelName
  }

  public get displacement(): number {
    return this._value.displacement
  }

  public get modelYear(): number {
    return this._value.modelYear
  }

  public toJson(): Bike {
    return this._value
  }
}
