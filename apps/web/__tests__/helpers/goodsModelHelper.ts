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
