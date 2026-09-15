import { describe, expect, test } from 'vitest'
import {
  MaintenanceScheduleCalculationService,
  type MaintenanceScheduleLogSummary,
  type MaintenanceScheduleMasterItem,
} from '@repo/shared-domain'

const engineOilItem: MaintenanceScheduleMasterItem = {
  type: 'ENGINE_OIL',
  category: 'ENGINE',
  typeName: 'エンジンオイル',
  categoryName: 'エンジン',
  recommendedMileageInterval: 3000,
  recommendedPeriodMonths: 6,
}

const driveChainItem: MaintenanceScheduleMasterItem = {
  type: 'DRIVE_CHAIN',
  category: 'TRANSMISSION',
  typeName: 'ドライブチェーン',
  categoryName: '動力伝達装置',
  recommendedMileageInterval: 20000,
  recommendedPeriodMonths: null,
}

const brakeFluidItem: MaintenanceScheduleMasterItem = {
  type: 'BRAKE_FLUID',
  category: 'BRAKE',
  typeName: 'ブレーキ液',
  categoryName: 'ブレーキ装置',
  recommendedMileageInterval: null,
  recommendedPeriodMonths: 6,
}

const lightItem: MaintenanceScheduleMasterItem = {
  type: 'LIGHT',
  category: 'ELECTRIC',
  typeName: 'ライト',
  categoryName: '電気装置',
  recommendedMileageInterval: null,
  recommendedPeriodMonths: null,
}

function logOf(
  performedAt: string,
  mileage: number,
  types: MaintenanceScheduleLogSummary['types']
): MaintenanceScheduleLogSummary {
  return { performedAt: new Date(performedAt), mileage, types }
}

