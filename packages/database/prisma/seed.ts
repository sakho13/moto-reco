import { prisma } from '../src/index'
import { manufacturers } from './seedData'

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
