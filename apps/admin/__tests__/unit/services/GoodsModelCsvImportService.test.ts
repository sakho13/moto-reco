import { beforeEach, describe, expect, test, vi } from 'vitest'
import type { IGoodsModelCsvImportRepository } from '@/lib/api/server/interfaces/IGoodsModelCsvImportRepository'
import { GoodsModelCsvImportService } from '@/lib/api/server/services/GoodsModelCsvImportService'
import {
  GOODS_MODEL_CSV_MAX_ROWS,
  UTF8_BOM,
  buildGoodsModelCsvTemplate,
} from '@/lib/goodsModelCsv'

const HEADER = 'manufacturerName,modelNumber,name,category'

const toBytes = (text: string) => new TextEncoder().encode(text)

const buildRepository = (): IGoodsModelCsvImportRepository => ({
  findCompaniesByNames: vi.fn().mockResolvedValue([
    { id: 'c-shoei', name: 'SHOEI', isGoodsManufacturer: true },
    { id: 'c-honda', name: 'ホンダ', isGoodsManufacturer: false },
  ]),
  findExistingGoodsModelKeys: vi.fn().mockResolvedValue([]),
  createGoodsModels: vi
    .fn()
    .mockImplementation((inputs: unknown[]) => Promise.resolve(inputs.length)),
})

