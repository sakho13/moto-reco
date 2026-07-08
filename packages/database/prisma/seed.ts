import { CompanyCategory, GoodsCategory, prisma } from '../src/index'
import { goodsManufacturers, manufacturers } from './seedData'

/**
 * 既存の categories を消さずに新しい区分をユニオンして返す
 */
async function unionCategories(
  name: string,
  category: CompanyCategory
): Promise<CompanyCategory[]> {
  const existing = await prisma.mCompany.findUnique({ where: { name } })
  return Array.from(new Set([...(existing?.categories ?? []), category]))
}

async function main() {
  console.log('Start seeding...')

  // メーカーマスタのシード
  console.log('Seeding manufacturers...')
  for (const manufacturer of manufacturers) {
    const categories = await unionCategories(manufacturer.name, 'BIKE_MAKER')
    const result = await prisma.mCompany.upsert({
      where: { name: manufacturer.name },
      update: {
        name: manufacturer.name,
        nameEn: manufacturer.nameEn,
        websiteUrl: manufacturer.websiteUrl,
        country: manufacturer.country,
        isActive: manufacturer.isActive,
        categories,
      },
      create: {
        name: manufacturer.name,
        nameEn: manufacturer.nameEn,
        websiteUrl: manufacturer.websiteUrl,
        country: manufacturer.country,
        isActive: manufacturer.isActive,
        categories,

        bikes: {
          create:
            manufacturer.bikes?.map((bike) => ({
              modelName: bike.modelName,
              displacement: bike.displacement,
              modelYear: bike.modelYear,
              modelCode: bike.modelCode,
              releaseYear: bike.releaseYear,
              releaseMonth: bike.releaseMonth,
            })) || [],
        },
      },
    })
    console.log(
      `Created/Updated manufacturer: ${result.name} (${result.nameEn})`
    )
  }

  // グッズメーカー・型番マスタのシード
  console.log('Seeding goods manufacturers...')
  for (const goodsManufacturer of goodsManufacturers) {
    const categories = await unionCategories(
      goodsManufacturer.name,
      'GOODS_MANUFACTURER'
    )
    const result = await prisma.mCompany.upsert({
      where: { name: goodsManufacturer.name },
      update: {
        name: goodsManufacturer.name,
        nameEn: goodsManufacturer.nameEn,
        websiteUrl: goodsManufacturer.websiteUrl,
        isActive: goodsManufacturer.isActive,
        categories,
      },
      create: {
        name: goodsManufacturer.name,
        nameEn: goodsManufacturer.nameEn,
        websiteUrl: goodsManufacturer.websiteUrl,
        isActive: goodsManufacturer.isActive,
        categories,
      },
    })

    for (const model of goodsManufacturer.models) {
      await prisma.mGoodsModel.upsert({
        where: {
          goodsManufacturerId_modelNumber: {
            goodsManufacturerId: result.id,
            modelNumber: model.modelNumber,
          },
        },
        update: {
          name: model.name,
          category: model.category as GoodsCategory,
          amazonAsin: model.amazonAsin,
          rakutenItemId: model.rakutenItemId,
        },
        create: {
          goodsManufacturerId: result.id,
          modelNumber: model.modelNumber,
          name: model.name,
          category: model.category as GoodsCategory,
          amazonAsin: model.amazonAsin,
          rakutenItemId: model.rakutenItemId,
        },
      })
    }

    console.log(
      `Created/Updated goods manufacturer: ${result.name} (${result.nameEn}), ${goodsManufacturer.models.length} model(s)`
    )
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
