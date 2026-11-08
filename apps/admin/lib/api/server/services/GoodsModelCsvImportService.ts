import { CsvError, parse } from 'csv-parse/sync'
import type {
  GoodsModelCreateInput,
  IGoodsModelCsvImportRepository,
} from '../interfaces/IGoodsModelCsvImportRepository'
import {
  GOODS_MODEL_CSV_COLUMNS,
  GOODS_MODEL_CSV_MAX_BYTES,
  GOODS_MODEL_CSV_MAX_ROWS,
  GOODS_MODEL_CSV_REQUIRED_COLUMNS,
  type GoodsCategoryValue,
  type GoodsModelCsvColumn,
  type GoodsModelCsvRow,
  GoodsModelCsvRowSchema,
} from '@/lib/goodsModelCsv'

export type GoodsModelCsvError = {
  /** データ行番号（ヘッダー行を除いて1始まり）。ファイル全体のエラーは null */
  row: number | null
  /** エラー対象の列。特定の列に紐づかない場合は null */
  column: GoodsModelCsvColumn | null
  message: string
}

export type GoodsModelCsvPreviewItem = {
  row: number
  manufacturerName: string
  modelNumber: string
  name: string
  category: GoodsCategoryValue
  isActive: boolean
}

export type GoodsModelCsvValidationResult = {
  /** データ行数（ヘッダー行を除く） */
  totalRows: number
  /** 登録予定のグッズ型番（エラーのない行） */
  items: GoodsModelCsvPreviewItem[]
  errors: GoodsModelCsvError[]
}

export type GoodsModelCsvImportResult = GoodsModelCsvValidationResult & {
  /** 登録件数。エラーがあり登録しなかった場合は 0 */
  createdCount: number
}

type ValidatedRow = {
  row: number
  data: GoodsModelCsvRow
  goodsManufacturerId: string
}

const isCsvColumn = (value: string): value is GoodsModelCsvColumn =>
  (GOODS_MODEL_CSV_COLUMNS as readonly string[]).includes(value)

const fileError = (message: string): GoodsModelCsvError => ({
  row: null,
  column: null,
  message,
})

/**
 * 管理画面のグッズ型番CSV一括登録を扱うサービス
 *
 * @remarks
 * 1件でもエラーがある場合は登録を行わない（全件成功 or 全件取り消し）。
 * `importCsv` はトランザクション内のリポジトリで呼び出すこと。
 */
export class GoodsModelCsvImportService {
  constructor(private readonly _repository: IGoodsModelCsvImportRepository) {}

  /**
   * CSVを検証し、登録予定の内容とエラーを返す（登録は行わない）
   */
  async validate(csv: Uint8Array): Promise<GoodsModelCsvValidationResult> {
    const { result } = await this._validate(csv)
    return result
  }

  /**
   * CSVを検証し、エラーがなければ一括登録する
   */
  async importCsv(csv: Uint8Array): Promise<GoodsModelCsvImportResult> {
    const { result, validRows } = await this._validate(csv)
    if (result.errors.length > 0 || validRows.length === 0) {
      return { ...result, createdCount: 0 }
    }

    const inputs: GoodsModelCreateInput[] = validRows.map(
      ({ data, goodsManufacturerId }) => ({
        goodsManufacturerId,
        modelNumber: data.modelNumber,
        name: data.name,
        category: data.category,
        imageUrl: data.imageUrl ?? null,
        description: data.description ?? null,
        releaseDate: data.releaseDate ?? null,
        amazonAsin: data.amazonAsin ?? null,
        rakutenItemId: data.rakutenItemId ?? null,
        officialUrl: data.officialUrl ?? null,
        isActive: data.isActive,
      })
    )
    const createdCount = await this._repository.createGoodsModels(inputs)
    return { ...result, createdCount }
  }

