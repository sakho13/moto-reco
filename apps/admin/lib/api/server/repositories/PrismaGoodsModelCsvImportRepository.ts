import type {
  CsvImportCompany,
  GoodsModelCreateInput,
  GoodsModelKey,
  IGoodsModelCsvImportRepository,
} from '../interfaces/IGoodsModelCsvImportRepository'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

export class PrismaGoodsModelCsvImportRepository
  extends PrismaRepositoryBase
  implements IGoodsModelCsvImportRepository
{
  async findCompaniesByNames(names: string[]): Promise<CsvImportCompany[]> {
    if (names.length === 0) return []
    const rows = await this.connection.mCompany.findMany({
      where: { name: { in: names } },
      select: { id: true, name: true, categories: true },
    })
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      isGoodsManufacturer: row.categories.includes('GOODS_MANUFACTURER'),
    }))
  }

  async findExistingGoodsModelKeys(
    keys: GoodsModelKey[]
  ): Promise<GoodsModelKey[]> {
    if (keys.length === 0) return []
    return this.connection.mGoodsModel.findMany({
      where: {
        OR: keys.map((key) => ({
          goodsManufacturerId: key.goodsManufacturerId,
          modelNumber: key.modelNumber,
        })),
      },
      select: { goodsManufacturerId: true, modelNumber: true },
    })
  }

  async createGoodsModels(inputs: GoodsModelCreateInput[]): Promise<number> {
    if (inputs.length === 0) return 0
    const result = await this.connection.mGoodsModel.createMany({
      data: inputs,
    })
    return result.count
  }
}
