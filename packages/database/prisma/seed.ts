import { GoodsCategory, prisma } from '../src/index'
import { goodsManufacturers, manufacturers } from './seedData'

async function main() {
  console.log('Start seeding...')

  // メーカーマスタのシード
  console.log('Seeding manufacturers...')
  for (const manufacturer of manufacturers) {
    const result = await prisma.mManufacturer.upsert({
      where: { name: manufacturer.name },
      update: {
        name: manufacturer.name,
        nameEn: manufacturer.nameEn,
        websiteUrl: manufacturer.websiteUrl,
        country: manufacturer.country,
        isActive: manufacturer.isActive,
      },
      create: {
        name: manufacturer.name,
        nameEn: manufacturer.nameEn,
        websiteUrl: manufacturer.websiteUrl,
        country: manufacturer.country,
        isActive: manufacturer.isActive,

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
    const result = await prisma.mGoodsManufacturer.upsert({
      where: { name: goodsManufacturer.name },
      update: {
        name: goodsManufacturer.name,
        nameEn: goodsManufacturer.nameEn,
        websiteUrl: goodsManufacturer.websiteUrl,
        isActive: goodsManufacturer.isActive,
      },
      create: {
        name: goodsManufacturer.name,
        nameEn: goodsManufacturer.nameEn,
        websiteUrl: goodsManufacturer.websiteUrl,
        isActive: goodsManufacturer.isActive,
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
