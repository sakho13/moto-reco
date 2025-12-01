export type ManufacturerId = string & { readonly brand: unique symbol }
export const createManufacturerId = (id: string): ManufacturerId =>
  id as ManufacturerId

export type Manufacturer = {
  id: ManufacturerId
  name: string
  nameEn: string
  country: string
}
