import type { Meta, StoryObj } from '@storybook/react'
import type { ApiResponseFuelLogDetail } from '@repo/shared-types'
import { FuelEfficiencyChart } from './fuelEfficiencyChart'

const buildFuelLog = (
  {
    fuelLogId,
    refueledAt,
    mileage,
    previousMileage,
    amount,
    totalPrice,
    fuelEfficiency,
    pricePerLiter,
  }: ApiResponseFuelLogDetail
): ApiResponseFuelLogDetail => ({
  fuelLogId,
  refueledAt,
  mileage,
  previousMileage,
  amount,
  totalPrice,
  fuelEfficiency,
  pricePerLiter,
})

const now = new Date()
const sampleFuelLogs: ApiResponseFuelLogDetail[] = [
  buildFuelLog({
    fuelLogId: 'fuel-log-1',
    refueledAt: new Date(now.getFullYear(), now.getMonth() - 4, 3).toISOString(),
    mileage: 12500,
    previousMileage: 11980,
    amount: 12.4,
    totalPrice: 2014,
    fuelEfficiency: 17.3,
    pricePerLiter: 162.5,
  }),
  buildFuelLog({
    fuelLogId: 'fuel-log-2',
    refueledAt: new Date(now.getFullYear(), now.getMonth() - 3, 6).toISOString(),
    mileage: 13080,
    previousMileage: 12500,
    amount: 13.1,
    totalPrice: 2157,
    fuelEfficiency: 16.8,
    pricePerLiter: 164.6,
  }),
  buildFuelLog({
    fuelLogId: 'fuel-log-3',
    refueledAt: new Date(now.getFullYear(), now.getMonth() - 2, 8).toISOString(),
    mileage: 13640,
    previousMileage: 13080,
    amount: 11.7,
    totalPrice: 1895,
    fuelEfficiency: 18.4,
    pricePerLiter: 162.0,
  }),
  buildFuelLog({
    fuelLogId: 'fuel-log-4',
    refueledAt: new Date(now.getFullYear(), now.getMonth() - 1, 12).toISOString(),
    mileage: 14220,
    previousMileage: 13640,
    amount: 12.9,
    totalPrice: 2128,
    fuelEfficiency: 17.1,
    pricePerLiter: 165.0,
  }),
  buildFuelLog({
    fuelLogId: 'fuel-log-5',
    refueledAt: new Date(now.getFullYear(), now.getMonth(), 15).toISOString(),
    mileage: 14810,
    previousMileage: 14220,
    amount: 13.4,
    totalPrice: 2211,
    fuelEfficiency: 16.6,
    pricePerLiter: 165.0,
  }),
]

const meta: Meta<typeof FuelEfficiencyChart> = {
  title: 'ui/FuelEfficiencyChart',
  component: FuelEfficiencyChart,
}

export default meta

type Story = StoryObj<typeof FuelEfficiencyChart>

export const Default: Story = {
  args: {
    fuelLogs: sampleFuelLogs,
  },
}

export const Empty: Story = {
  args: {
    fuelLogs: [],
  },
}
