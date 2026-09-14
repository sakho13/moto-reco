import { describe, expect, test } from 'vitest'
import {
  appendNumericKey,
  calculateLiveGauges,
  formatIntegerDisplay,
  formatRefueledAtChipLabel,
  parseFieldNumber,
  resolveSubmitPreviousMileage,
  sanitizeNumericInput,
  shouldUpdateTotalMileage,
} from '@/lib/fuelLogSheet'

describe('calculateLiveGauges', () => {
  test('前回給油(満タン)があり、今回も満タンなら燃費を算出する', () => {
    const result = calculateLiveGauges({
      mileage: 13010,
      amount: 11.8,
      totalPrice: 2065,
      isFullTank: true,
      previousLog: { mileage: 12750, isFullTank: true },
    })

    expect(result.intervalKm).toBe(260)
    expect(result.fuelEfficiency).toBeCloseTo(260 / 11.8)
    expect(result.pricePerLiter).toBeCloseTo(2065 / 11.8)
    expect(result.efficiencyStatus).toBe('calculated')
  })

  test('継ぎ足しを選択している場合は燃費を算出しない', () => {
    const result = calculateLiveGauges({
      mileage: 13010,
      amount: 5,
      totalPrice: 800,
      isFullTank: false,
      previousLog: { mileage: 12750, isFullTank: true },
    })

    expect(result.fuelEfficiency).toBeNull()
    expect(result.efficiencyStatus).toBe('continuation-selected')
    // 区間距離・単価は継ぎ足しでも表示する
    expect(result.intervalKm).toBe(260)
    expect(result.pricePerLiter).toBeCloseTo(160)
  })

  test('前回給油が存在しない（初回給油）場合は燃費を算出しない', () => {
    const result = calculateLiveGauges({
      mileage: 1000,
      amount: 10,
      totalPrice: 1500,
      isFullTank: true,
      previousLog: null,
    })

    expect(result.intervalKm).toBeNull()
    expect(result.fuelEfficiency).toBeNull()
    expect(result.efficiencyStatus).toBe('no-previous-log')
  })

  test('前回給油が継ぎ足しの場合は燃費を算出しない（区間距離・単価は出す）', () => {
    const result = calculateLiveGauges({
      mileage: 13010,
      amount: 11.8,
      totalPrice: 2065,
      isFullTank: true,
      previousLog: { mileage: 12750, isFullTank: false },
    })

    expect(result.fuelEfficiency).toBeNull()
    expect(result.efficiencyStatus).toBe('previous-was-continuation')
    expect(result.intervalKm).toBe(260)
    expect(result.pricePerLiter).not.toBeNull()
  })

  test('入力ODOが前回給油以下の場合は区間距離・燃費ともnull', () => {
    const result = calculateLiveGauges({
      mileage: 12000,
      amount: 10,
      totalPrice: 1500,
      isFullTank: true,
      previousLog: { mileage: 12750, isFullTank: true },
    })

    expect(result.intervalKm).toBeNull()
    expect(result.fuelEfficiency).toBeNull()
  })

  test('給油量・金額が未入力の場合は単価がnull', () => {
    const result = calculateLiveGauges({
      mileage: 13010,
      amount: null,
      totalPrice: null,
      isFullTank: true,
      previousLog: { mileage: 12750, isFullTank: true },
    })

    expect(result.pricePerLiter).toBeNull()
    expect(result.fuelEfficiency).toBeNull()
  })
})

describe('resolveSubmitPreviousMileage', () => {
  test('前回給油があればその走行距離をそのまま使う', () => {
    const value = resolveSubmitPreviousMileage({
      previousLog: { mileage: 12750, isFullTank: true },
      totalMileage: 12800,
      mileage: 13010,
    })
    expect(value).toBe(12750)
  })

  test('前回給油があり、入力ミスで前回以下のmileageでもそのまま返す（サーバー側エラーに委ねる）', () => {
    const value = resolveSubmitPreviousMileage({
      previousLog: { mileage: 12750, isFullTank: true },
      totalMileage: undefined,
      mileage: 12000,
    })
    expect(value).toBe(12750)
  })

  test('前回給油が無い場合は総走行距離とmileageの小さい方を使う', () => {
    const value = resolveSubmitPreviousMileage({
      previousLog: null,
      totalMileage: 5000,
      mileage: 4800,
    })
    expect(value).toBe(4800)
  })

  test('前回給油も総走行距離も無い場合はmileage自身を使う', () => {
    const value = resolveSubmitPreviousMileage({
      previousLog: null,
      totalMileage: undefined,
      mileage: 100,
    })
    expect(value).toBe(100)
  })
})

