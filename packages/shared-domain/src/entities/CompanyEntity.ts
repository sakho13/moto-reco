import { Company, CompanyCategory, CompanyId } from '@repo/shared-types'

export class CompanyEntity {
  private _value: Company

  constructor(company: Company) {
    this._value = company
  }

  public get id(): CompanyId {
    return this._value.id
  }

  public get name(): string {
    return this._value.name
  }

  public get nameEn(): string | null {
    return this._value.nameEn
  }

  public get logoUrl(): string | null {
    return this._value.logoUrl
  }

  public get websiteUrl(): string | null {
    return this._value.websiteUrl
  }

  public get country(): string | null {
    return this._value.country
  }

  public get categories(): CompanyCategory[] {
    return this._value.categories
  }

  public get isActive(): boolean {
    return this._value.isActive
  }

  public toJson(): Company {
    return this._value
  }
}
