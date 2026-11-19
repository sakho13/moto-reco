type MyBikeSummaryRow = {
  myBikeId: string
  bikeLabel: string
  userId: string
  userName: string
}

/** `GET /api/admin/fuel-logs` の行 */
export type FuelLogRow = MyBikeSummaryRow & {
  id: string
  createdAt: string
  refueledAt: string
  amount: number
  price: number
  mileage: number
  isFullTank: boolean
}

/** `GET /api/admin/tourings` の行 */
export type TouringRow = MyBikeSummaryRow & {
  id: string
  createdAt: string
  title: string
  status: 'STARTED' | 'COMPLETED'
  startDate: string
  endDate: string
  distance: number | null
}

/** `GET /api/admin/maintenance-logs` の行 */
export type MaintenanceLogRow = MyBikeSummaryRow & {
  id: string
  createdAt: string
  performedAt: string
  mileage: number
  itemTypes: string[]
}

export const TOURING_STATUS_OPTIONS = [
  { value: 'STARTED', label: '走行中', color: 'blue' },
  { value: 'COMPLETED', label: '完了', color: 'green' },
] as const
