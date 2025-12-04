export type BikeId = string & { readonly __brand: unique symbol }
export const createBikeId = (id: string): BikeId => id as BikeId

export interface Bike {
  id: BikeId
  manufacturerId: string
  manufacturer: string
  modelName: string
  displacement: number
  modelYear: number
}
