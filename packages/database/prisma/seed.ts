import { prisma } from '../src/index'

/**
 * メーカーマスタのシードデータ
 */
const manufacturers = [
  {
    name: 'ホンダ',
    nameEn: 'Honda',
    websiteUrl: 'https://www.honda.co.jp/motor/',
    country: '日本',
    isActive: true,
  },
  {
    name: 'ヤマハ',
    nameEn: 'Yamaha',
    websiteUrl: 'https://www.yamaha-motor.co.jp/mc/',
    country: '日本',
    isActive: true,
  },
  {
    name: 'スズキ',
    nameEn: 'Suzuki',
    websiteUrl: 'https://www1.suzuki.co.jp/motor/',
    country: '日本',
    isActive: true,
  },
  {
    name: 'カワサキ',
    nameEn: 'Kawasaki',
    websiteUrl: 'https://www.kawasaki-motors.com/mc/',
    country: '日本',
    isActive: true,
  },
  {
    name: 'ドゥカティ',
    nameEn: 'Ducati',
    websiteUrl: 'https://www.ducati.com/',
    country: 'イタリア',
    isActive: true,
  },
  {
    name: 'BMW',
    nameEn: 'BMW Motorrad',
    websiteUrl: 'https://www.bmw-motorrad.jp/',
    country: 'ドイツ',
    isActive: true,
  },
  {
    name: 'ハーレーダビッドソン',
    nameEn: 'Harley-Davidson',
    websiteUrl: 'https://www.harley-davidson.com/',
    country: 'アメリカ',
    isActive: true,
  },
  {
    name: 'トライアンフ',
    nameEn: 'Triumph',
    websiteUrl: 'https://www.triumph-motorcycles.jp/',
    country: 'イギリス',
    isActive: true,
  },
  {
    name: 'KTM',
    nameEn: 'KTM',
    websiteUrl: 'https://www.ktm.com/',
    country: 'オーストリア',
    isActive: true,
  },
  {
    name: 'アプリリア',
    nameEn: 'Aprilia',
    websiteUrl: 'https://www.aprilia.com/',
    country: 'イタリア',
    isActive: true,
  },
]

async function main() {
  console.log('Start seeding...')

  // メーカーマスタのシード
  console.log('Seeding manufacturers...')
  for (const manufacturer of manufacturers) {
    const result = await prisma.mManufacturer.upsert({
      where: { name: manufacturer.name },
      update: manufacturer,
      create: manufacturer,
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
