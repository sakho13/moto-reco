export type BikeId = string & { readonly __brand: unique symbol }

export interface Bike {
  id: BikeId
  name: string
}
