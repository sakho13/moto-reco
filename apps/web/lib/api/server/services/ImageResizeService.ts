import sharp from 'sharp'
import { ApiV1Error } from '@repo/shared-domain'
import type { AllowedPhotoContentType } from '@repo/shared-types'

/** リサイズ後の長辺の上限ピクセル数 */
export const IMAGE_RESIZE_MAX_DIMENSION_PX = 1920

/** JPEG/WebP出力時の品質（0-100） */
export const IMAGE_RESIZE_QUALITY = 80

/**
 * 写真アップロード時に画像をコンパクトサイズへ変換する純粋な画像処理サービス
 *
 * @remarks
 * Storageへのダウンロード/アップロードなど外部I/Oは一切行わず、
 * 受け取ったBufferを加工して新たなBufferを返すことのみを責務とする。
 */
export class ImageResizeService {
  /**
   * 画像を長辺 {@link IMAGE_RESIZE_MAX_DIMENSION_PX} px 以内にリサイズする
   *
   * @remarks
   * EXIFのOrientation情報に基づき向きを補正したうえでリサイズする。
   * 元画像が上限以下の場合はアップスケールしない。
   *
   * @param buffer - 元画像のバイナリデータ
   * @param contentType - 画像のMIMEタイプ（jpeg/png/webpのいずれか）
   * @returns リサイズ後の画像バイナリデータ
   * @throws {ApiV1Error} 画像の加工に失敗した場合
   */
  public async resize(
    buffer: Buffer,
    contentType: AllowedPhotoContentType
  ): Promise<Buffer> {
    try {
      // rotate()を引数なしで呼ぶとEXIF Orientationを読み取り正しい向きへ回転補正し、
      // 処理後はOrientationタグ自体を除去する（後段の表示側で二重補正されるのを防ぐ）
      let pipeline = sharp(buffer)
        .rotate()
        .resize(IMAGE_RESIZE_MAX_DIMENSION_PX, IMAGE_RESIZE_MAX_DIMENSION_PX, {
          fit: 'inside',
          withoutEnlargement: true,
        })

      pipeline = this.applyFormat(pipeline, contentType)

      return await pipeline.toBuffer()
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiV1Error('INVALID_REQUEST', '画像の加工に失敗しました', {
          message: error.message,
        })
      }
      throw error
    }
  }

  /** contentTypeに応じた出力フォーマットの設定をパイプラインへ適用する */
  private applyFormat(
    pipeline: ReturnType<typeof sharp>,
    contentType: AllowedPhotoContentType
  ): ReturnType<typeof sharp> {
    switch (contentType) {
      case 'image/jpeg':
        return pipeline.jpeg({ quality: IMAGE_RESIZE_QUALITY })
      case 'image/webp':
        return pipeline.webp({ quality: IMAGE_RESIZE_QUALITY })
      case 'image/png':
        // 透過情報を維持する必要があるためJPEG変換はせず、PNGのままリサイズのみ行う
        return pipeline.png()
    }
  }
}
