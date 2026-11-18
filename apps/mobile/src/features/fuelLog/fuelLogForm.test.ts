import { describe, expect, it } from 'vitest'
import {
  buildFuelLogRegisterRequest,
  buildFuelLogUpdateRequest,
  createEmptyFuelLogForm,
  sanitizeFuelLogNumericInput,
  toFuelLogFormValues,
  validateFuelLogForm,
  type FuelLogFormValues,
} from './fuelLogForm'

const refueledAt = new Date('2026-11-01T09:30:00+09:00')

const filledForm = (
  overrides: Partial<FuelLogFormValues> = {}
): FuelLogFormValues => ({
  ...createEmptyFuelLogForm(refueledAt),
  mileage: '12345',
  amount: '8.52',
  totalPrice: '1500',
  ...overrides,
})

describe('sanitizeFuelLogNumericInput', () => {
  it('ODO と支払金額は数字だけにし、整数部を7桁までにする', () => {
    expect(sanitizeFuelLogNumericInput('mileage', '12,345km')).toBe('12345')
    expect(sanitizeFuelLogNumericInput('totalPrice', '123456789')).toBe(
      '1234567'
    )
  })

  it('給油量は小数点を1つ・小数2桁まで、整数部3桁までにする', () => {
    expect(sanitizeFuelLogNumericInput('amount', '8.5.27')).toBe('8.52')
    expect(sanitizeFuelLogNumericInput('amount', '12345.6')).toBe('123.6')
  })
})

describe('validateFuelLogForm', () => {
  it('必須の数値が空ならエラーを返す', () => {
    const result = validateFuelLogForm(createEmptyFuelLogForm(refueledAt))
    expect(result).toEqual({
      ok: false,
      errors: {
        mileage: '走行距離（ODO）を入力してください',
        amount: '給油量を入力してください',
        totalPrice: '支払金額を入力してください',
      },
    })
  })

  it('給油量が0ならエラーを返す', () => {
    const result = validateFuelLogForm(filledForm({ amount: '0' }))
    expect(result).toEqual({
      ok: false,
      errors: { amount: '給油量は0より大きい値を入力してください' },
    })
  })

  it('メモが500文字を超えるとエラーを返す', () => {
    const result = validateFuelLogForm(filledForm({ memo: 'あ'.repeat(501) }))
    expect(result.ok).toBe(false)
  })

  it('正しい入力なら数値に変換し、空のメモは null にする', () => {
    const result = validateFuelLogForm(filledForm({ memo: '  ' }))
    expect(result).toEqual({
      ok: true,
      parsed: {
        refueledAt,
        mileage: 12345,
        amount: 8.52,
        totalPrice: 1500,
        isFullTank: true,
        memo: null,
      },
    })
  })
})

describe('buildFuelLogRegisterRequest', () => {
  const parsed = {
    refueledAt,
    mileage: 12345,
    amount: 8.52,
    totalPrice: 1500,
    isFullTank: false,
    memo: 'ハイオク',
  }

  it('前回走行距離は選んだ日時以前の最新の給油記録から取る', () => {
    const request = buildFuelLogRegisterRequest({
      parsed,
      resolvedPreviousLog: { mileage: 12000 },
      totalMileage: 12300,
    })
    expect(request).toEqual({
      ...parsed,
      previousMileage: 12000,
      updateTotalMileage: true,
    })
  })

  it('初回の給油は総走行距離と ODO の小さい方を前回走行距離にする', () => {
    const request = buildFuelLogRegisterRequest({
      parsed,
      resolvedPreviousLog: null,
      totalMileage: 13000,
    })
    expect(request.previousMileage).toBe(12345)
    expect(request.updateTotalMileage).toBe(false)
  })
})

describe('buildFuelLogUpdateRequest', () => {
  it('前回走行距離は保存済みの値をそのまま送る', () => {
    const parsed = {
      refueledAt,
      mileage: 12345,
      amount: 8.52,
      totalPrice: 1500,
      isFullTank: true,
      memo: null,
    }
    expect(
      buildFuelLogUpdateRequest({
        fuelLogId: 'log-1',
        parsed,
        previousMileage: 12000,
      })
    ).toEqual({ fuelLogId: 'log-1', ...parsed, previousMileage: 12000 })
  })
})

describe('toFuelLogFormValues', () => {
  it('保存済みの記録を文字列の入力値にする', () => {
    expect(
      toFuelLogFormValues({
        refueledAt: refueledAt.toISOString(),
        mileage: 12345,
        amount: 8.5,
        totalPrice: 1500,
        isFullTank: false,
        memo: null,
      })
    ).toEqual({
      refueledAt,
      mileage: '12345',
      amount: '8.5',
      totalPrice: '1500',
      isFullTank: false,
      memo: '',
    })
  })
})