describe('MaintenanceScheduleCalculationService', () => {
  const service = new MaintenanceScheduleCalculationService()

  test('走行距離ベースのみの項目は、残り距離から算出される', () => {
    const [result] = service.calculate({
      currentMileage: 25000,
      now: new Date('2024-06-01T00:00:00.000Z'),
      masterItems: [driveChainItem],
      maintenanceLogs: [
        logOf('2024-01-01T00:00:00.000Z', 10000, ['DRIVE_CHAIN']),
      ],
    })

    expect(result).toMatchObject({
      type: 'DRIVE_CHAIN',
      basis: 'MILEAGE',
      remainingMileage: 5000, // 10000 + 20000 - 25000
      dueDate: null,
      remainingDays: null,
      status: 'OK', // 進捗率 (25000-10000)/20000 = 0.75 < 0.8
    })
    expect(result?.lastRecord).toEqual({
      performedAt: new Date('2024-01-01T00:00:00.000Z'),
      mileage: 10000,
    })
  })

  test('期間ベースのみの項目は、次回予定日・残り日数から算出される', () => {
    const [result] = service.calculate({
      currentMileage: 10000, // recommendedMileageIntervalがnullのため影響しない
      now: new Date('2024-04-01T00:00:00.000Z'),
      masterItems: [brakeFluidItem],
      maintenanceLogs: [
        logOf('2024-01-01T00:00:00.000Z', 9000, ['BRAKE_FLUID']),
      ],
    })

    expect(result).toMatchObject({
      type: 'BRAKE_FLUID',
      basis: 'PERIOD',
      remainingMileage: null,
      remainingDays: 91, // 2024-04-01 → 2024-07-01
      status: 'OK', // 進捗率 3/6 = 0.5 < 0.8
    })
    expect(result?.dueDate).toEqual(new Date('2024-07-01T00:00:00.000Z'))
  })

  test('両方設定されている項目は、走行距離側の進捗が早い場合は走行距離基準が採用される', () => {
    const [result] = service.calculate({
      currentMileage: 12800,
      now: new Date('2024-02-01T00:00:00.000Z'),
      masterItems: [engineOilItem],
      maintenanceLogs: [
        logOf('2024-01-01T00:00:00.000Z', 10000, ['ENGINE_OIL']),
      ],
    })

    // 走行距離の進捗率: (12800-10000)/3000 = 0.933
    // 期間の進捗率: 1ヶ月/6ヶ月 = 0.167 → 走行距離側が早く到来するため採用
    expect(result).toMatchObject({
      basis: 'MILEAGE',
      remainingMileage: 200, // 10000 + 3000 - 12800
      dueDate: null,
      remainingDays: null,
      status: 'UPCOMING', // 0.933 >= 0.8
    })
  })

  test('両方設定されている項目は、期間側の進捗が早い場合は期間基準が採用される', () => {
    const [result] = service.calculate({
      currentMileage: 10500,
      now: new Date('2024-06-15T00:00:00.000Z'),
      masterItems: [engineOilItem],
      maintenanceLogs: [
        logOf('2024-01-01T00:00:00.000Z', 10000, ['ENGINE_OIL']),
      ],
    })

    // 走行距離の進捗率: (10500-10000)/3000 = 0.167
    // 期間の進捗率: 166日/182日 ≈ 0.912 → 期間側が早く到来するため採用
    expect(result).toMatchObject({
      basis: 'PERIOD',
      remainingMileage: null,
      remainingDays: 16, // 2024-06-15 → 2024-07-01
      status: 'UPCOMING', // 0.912 >= 0.8
    })
    expect(result?.dueDate).toEqual(new Date('2024-07-01T00:00:00.000Z'))
  })

  test('該当する整備記録が無い項目は「記録なし」(NO_RECORD)になる', () => {
    const [result] = service.calculate({
      currentMileage: 15000,
      now: new Date('2024-06-01T00:00:00.000Z'),
      masterItems: [engineOilItem],
      maintenanceLogs: [
        // ENGINE_OILを含まない記録のみ存在する
        logOf('2024-01-01T00:00:00.000Z', 10000, ['DRIVE_CHAIN']),
      ],
    })

    expect(result).toMatchObject({
      basis: null,
      remainingMileage: null,
      dueDate: null,
      remainingDays: null,
      lastRecord: null,
      status: 'NO_RECORD',
    })
  })

  test('推奨間隔（走行距離・期間とも）が未設定の項目はNO_INTERVALになる', () => {
    const [result] = service.calculate({
      currentMileage: 15000,
      now: new Date('2024-06-01T00:00:00.000Z'),
      masterItems: [lightItem],
      maintenanceLogs: [logOf('2024-01-01T00:00:00.000Z', 10000, ['LIGHT'])],
    })

    expect(result).toMatchObject({
      basis: null,
      remainingMileage: null,
      dueDate: null,
      remainingDays: null,
      status: 'NO_INTERVAL',
    })
    // 整備記録自体は存在するため lastRecord は返す
    expect(result?.lastRecord).toEqual({
      performedAt: new Date('2024-01-01T00:00:00.000Z'),
      mileage: 10000,
    })
  })

  test('走行距離基準で推奨間隔を超過している場合はOVERDUEとなり、残り距離は負値になる', () => {
    const [result] = service.calculate({
      currentMileage: 14000,
      now: new Date('2024-06-01T00:00:00.000Z'),
      masterItems: [driveChainItem],
      maintenanceLogs: [logOf('2024-01-01T00:00:00.000Z', 0, ['DRIVE_CHAIN'])],
    })

    expect(result).toMatchObject({
      basis: 'MILEAGE',
      remainingMileage: 6000, // 0 + 20000 - 14000 (未超過ケースの確認)
      status: 'OK',
    })

    const [overdue] = service.calculate({
      currentMileage: 21000,
      now: new Date('2024-06-01T00:00:00.000Z'),
      masterItems: [driveChainItem],
      maintenanceLogs: [logOf('2024-01-01T00:00:00.000Z', 0, ['DRIVE_CHAIN'])],
    })

    expect(overdue).toMatchObject({
      basis: 'MILEAGE',
      remainingMileage: -1000, // 0 + 20000 - 21000
      status: 'OVERDUE',
    })
  })

  test('期間基準で推奨間隔を超過している場合はOVERDUEとなり、残り日数は負値になる', () => {
    const [result] = service.calculate({
      currentMileage: 10000,
      now: new Date('2024-08-01T00:00:00.000Z'),
      masterItems: [brakeFluidItem],
      maintenanceLogs: [
        logOf('2024-01-01T00:00:00.000Z', 9000, ['BRAKE_FLUID']),
      ],
    })

    expect(result).toMatchObject({
      basis: 'PERIOD',
      remainingDays: -31, // 2024-07-01が期限、2024-08-01時点で31日超過
      status: 'OVERDUE',
    })
  })

  test('複数項目を算出した場合、残りが少ない順（記録なし・NO_INTERVALは末尾）に並ぶ', () => {
    const results = service.calculate({
      currentMileage: 12000,
      now: new Date('2024-02-01T00:00:00.000Z'),
      masterItems: [driveChainItem, engineOilItem, lightItem, brakeFluidItem],
      maintenanceLogs: [
        // DRIVE_CHAIN: 進捗率 (12000-10000)/20000 = 0.1 (最も余裕あり)
        logOf('2024-01-01T00:00:00.000Z', 10000, ['DRIVE_CHAIN']),
        // ENGINE_OIL: 進捗率 (12000-10500)/3000 = 0.5
        logOf('2024-01-01T00:00:00.000Z', 10500, ['ENGINE_OIL']),
        // LIGHTは記録はあるが推奨間隔が未設定のためNO_INTERVAL
        logOf('2024-01-01T00:00:00.000Z', 5000, ['LIGHT']),
        // BRAKE_FLUIDは該当記録が無いためNO_RECORD
      ],
    })

    expect(results.map((f) => f.type)).toEqual([
      'ENGINE_OIL',
      'DRIVE_CHAIN',
      'BRAKE_FLUID',
      'LIGHT',
    ])
  })

  test('limitに相当する絞り込みはサービス側の責務ではなく、calculateは常に全件を返す', () => {
    const results = service.calculate({
      currentMileage: 10000,
      now: new Date('2024-01-01T00:00:00.000Z'),
      masterItems: [driveChainItem, engineOilItem, brakeFluidItem, lightItem],
      maintenanceLogs: [],
    })

    expect(results).toHaveLength(4)
  })
})
