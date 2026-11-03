import { type NextRequest, NextResponse } from 'next/server'
import { Prisma, prisma } from '@repo/database'
import { requireAdmin } from '@/lib/api/auth'
import { PrismaGoodsModelCsvImportRepository } from '@/lib/api/server/repositories/PrismaGoodsModelCsvImportRepository'
import { GoodsModelCsvImportService } from '@/lib/api/server/services/GoodsModelCsvImportService'
import { GOODS_MODEL_CSV_MAX_BYTES } from '@/lib/goodsModelCsv'

/**
 * グッズ型番をCSVで一括登録する
 *
 * @remarks
 * リクエストボディにCSVファイルの中身（UTF-8）をそのまま送る。
 * - `?dryRun=true`: 検証のみ行い、登録予定の内容とエラーを返す（200）
 * - それ以外: 検証してエラーがなければ全件登録する（201）。エラーがあれば何も登録しない（422）
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > GOODS_MODEL_CSV_MAX_BYTES) {
    return NextResponse.json(
      { message: 'ファイルサイズが上限を超えています' },
      { status: 413 }
    )
  }

  const csv = new Uint8Array(await request.arrayBuffer())
  const dryRun = request.nextUrl.searchParams.get('dryRun') === 'true'

  if (dryRun) {
    const service = new GoodsModelCsvImportService(
      new PrismaGoodsModelCsvImportRepository(prisma)
    )
    const result = await service.validate(csv)
    return NextResponse.json(result)
  }

  try {
    // 検証と登録を同一トランザクションで行い、検証後の競合登録を防ぐ
    const result = await prisma.$transaction(async (tx) => {
      const service = new GoodsModelCsvImportService(
        new PrismaGoodsModelCsvImportRepository(tx)
      )
      return service.importCsv(csv)
    })
    const status =
      result.errors.length > 0 || result.createdCount === 0 ? 422 : 201
    return NextResponse.json(result, { status })
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002'
    ) {
      return NextResponse.json(
        {
          message:
            '取り込み中に同じ型番が登録されました。再度検証してから取り込んでください',
        },
        { status: 409 }
      )
    }
    throw e
  }
}
