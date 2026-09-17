import { describe, expect, test } from 'vitest'
import {
  appendNumericKey,
  calculateAverageFuelEfficiency,
  calculateBridgedAverageEfficiency,
  calculateDaysAgo,
  calculateFuelEfficiencyComparison,
  calculateLiveGauges,
  formatFuelEfficiencyComparisonNote,
  formatIntegerDisplay,
  formatPreviousStubHeading,
  formatRefueledAtChipLabel,
  parseFieldNumber,
  resolveSavedFuelLogEfficiencyReason,
  resolveSubmitPreviousMileage,
  roundToOneDecimal,
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
  test('直近の給油ログがあればその走行距離をそのまま使う（通常の登録）', () => {
    const value = resolveSubmitPreviousMileage({
      refueledAt: '2024-06-15T09:00:00',
      mileage: 13010,
      logs: [{ mileage: 12750, refueledAt: '2024-06-01T09:00:00' }],
      totalMileage: 12800,
    })
    expect(value).toBe(12750)
  })

  test('過去日時での登録（バックフィル）では、選択した給油日時以前で最も新しいログを基準にする', () => {
    // 回帰再現: 最新ログが13,000kmの状態で、日時チップから過去の
    // 12,700kmの給油を追加入力するケース。常に最新ログ（13,000km）を
    // 基準にすると previousMileage(13000) > mileage(12700) となり
    // 登録スキーマの previousMileage <= mileage に違反して必ず失敗していた。
    const value = resolveSubmitPreviousMileage({
      refueledAt: '2024-06-10T09:00:00',
      mileage: 12700,
      logs: [
        { mileage: 13000, refueledAt: '2024-06-20T09:00:00' }, // 最新（選択日時より後）
        { mileage: 12500, refueledAt: '2024-06-05T09:00:00' }, // 選択日時より前で最新
        { mileage: 12000, refueledAt: '2024-05-01T09:00:00' },
      ],
      totalMileage: 13000,
    })
    expect(value).toBe(12500)
  })

  test('選択した給油日時が既存のどのログよりも古い場合は総走行距離とmileageの小さい方を使う', () => {
    const value = resolveSubmitPreviousMileage({
      refueledAt: '2024-01-01T09:00:00',
      mileage: 4800,
      logs: [{ mileage: 12750, refueledAt: '2024-06-01T09:00:00' }],
      totalMileage: 5000,
    })
    expect(value).toBe(4800)
  })

  test('基準ログがあり、入力ミスで前回以下のmileageでもそのまま返す（サーバー側エラーに委ねる）', () => {
    const value = resolveSubmitPreviousMileage({
      refueledAt: '2024-06-15T09:00:00',
      mileage: 12000,
      logs: [{ mileage: 12750, refueledAt: '2024-06-01T09:00:00' }],
      totalMileage: undefined,
    })
    expect(value).toBe(12750)
  })

  test('既存ログが無い場合は総走行距離とmileageの小さい方を使う', () => {
    const value = resolveSubmitPreviousMileage({
      refueledAt: '2024-06-15T09:00:00',
      mileage: 4800,
      logs: [],
      totalMileage: 5000,
    })
    expect(value).toBe(4800)
  })

  test('既存ログも総走行距離も無い場合はmileage自身を使う', () => {
    const value = resolveSubmitPreviousMileage({
      refueledAt: '2024-06-15T09:00:00',
      mileage: 100,
      logs: [],
      totalMileage: undefined,
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

describe('calculateAverageFuelEfficiency', () => {
  test('燃費が算出できたログのみで平均を取る', () => {
    const avg = calculateAverageFuelEfficiency([
      { fuelEfficiency: 22.0 },
      { fuelEfficiency: null }, // 継ぎ足しなど
      { fuelEfficiency: 20.2 },
    ])
    expect(avg).toBeCloseTo(21.1)
  })

  test('対象が1件も無い場合は null', () => {
    expect(
      calculateAverageFuelEfficiency([{ fuelEfficiency: null }])
    ).toBeNull()
    expect(calculateAverageFuelEfficiency([])).toBeNull()
  })
})

describe('calculateFuelEfficiencyComparison', () => {
  test('今回の燃費・前回・平均が揃っていれば両方の差分を返す', () => {
    const result = calculateFuelEfficiencyComparison({
      currentFuelEfficiency: 22.0,
      previousFuelEfficiency: 20.2,
      averageFuelEfficiency: 21.2,
    })
    expect(result.previousDiff).toBeCloseTo(1.8)
    expect(result.averageDiff).toBeCloseTo(0.8)
  })

  test('今回の燃費が算出できない場合は両方 null', () => {
    const result = calculateFuelEfficiencyComparison({
      currentFuelEfficiency: null,
      previousFuelEfficiency: 20.2,
      averageFuelEfficiency: 21.2,
    })
    expect(result.previousDiff).toBeNull()
    expect(result.averageDiff).toBeNull()
  })

  test('前回・平均のいずれかが無ければその差分のみ null', () => {
    const result = calculateFuelEfficiencyComparison({
      currentFuelEfficiency: 22.0,
      previousFuelEfficiency: null,
      averageFuelEfficiency: 21.2,
    })
    expect(result.previousDiff).toBeNull()
    expect(result.averageDiff).toBeCloseTo(0.8)
  })

  test('丸め前の生値ではなく、表示値（小数点1桁）どうしの差を返す', () => {
    // 22.0339…（表示22.0）と20.1613…（表示20.2）の差は、生値では1.8726
    // （丸めると1.9）だが、表示と一致させるには丸めた値どうしの差1.8にする
    const result = calculateFuelEfficiencyComparison({
      currentFuelEfficiency: 22.0339,
      previousFuelEfficiency: 20.1613,
      averageFuelEfficiency: null,
    })
    expect(result.previousDiff).toBeCloseTo(1.8)
  })
})

describe('roundToOneDecimal', () => {
  test('小数点1桁に四捨五入する', () => {
    expect(roundToOneDecimal(22.0339)).toBeCloseTo(22.0)
    expect(roundToOneDecimal(20.1613)).toBeCloseTo(20.2)
  })
})

describe('resolveSavedFuelLogEfficiencyReason', () => {
  test('直前のログが継ぎ足しなら「前回が継ぎ足し」と判定する', () => {
    const logs = [
      { fuelLogId: 'a', mileage: 12500, isFullTank: false }, // 継ぎ足し
      { fuelLogId: 'b', mileage: 13000, isFullTank: true },
    ]
    expect(resolveSavedFuelLogEfficiencyReason(logs, 'b')).toBe(
      'previous-was-continuation'
    )
  })

  test('直前のログが無ければ「初回給油」と判定する', () => {
    const logs = [{ fuelLogId: 'a', mileage: 12500, isFullTank: true }]
    expect(resolveSavedFuelLogEfficiencyReason(logs, 'a')).toBe(
      'no-previous-log'
    )
  })

  test('直前のログが満タンなら「初回給油」（このケースは通常fuelEfficiencyが算出されるため呼ばれない）', () => {
    const logs = [
      { fuelLogId: 'a', mileage: 12500, isFullTank: true },
      { fuelLogId: 'b', mileage: 13000, isFullTank: true },
    ]
    expect(resolveSavedFuelLogEfficiencyReason(logs, 'b')).toBe(
      'no-previous-log'
    )
  })
})

describe('formatFuelEfficiencyComparisonNote', () => {
  test('前回比・平均比がともに伸びている場合の文言（平均の母数を明示する）', () => {
    expect(
      formatFuelEfficiencyComparisonNote(
        {
          previousDiff: 1.8,
          averageDiff: 0.8,
        },
        6
      )
    ).toBe('前回より 1.8 伸びた ／ 直近6回の平均より 0.8 伸びた')
  })

  test('母数(recentAverageCount)が変わると文言にも反映される', () => {
    expect(
      formatFuelEfficiencyComparisonNote(
        {
          previousDiff: null,
          averageDiff: 0.8,
        },
        4
      )
    ).toBe('直近4回の平均より 0.8 伸びた')
  })

  test('縮んだ場合は「縮んだ」になる', () => {
    expect(
      formatFuelEfficiencyComparisonNote(
        {
          previousDiff: -1.2,
          averageDiff: null,
        },
        6
      )
    ).toBe('前回より 1.2 縮んだ')
  })

  test('差が±0.05km/L未満は「同じ」になる', () => {
    expect(
      formatFuelEfficiencyComparisonNote(
        {
          previousDiff: 0.02,
          averageDiff: null,
        },
        6
      )
    ).toBe('前回と同じ')
  })

  test('両方 null なら null', () => {
    expect(
      formatFuelEfficiencyComparisonNote(
        {
          previousDiff: null,
          averageDiff: null,
        },
        6
      )
    ).toBeNull()
  })
})

describe('calculateDaysAgo', () => {
  test('日付のみで比較し、時刻は無視する', () => {
    const now = new Date(2026, 8, 13, 23, 59)
    expect(calculateDaysAgo('2026-09-01T00:00', now)).toBe(12)
  })

  test('同じ日なら0', () => {
    const now = new Date(2026, 8, 13, 23, 59)
    expect(calculateDaysAgo('2026-09-13T00:05', now)).toBe(0)
  })

  test('不正な日時は null', () => {
    expect(calculateDaysAgo('invalid-date')).toBeNull()
  })
})

describe('formatPreviousStubHeading', () => {
  test('前回の給油日と経過日数を組み立てる', () => {
    const now = new Date(2026, 8, 13, 14, 15)
    expect(formatPreviousStubHeading('2026-09-01T09:40', now)).toBe(
      '前回の控え ─ 9月1日（12日前）'
    )
  })

  test('当日の場合は「今日」になる', () => {
    const now = new Date(2026, 8, 13, 14, 15)
    expect(formatPreviousStubHeading('2026-09-13T09:40', now)).toBe(
      '前回の控え ─ 9月13日（今日）'
    )
  })
})

describe('calculateBridgedAverageEfficiency', () => {
  test('期間の先頭が境界をまたぐ区間でも、境界より前の満タン給油を参照して算出する', () => {
    // 回帰再現（Issue #575 Codexの指摘#5）: bが期間の先頭。直前の満タン給油a
    // は期間より前にあるが、区間判定にはallLogsとして渡すため正しく算出できる
    const allLogs = [
      { fuelLogId: 'a', mileage: 12500, amount: 11.2, isFullTank: true },
      { fuelLogId: 'b', mileage: 12750, amount: 12.4, isFullTank: true },
      { fuelLogId: 'c', mileage: 13010, amount: 11.8, isFullTank: true },
    ]
    const inPeriodFuelLogIds = new Set(['b', 'c'])

    const result = calculateBridgedAverageEfficiency(
      allLogs,
      inPeriodFuelLogIds
    )

    // b: 距離250/給油12.4L, c: 距離260/給油11.8L → 距離加重平均
    expect(result).toBeCloseTo((250 + 260) / (12.4 + 11.8))
  })

  test('境界より前の記録（bridge）を渡さない場合、期間先頭の区間は母数から漏れる', () => {
    // bridgeRows相当のaを渡さないと、bは「直前の満タン給油が無い」扱いになり
    // 区間が算出できない（従来のバグと同じ状態を確認する対照実験）
    const inPeriodOnly = [
      { fuelLogId: 'b', mileage: 12750, amount: 12.4, isFullTank: true },
      { fuelLogId: 'c', mileage: 13010, amount: 11.8, isFullTank: true },
    ]
    const inPeriodFuelLogIds = new Set(['b', 'c'])

    const result = calculateBridgedAverageEfficiency(
      inPeriodOnly,
      inPeriodFuelLogIds
    )

    // cの区間（260/11.8）のみが母数になり、bは含まれない
    expect(result).toBeCloseTo(260 / 11.8)
  })

  test('境界より前に継ぎ足し給油を挟んでいても、その給油量は境界をまたぐ区間に繰り込まれる', () => {
    const allLogs = [
      { fuelLogId: 'a', mileage: 12500, amount: 11.2, isFullTank: true },
      // 継ぎ足し（期間より前）。距離・給油量ともbの区間に繰り込まれる
      { fuelLogId: 'x', mileage: 12600, amount: 3.0, isFullTank: false },
      { fuelLogId: 'b', mileage: 12750, amount: 12.4, isFullTank: true },
    ]
    const inPeriodFuelLogIds = new Set(['b'])

    const result = calculateBridgedAverageEfficiency(
      allLogs,
      inPeriodFuelLogIds
    )

    // bの区間: 距離250 ／ 給油量は継ぎ足し3.0Lを含む 12.4+3.0=15.4L
    expect(result).toBeCloseTo(250 / (12.4 + 3.0))
  })

  test('境界より前に満タン給油が無い場合、期間先頭は従来どおり初回給油扱いになる', () => {
    const allLogs = [
      { fuelLogId: 'b', mileage: 12750, amount: 12.4, isFullTank: true },
      { fuelLogId: 'c', mileage: 13010, amount: 11.8, isFullTank: true },
    ]
    const inPeriodFuelLogIds = new Set(['b', 'c'])

    const result = calculateBridgedAverageEfficiency(
      allLogs,
      inPeriodFuelLogIds
    )

    expect(result).toBeCloseTo(260 / 11.8)
  })

  test('算出できる区間が1件も無い場合はnull', () => {
    const allLogs = [
      { fuelLogId: 'a', mileage: 12500, amount: 11.2, isFullTank: true },
    ]

    expect(
      calculateBridgedAverageEfficiency(allLogs, new Set(['a']))
    ).toBeNull()
  })

  test('空配列はnull', () => {
    expect(calculateBridgedAverageEfficiency([], new Set())).toBeNull()
  })
})