  private async _validate(csv: Uint8Array): Promise<{
    result: GoodsModelCsvValidationResult
    validRows: ValidatedRow[]
  }> {
    const empty = (errors: GoodsModelCsvError[], totalRows = 0) => ({
      result: { totalRows, items: [], errors },
      validRows: [],
    })

    if (csv.byteLength > GOODS_MODEL_CSV_MAX_BYTES) {
      return empty([
        fileError(
          `ファイルサイズが上限（${GOODS_MODEL_CSV_MAX_BYTES / 1024 / 1024}MB）を超えています`
        ),
      ])
    }

    const text = this._decode(csv)
    if (text === null) {
      return empty([
        fileError(
          '文字コードがUTF-8ではありません。UTF-8（BOM付き可）で保存し直してください'
        ),
      ])
    }

    let records: string[][]
    try {
      records = parse(text, {
        bom: true,
        skip_empty_lines: true,
        skip_records_with_empty_values: true,
      }) as string[][]
    } catch (e) {
      const detail = e instanceof CsvError ? e.message : String(e)
      return empty([fileError(`CSVの解析に失敗しました: ${detail}`)])
    }

    const [header, ...dataRecords] = records
    if (!header) {
      return empty([fileError('CSVが空です')])
    }

    const headerResult = this._validateHeader(header)
    if ('errors' in headerResult) {
      return empty(headerResult.errors, dataRecords.length)
    }
    const { columns } = headerResult

    if (dataRecords.length === 0) {
      return empty([fileError('データ行がありません')])
    }
    if (dataRecords.length > GOODS_MODEL_CSV_MAX_ROWS) {
      return empty(
        [
          fileError(
            `データ行数が上限（${GOODS_MODEL_CSV_MAX_ROWS}行）を超えています（${dataRecords.length}行）`
          ),
        ],
        dataRecords.length
      )
    }

    const errors: GoodsModelCsvError[] = []

    // 1. 各行の形式チェック
    const parsedRows: { row: number; data: GoodsModelCsvRow }[] = []
    dataRecords.forEach((record, index) => {
      const row = index + 1
      const raw = Object.fromEntries(
        columns.map((column, i) => [column, record[i] ?? ''])
      )
      const parsed = GoodsModelCsvRowSchema.safeParse(raw)
      if (parsed.success) {
        parsedRows.push({ row, data: parsed.data })
        return
      }
      for (const issue of parsed.error.issues) {
        const column = issue.path[0]
        errors.push({
          row,
          column:
            typeof column === 'string' && isCsvColumn(column) ? column : null,
          message: issue.message,
        })
      }
    })

    // 2. メーカー名の解決
    const names = [...new Set(parsedRows.map((r) => r.data.manufacturerName))]
    const companies = await this._repository.findCompaniesByNames(names)
    const companyByName = new Map(companies.map((c) => [c.name, c]))

    const resolvedRows: ValidatedRow[] = []
    for (const { row, data } of parsedRows) {
      const company = companyByName.get(data.manufacturerName)
      if (!company) {
        errors.push({
          row,
          column: 'manufacturerName',
          message: `メーカー「${data.manufacturerName}」は登録されていません`,
        })
        continue
      }
      if (!company.isGoodsManufacturer) {
        errors.push({
          row,
          column: 'manufacturerName',
          message: `「${data.manufacturerName}」はグッズメーカーとして登録されていません`,
        })
        continue
      }
      resolvedRows.push({ row, data, goodsManufacturerId: company.id })
    }

    // 3. CSV内の重複チェック（メーカー×型番）
    const keyOf = (goodsManufacturerId: string, modelNumber: string) =>
      `${goodsManufacturerId}\u0000${modelNumber}`
    const firstRowByKey = new Map<string, number>()
    const uniqueRows: ValidatedRow[] = []
    for (const resolved of resolvedRows) {
      const key = keyOf(resolved.goodsManufacturerId, resolved.data.modelNumber)
      const firstRow = firstRowByKey.get(key)
      if (firstRow !== undefined) {
        errors.push({
          row: resolved.row,
          column: 'modelNumber',
          message: `型番「${resolved.data.modelNumber}」は${firstRow}行目と重複しています`,
        })
        continue
      }
      firstRowByKey.set(key, resolved.row)
      uniqueRows.push(resolved)
    }

    // 4. 登録済みデータとの重複チェック
    const existingKeys = await this._repository.findExistingGoodsModelKeys(
      uniqueRows.map((r) => ({
        goodsManufacturerId: r.goodsManufacturerId,
        modelNumber: r.data.modelNumber,
      }))
    )
    const existingKeySet = new Set(
      existingKeys.map((k) => keyOf(k.goodsManufacturerId, k.modelNumber))
    )
    const validRows: ValidatedRow[] = []
    for (const r of uniqueRows) {
      if (
        existingKeySet.has(keyOf(r.goodsManufacturerId, r.data.modelNumber))
      ) {
        errors.push({
          row: r.row,
          column: 'modelNumber',
          message: `型番「${r.data.modelNumber}」は既に登録されています`,
        })
        continue
      }
      validRows.push(r)
    }

    errors.sort((a, b) => (a.row ?? 0) - (b.row ?? 0))

    return {
      result: {
        totalRows: dataRecords.length,
        items: validRows.map(({ row, data }) => ({
          row,
          manufacturerName: data.manufacturerName,
          modelNumber: data.modelNumber,
          name: data.name,
          category: data.category,
          isActive: data.isActive,
        })),
        errors,
      },
      validRows,
    }
  }

  /**
   * UTF-8としてデコードする（BOMは除去される）
   *
   * @returns UTF-8として不正なバイト列の場合は null
   */
  private _decode(csv: Uint8Array): string | null {
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(csv)
    } catch {
      return null
    }
  }

  private _validateHeader(
    header: string[]
  ): { columns: GoodsModelCsvColumn[] } | { errors: GoodsModelCsvError[] } {
    const errors: GoodsModelCsvError[] = []
    const names = header.map((h) => h.trim())

    const unknown = names.filter((n) => !isCsvColumn(n))
    if (unknown.length > 0) {
      errors.push(fileError(`不明な列があります: ${unknown.join(', ')}`))
    }

    const duplicated = [
      ...new Set(names.filter((n, i) => names.indexOf(n) !== i)),
    ]
    if (duplicated.length > 0) {
      errors.push(fileError(`列が重複しています: ${duplicated.join(', ')}`))
    }

    const missing = GOODS_MODEL_CSV_REQUIRED_COLUMNS.filter(
      (c) => !names.includes(c)
    )
    if (missing.length > 0) {
      errors.push(fileError(`必須列がありません: ${missing.join(', ')}`))
    }

    if (errors.length > 0) return { errors }
    // 不明な列がないことは確認済みのため、列の並び順を保ったまま型を絞り込める
    return { columns: names.filter(isCsvColumn) }
  }
}