describe('GoodsModelCsvImportService', () => {
  let repository: IGoodsModelCsvImportRepository
  let service: GoodsModelCsvImportService

  beforeEach(() => {
    repository = buildRepository()
    service = new GoodsModelCsvImportService(repository)
  })

  describe('validate()', () => {
    test('正常なCSVは登録予定として返し、登録は行わない', async () => {
      const csv = `${HEADER}\nSHOEI,Z-8,Z-8 ヘルメット,HELMET\nSHOEI,GT-Air3,GT-Air3,ヘルメット\n`

      const result = await service.validate(toBytes(csv))

      expect(result.errors).toEqual([])
      expect(result.totalRows).toBe(2)
      expect(result.items).toEqual([
        {
          row: 1,
          manufacturerName: 'SHOEI',
          modelNumber: 'Z-8',
          name: 'Z-8 ヘルメット',
          category: 'HELMET',
          isActive: true,
        },
        {
          row: 2,
          manufacturerName: 'SHOEI',
          modelNumber: 'GT-Air3',
          name: 'GT-Air3',
          category: 'HELMET',
          isActive: true,
        },
      ])
      expect(repository.createGoodsModels).not.toHaveBeenCalled()
    })

    test('BOM付きUTF-8・CRLF・列順の入れ替えを受け付ける', async () => {
      const csv = `${UTF8_BOM}category,name,modelNumber,manufacturerName,isActive\r\nGLOVE,グローブ,G-1,SHOEI,0\r\n`

      const result = await service.validate(toBytes(csv))

      expect(result.errors).toEqual([])
      expect(result.items[0]).toMatchObject({
        category: 'GLOVE',
        modelNumber: 'G-1',
        isActive: false,
      })
    })

    test('テンプレートのヘッダーと形式はそのまま検証を通る', async () => {
      vi.mocked(repository.findCompaniesByNames).mockResolvedValue([
        { id: 'c-sample', name: 'サンプルメーカー', isGoodsManufacturer: true },
      ])

      const result = await service.validate(
        toBytes(buildGoodsModelCsvTemplate())
      )

      expect(result.errors).toEqual([])
      expect(result.items).toHaveLength(1)
    })

    test('UTF-8でないファイルはエラーにする', async () => {
      // Shift_JISの「あ」(0x82 0xA0)
      const bytes = new Uint8Array([
        ...toBytes(`${HEADER}\n`),
        0x82,
        0xa0,
        ...toBytes(',a,b,HELMET\n'),
      ])

      const result = await service.validate(bytes)

      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]!.message).toContain('UTF-8')
    })

    test('必須列の欠落・不明な列はファイルエラーにする', async () => {
      const csv =
        'manufacturerName,name,category,unknownColumn\nSHOEI,a,HELMET,x\n'

      const result = await service.validate(toBytes(csv))

      const messages = result.errors.map((e) => e.message)
      expect(messages).toContainEqual(expect.stringContaining('unknownColumn'))
      expect(messages).toContainEqual(expect.stringContaining('modelNumber'))
      expect(result.items).toEqual([])
    })

    test('データ行がない場合はエラーにする', async () => {
      const result = await service.validate(toBytes(`${HEADER}\n`))

      expect(result.errors[0]!.message).toBe('データ行がありません')
    })

    test('行数が上限を超える場合はエラーにする', async () => {
      const rows = Array.from(
        { length: GOODS_MODEL_CSV_MAX_ROWS + 1 },
        (_, i) => `SHOEI,M-${i},name,HELMET`
      )

      const result = await service.validate(
        toBytes(`${HEADER}\n${rows.join('\n')}\n`)
      )

      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]!.message).toContain('上限')
    })

    test('各行の形式エラーを行番号・列つきで返す', async () => {
      const csv = [
        `${HEADER},releaseDate,officialUrl,isActive`,
        'SHOEI,,name,HELMET,,,',
        'SHOEI,M-2,name,UNKNOWN,,,',
        'SHOEI,M-3,name,HELMET,2026-02-30,,',
        'SHOEI,M-4,name,HELMET,,ftp://example.com,',
        'SHOEI,M-5,name,HELMET,,,yes',
      ].join('\n')

      const result = await service.validate(toBytes(csv))

      expect(result.errors.map((e) => [e.row, e.column])).toEqual([
        [1, 'modelNumber'],
        [2, 'category'],
        [3, 'releaseDate'],
        [4, 'officialUrl'],
        [5, 'isActive'],
      ])
      expect(result.items).toEqual([])
    })

    test('未登録のメーカー・グッズメーカーでない会社はエラーにする', async () => {
      const csv = `${HEADER}\n存在しない会社,M-1,name,HELMET\nホンダ,M-2,name,HELMET\n`

      const result = await service.validate(toBytes(csv))

      expect(result.errors).toEqual([
        {
          row: 1,
          column: 'manufacturerName',
          message: 'メーカー「存在しない会社」は登録されていません',
        },
        {
          row: 2,
          column: 'manufacturerName',
          message: '「ホンダ」はグッズメーカーとして登録されていません',
        },
      ])
    })

    test('CSV内で同じメーカー×型番が重複する場合は後の行をエラーにする', async () => {
      const csv = `${HEADER}\nSHOEI,M-1,a,HELMET\nSHOEI,M-1,b,HELMET\n`

      const result = await service.validate(toBytes(csv))

      expect(result.errors).toEqual([
        {
          row: 2,
          column: 'modelNumber',
          message: '型番「M-1」は1行目と重複しています',
        },
      ])
      expect(result.items.map((i) => i.row)).toEqual([1])
    })

    test('登録済みの型番はエラーにする', async () => {
      vi.mocked(repository.findExistingGoodsModelKeys).mockResolvedValue([
        { goodsManufacturerId: 'c-shoei', modelNumber: 'M-1' },
      ])
      const csv = `${HEADER}\nSHOEI,M-1,a,HELMET\nSHOEI,M-2,b,HELMET\n`

      const result = await service.validate(toBytes(csv))

      expect(repository.findExistingGoodsModelKeys).toHaveBeenCalledWith([
        { goodsManufacturerId: 'c-shoei', modelNumber: 'M-1' },
        { goodsManufacturerId: 'c-shoei', modelNumber: 'M-2' },
      ])
      expect(result.errors).toEqual([
        {
          row: 1,
          column: 'modelNumber',
          message: '型番「M-1」は既に登録されています',
        },
      ])
    })
  })

  describe('importCsv()', () => {
    test('エラーがなければ全件を登録する', async () => {
      const csv = [
        'manufacturerName,modelNumber,name,category,imageUrl,description,releaseDate,amazonAsin,rakutenItemId,officialUrl,isActive',
        'SHOEI,Z-8,Z-8,HELMET,https://example.com/a.jpg,"1行目\n2行目, カンマ",2026-01-15,B000000001,rk-1,https://example.com/z8,false',
        'SHOEI,G-1,グローブ,GLOVE,,,,,,,',
      ].join('\n')

      const result = await service.importCsv(toBytes(csv))

      expect(result.createdCount).toBe(2)
      expect(repository.createGoodsModels).toHaveBeenCalledWith([
        {
          goodsManufacturerId: 'c-shoei',
          modelNumber: 'Z-8',
          name: 'Z-8',
          category: 'HELMET',
          imageUrl: 'https://example.com/a.jpg',
          description: '1行目\n2行目, カンマ',
          releaseDate: new Date('2026-01-15T00:00:00Z'),
          amazonAsin: 'B000000001',
          rakutenItemId: 'rk-1',
          officialUrl: 'https://example.com/z8',
          isActive: false,
        },
        {
          goodsManufacturerId: 'c-shoei',
          modelNumber: 'G-1',
          name: 'グローブ',
          category: 'GLOVE',
          imageUrl: null,
          description: null,
          releaseDate: null,
          amazonAsin: null,
          rakutenItemId: null,
          officialUrl: null,
          isActive: true,
        },
      ])
    })

    test('1件でもエラーがあれば何も登録しない', async () => {
      const csv = `${HEADER}\nSHOEI,M-1,a,HELMET\nSHOEI,M-2,b,UNKNOWN\n`

      const result = await service.importCsv(toBytes(csv))

      expect(result.createdCount).toBe(0)
      expect(result.errors).toHaveLength(1)
      expect(repository.createGoodsModels).not.toHaveBeenCalled()
    })
  })
})
