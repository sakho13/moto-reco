import { createClient } from 'microcms-js-sdk'
import { prisma } from '@repo/database'

type MicroCmsReleaseNote = {
  id: string
  title: string
  version: string
  content: string
  status: 'draft' | 'published'
  releaseType: 'patch' | 'minor' | 'major'
  releaseDate: string
  createdAt: string
  updatedAt: string
  publishedAt: string
}

async function main(): Promise<void> {
  const serviceDomain = process.env.MICRO_CMS_SERVICE_DOMAIN
  const apiKey = process.env.MICRO_CMS_API_KEY
  const createdBy = process.env.MIGRATION_ADMIN_USER_ID

  if (!serviceDomain || !apiKey) {
    throw new Error('MICRO_CMS_SERVICE_DOMAIN / MICRO_CMS_API_KEY が未設定です')
  }
  if (!createdBy) {
    throw new Error(
      '移行後のレコードの作成者として記録する管理者ユーザーID (MIGRATION_ADMIN_USER_ID) が未設定です'
    )
  }

  const client = createClient({ serviceDomain, apiKey })

  const { contents } = await client.getList<MicroCmsReleaseNote>({
    endpoint: 'motoreco-releases',
    queries: { limit: 100, orders: 'version' },
  })

  console.log(
    `microCMSから ${contents.length} 件のリリースノートを取得しました`
  )

  for (const note of contents) {
    const existing = await prisma.mSystemAnnouncement.findFirst({
      where: { type: 'RELEASE_ANNOUNCEMENT', version: note.version },
    })
    if (existing) {
      console.log(`v${note.version} は移行済みのためスキップします`)
      continue
    }

    await prisma.mSystemAnnouncement.create({
      data: {
        type: 'RELEASE_ANNOUNCEMENT',
        title: note.title,
        body: note.content,
        version: note.version,
        status: 'PUBLISHED',
        publishedAt: new Date(note.releaseDate || note.publishedAt),
        createdBy,
      },
    })
    console.log(`v${note.version} を移行しました`)
  }

  console.log('移行が完了しました')
}

main()
  .catch((error) => {
    console.error('移行中にエラーが発生しました', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
