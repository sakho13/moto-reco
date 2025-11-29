export type BikeId = string & { readonly __brand: unique symbol }
export const createBikeId = (id: string): BikeId => id as BikeId

export interface Bike {
  id: BikeId
  name: string
}
