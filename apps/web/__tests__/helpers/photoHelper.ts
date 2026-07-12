import { prisma } from '@repo/database'

/**
 * テスト用ツーリング写真をPrismaで直接作成する
 */
export async function createTestTouringPhoto(params: {
  userId: string
  touringId: string
  takenAt?: Date
}): Promise<string> {
  const photo = await prisma.tUserPhoto.create({
    data: {
      userId: params.userId,
      photoUrl: 'https://storage.example.com/test.jpg',
      storagePath: `users/${params.userId}/photos/test-${Date.now()}-${Math.random()}.jpg`,
      takenAt: params.takenAt ?? new Date(),
      touringLinks: {
        create: { touringId: params.touringId },
      },
    },
  })
  return photo.id
}

/**
 * テスト用スポット写真をPrismaで直接作成する
 */
export async function createTestSpotPhoto(params: {
  userId: string
  spotId: string
  takenAt?: Date
}): Promise<string> {
  const photo = await prisma.tUserPhoto.create({
    data: {
      userId: params.userId,
      photoUrl: 'https://storage.example.com/test.jpg',
      storagePath: `users/${params.userId}/photos/test-${Date.now()}-${Math.random()}.jpg`,
      takenAt: params.takenAt ?? new Date(),
      spotLinks: {
        create: { spotId: params.spotId },
      },
    },
  })
  return photo.id
}
