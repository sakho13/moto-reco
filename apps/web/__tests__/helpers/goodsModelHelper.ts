import { prisma } from '@repo/database'

/**
 * シードデータからグッズ型番(MGoodsModel)のIDを取得する
 */
export async function getTestGoodsModelId(): Promise<string> {
  const model = await prisma.mGoodsModel.findFirst({
    where: { isActive: true },
    select: { id: true },
  })
  if (!model) {
    throw new Error('事前にグッズ型番のシードデータを投入してください')
  }
  return model.id
}

/**
 * 非アクティブなグッズ型番(MGoodsModel)を作成しIDを取得する
 */
export async function getInactiveTestGoodsModelId(): Promise<string> {
  const activeModel = await prisma.mGoodsModel.findFirst({
    where: { isActive: true },
  })
  if (!activeModel) {
    throw new Error('事前にグッズ型番のシードデータを投入してください')
  }

  const inactiveModel = await prisma.mGoodsModel.create({
    data: {
      goodsManufacturerId: activeModel.goodsManufacturerId,
      modelNumber: `TEST-INACTIVE-${Date.now()}-${Math.random()}`,
      name: 'テスト用非アクティブ型番',
      category: activeModel.category,
      isActive: false,
    },
  })
  return inactiveModel.id
}