describe('shouldUpdateTotalMileage', () => {
  test('入力ODOが総走行距離より大きい場合はtrue', () => {
    expect(shouldUpdateTotalMileage(13010, 12750)).toBe(true)
  })

  test('入力ODOが総走行距離以下の場合はfalse', () => {
    expect(shouldUpdateTotalMileage(12000, 12750)).toBe(false)
    expect(shouldUpdateTotalMileage(12750, 12750)).toBe(false)
  })

  test('総走行距離が不明な場合はfalse', () => {
    expect(shouldUpdateTotalMileage(13010, undefined)).toBe(false)
  })
})

describe('parseFieldNumber', () => {
  test('空文字はnull', () => {
    expect(parseFieldNumber('')).toBeNull()
    expect(parseFieldNumber('  ')).toBeNull()
  })

  test('末尾がドットのみの入力途中はnull', () => {
    expect(parseFieldNumber('.')).toBeNull()
  })

  test('有効な数値はパースする', () => {
    expect(parseFieldNumber('11.8')).toBe(11.8)
    expect(parseFieldNumber('13010')).toBe(13010)
  })
})

describe('formatIntegerDisplay', () => {
  test('桁区切りに変換する', () => {
    expect(formatIntegerDisplay('13010')).toBe('13,010')
  })

  test('空文字は空文字のまま', () => {
    expect(formatIntegerDisplay('')).toBe('')
  })
})

describe('appendNumericKey', () => {
  const integerConstraints = {
    allowDecimal: false,
    maxIntegerDigits: 7,
    maxDecimalDigits: 0,
  }
  const decimalConstraints = {
    allowDecimal: true,
    maxIntegerDigits: 3,
    maxDecimalDigits: 2,
  }

  test('数字を末尾に追加する', () => {
    expect(appendNumericKey('130', '1', integerConstraints)).toBe('1301')
  })

  test('先頭の0は次の数字で置き換える', () => {
    expect(appendNumericKey('0', '5', integerConstraints)).toBe('5')
  })

  test('backspaceで末尾を1文字削除する', () => {
    expect(appendNumericKey('1301', 'backspace', integerConstraints)).toBe(
      '130'
    )
  })

  test('整数部が上限桁数に達すると数字を無視する', () => {
    expect(appendNumericKey('1234567', '8', integerConstraints)).toBe('1234567')
  })

  test('小数点非許可のフィールドでは"."を無視する', () => {
    expect(appendNumericKey('130', '.', integerConstraints)).toBe('130')
  })

  test('小数点許可のフィールドで"."を追加できる', () => {
    expect(appendNumericKey('11', '.', decimalConstraints)).toBe('11.')
  })

  test('空文字から"."を押すと"0."になる', () => {
    expect(appendNumericKey('', '.', decimalConstraints)).toBe('0.')
  })

  test('"."は2つ目以降追加されない', () => {
    expect(appendNumericKey('11.8', '.', decimalConstraints)).toBe('11.8')
  })

  test('小数部が上限桁数に達すると数字を無視する', () => {
    expect(appendNumericKey('11.80', '5', decimalConstraints)).toBe('11.80')
  })
})

describe('sanitizeNumericInput', () => {
  test('数字以外を取り除く', () => {
    expect(
      sanitizeNumericInput('1a2b3', {
        allowDecimal: false,
        maxDecimalDigits: 0,
      })
    ).toBe('123')
  })

  test('小数点は1つだけ残し、小数部は上限桁数で切り詰める', () => {
    expect(
      sanitizeNumericInput('11.8.5', {
        allowDecimal: true,
        maxDecimalDigits: 2,
      })
    ).toBe('11.85')
    expect(
      sanitizeNumericInput('11.855', {
        allowDecimal: true,
        maxDecimalDigits: 2,
      })
    ).toBe('11.85')
  })
})

describe('formatRefueledAtChipLabel', () => {
  test('今日の日時は「今日 HH:mm」になる', () => {
    const now = new Date(2026, 8, 13, 14, 15)
    expect(formatRefueledAtChipLabel('2026-09-13T14:15', now)).toBe(
      '今日 14:15'
    )
  })

  test('今日以外の日時は「M/D HH:mm」になる', () => {
    const now = new Date(2026, 8, 13, 14, 15)
    expect(formatRefueledAtChipLabel('2026-09-01T09:40', now)).toBe('9/1 09:40')
  })
})
