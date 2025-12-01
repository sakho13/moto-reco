import { Manufacturer, ManufacturerId } from '@shared-types/index'

export class ManufacturerEntity {
  private _value: Manufacturer

  constructor(manufacturer: Manufacturer) {
    this._value = manufacturer
  }

  public get id(): ManufacturerId {
    return this._value.id
  }

  public get name(): string {
    return this._value.name
  }

  public get nameEn(): string {
    return this._value.nameEn
  }

  public get country(): string {
    return this._value.country
  }

  public toJson(): Manufacturer {
    return this._value
  }
}
