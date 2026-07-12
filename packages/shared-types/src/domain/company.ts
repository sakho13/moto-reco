export type CompanyCategory = 'BIKE_MAKER' | 'GOODS_MANUFACTURER'

export type CompanyId = string & { readonly __brand: unique symbol }
export const createCompanyId = (id: string): CompanyId => id as CompanyId

export type Company = {
  id: CompanyId
  name: string
  nameEn: string | null
  logoUrl: string | null
  websiteUrl: string | null
  country: string | null
  categories: CompanyCategory[]
  isActive: boolean
}
