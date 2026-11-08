import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Page, TestInfo } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** 動画と静止画の書き出し先 */
export const LP_VIDEO_DIR = path.resolve(
  __dirname,
  '../../web/public/videos/lp'
)

/** タップした位置に出す目印。点を中心にした半透明の円 */
const TAP_MARKER_STYLE = [
  'width: 46px',
  'height: 46px',
  'transform: translate(-50%, -50%)',
  'border-radius: 50%',
  'background: rgba(36, 29, 22, 0.18)',
  'border: 2px solid rgba(255, 255, 255, 0.9)',
  'box-shadow: 0 0 0 2px rgba(36, 29, 22, 0.35)',
].join(';')

type SceneControls = {
  /** 今の画面を、再生前と動きを減らす設定のときに見せる静止画として保存する */
  capturePoster: () => Promise<void>
}

const PLAYWRIGHT_FFMPEG_EXECUTABLE: Partial<Record<NodeJS.Platform, string>> = {
  linux: 'ffmpeg-linux',
  darwin: 'ffmpeg-mac',
  win32: 'ffmpeg-win64.exe',
}

const getPlaywrightCacheDir = (): string => {
  const fromEnv = process.env['PLAYWRIGHT_BROWSERS_PATH']
  if (fromEnv) return fromEnv
  switch (process.platform) {
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright')
    case 'win32':
      return path.join(
        process.env['LOCALAPPDATA'] ??
          path.join(os.homedir(), 'AppData', 'Local'),
        'ms-playwright'
      )
    default:
      return path.join(
        process.env['XDG_CACHE_HOME'] ?? path.join(os.homedir(), '.cache'),
        'ms-playwright'
      )
  }
}

/**
 * 動画の圧縮に使う ffmpeg を探す
 *
 * @remarks
 * `FFMPEG_PATH` があればそれを使う。なければ Playwright が録画用に入れる ffmpeg
 * （`pnpm exec playwright install ffmpeg`）のうち、最も新しい版を使う。
 */
const findFfmpeg = (): string => {
  const fromEnv = process.env['FFMPEG_PATH']
  if (fromEnv) return fromEnv

  const executable = PLAYWRIGHT_FFMPEG_EXECUTABLE[process.platform]
  const cacheDir = getPlaywrightCacheDir()
  if (executable && existsSync(cacheDir)) {
    const candidates = readdirSync(cacheDir)
      .filter((name) => /^ffmpeg-\d+$/.test(name))
      .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]))
      .map((name) => path.join(cacheDir, name, executable))
      .filter((candidate) => existsSync(candidate))
    if (candidates[0]) return candidates[0]
  }

  throw new Error(
    'ffmpeg が見つかりません。`pnpm exec playwright install ffmpeg` を実行するか、FFMPEG_PATH を指定してください'
  )
}

/** 録画した動画を、LP に載せる大きさと画質の WebM（VP9）にする */
const compressVideo = (input: string, output: string): void => {
  execFileSync(
    findFfmpeg(),
    [
      ['-y', '-loglevel', 'error'],
      ['-i', input],
      ['-vf', 'format=yuv420p'],
      ['-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', '0'],
      ['-deadline', 'good', '-cpu-used', '2', '-row-mt', '1'],
      ['-an', output],
    ].flat(),
    { stdio: 'inherit' }
  )
}

/**
 * 場面の操作を録画し、`{name}.webm` と `{name}.jpg` を書き出す
 *
 * @remarks
 * 動画と静止画は viewport と同じ大きさ（CSSピクセル）で書き出す。
 * データの準備や画面の読み込みは呼び出す前に済ませ、`scene` には見せたい操作だけを書く。
 */
export async function recordScene(
  page: Page,
  testInfo: TestInfo,
  name: string,
  scene: (controls: SceneControls) => Promise<void>
): Promise<void> {
  const viewport = page.viewportSize()
  if (!viewport) throw new Error('viewport が設定されていません')
  const rawPath = testInfo.outputPath(`${name}.raw.webm`)
  const posterPath = path.join(LP_VIDEO_DIR, `${name}.jpg`)
  mkdirSync(LP_VIDEO_DIR, { recursive: true })

  await page.screencast.start({
    path: rawPath,
    size: viewport,
    fps: 30,
    quality: 90,
  })
  const actions = await page.screencast.showActions({
    cursor: 'none',
    duration: 450,
    style: { point: TAP_MARKER_STYLE, title: 'display: none' },
  })
  try {
    await scene({
      capturePoster: async () => {
        await page.screenshot({
          path: posterPath,
          type: 'jpeg',
          quality: 85,
          scale: 'css',
        })
      },
    })
  } finally {
    await actions.dispose()
    await page.screencast.stop()
  }

  compressVideo(rawPath, path.join(LP_VIDEO_DIR, `${name}.webm`))
}
