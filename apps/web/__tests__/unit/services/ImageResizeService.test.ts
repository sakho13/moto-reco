import sharp from 'sharp'
import { describe, expect, test } from 'vitest'
import { ApiV1Error } from '@repo/shared-domain'
import {
  IMAGE_RESIZE_MAX_DIMENSION_PX,
  ImageResizeService,
} from '@/lib/api/server/services/ImageResizeService'

const createTestImage = async (params: {
  width: number
  height: number
  channels?: 3 | 4
  format?: 'jpeg' | 'png' | 'webp'
  orientation?: number
}): Promise<Buffer> => {
  const { width, height, channels = 3, format = 'jpeg', orientation } = params

  let image = sharp({
    create: {
      width,
      height,
      channels,
      background: { r: 255, g: 0, b: 0, alpha: channels === 4 ? 0.5 : 1 },
    },
  })

  if (orientation !== undefined) {
    image = image.withMetadata({ orientation })
  }

  switch (format) {
    case 'jpeg':
      return image.jpeg().toBuffer()
    case 'png':
      return image.png().toBuffer()
    case 'webp':
      return image.webp().toBuffer()
  }
}

describe('ImageResizeService', () => {
  const service = new ImageResizeService()

  describe('resize', () => {
    test('長辺が上限を超える画像は上限以下にリサイズされる', async () => {
      const input = await createTestImage({ width: 3000, height: 2000 })

      const result = await service.resize(input, 'image/jpeg')
      const metadata = await sharp(result).metadata()

      expect(metadata.width).toBeLessThanOrEqual(IMAGE_RESIZE_MAX_DIMENSION_PX)
      expect(metadata.height).toBeLessThanOrEqual(
        IMAGE_RESIZE_MAX_DIMENSION_PX
      )
      // アスペクト比 3000:2000 = 3:2 を維持したまま長辺が上限になる
      expect(metadata.width).toBe(IMAGE_RESIZE_MAX_DIMENSION_PX)
      expect(metadata.height).toBe(1280)
    })

    test('上限以下の画像はアップスケールされず元のサイズのまま返る', async () => {
      const input = await createTestImage({ width: 800, height: 600 })

      const result = await service.resize(input, 'image/jpeg')
      const metadata = await sharp(result).metadata()

      expect(metadata.width).toBe(800)
      expect(metadata.height).toBe(600)
    })

    test('EXIF Orientationが設定された画像は正しく回転補正される', async () => {
      // orientation: 6 は「時計回りに90度回転して表示する」向きを示す
      // 補正後は幅と高さが入れ替わる
      const input = await createTestImage({
        width: 800,
        height: 600,
        orientation: 6,
      })

      const beforeMetadata = await sharp(input).metadata()
      expect(beforeMetadata.orientation).toBe(6)

      const result = await service.resize(input, 'image/jpeg')
      const metadata = await sharp(result).metadata()

      expect(metadata.width).toBe(600)
      expect(metadata.height).toBe(800)
      // 回転補正後はOrientationタグが除去されている
      expect(metadata.orientation).toBeUndefined()
    })

    test('PNG画像は出力もPNG形式で透過情報が維持される', async () => {
      const input = await createTestImage({
        width: 3000,
        height: 2000,
        channels: 4,
        format: 'png',
      })

      const result = await service.resize(input, 'image/png')
      const metadata = await sharp(result).metadata()

      expect(metadata.format).toBe('png')
      expect(metadata.hasAlpha).toBe(true)
      expect(metadata.width).toBeLessThanOrEqual(IMAGE_RESIZE_MAX_DIMENSION_PX)
    })

    test('JPEG画像を渡すと出力もJPEG形式になる', async () => {
      const input = await createTestImage({ width: 800, height: 600 })

      const result = await service.resize(input, 'image/jpeg')
      const metadata = await sharp(result).metadata()

      expect(metadata.format).toBe('jpeg')
    })

    test('WebP画像を渡すと出力もWebP形式になる', async () => {
      const input = await createTestImage({
        width: 800,
        height: 600,
        format: 'webp',
      })

      const result = await service.resize(input, 'image/webp')
      const metadata = await sharp(result).metadata()

      expect(metadata.format).toBe('webp')
    })

    test('不正なバイナリを渡すとApiV1Errorが投げられる', async () => {
      const invalidBuffer = Buffer.from('not-an-image')

      await expect(
        service.resize(invalidBuffer, 'image/jpeg')
      ).rejects.toThrow(ApiV1Error)
    })
  })
})
