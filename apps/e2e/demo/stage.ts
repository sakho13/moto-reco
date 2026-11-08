import type { Locator, Page } from '@playwright/test'

/**
 * 録画に映したくない開発用の表示を隠す
 *
 * @remarks
 * dev サーバーに対して録画すると、Next.js の開発ツール（左下の「N」ボタン）が映るため。
 * ページを開く前に呼ぶ。
 */
export async function prepareStage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const style = document.createElement('style')
    style.textContent = 'nextjs-portal { display: none !important; }'
    document.addEventListener('DOMContentLoaded', () => {
      document.head.appendChild(style)
    })
  })
}

/** 見る人が画面を追えるように、操作の合間に間を置く */
export async function pause(page: Page, ms: number): Promise<void> {
  await page.waitForTimeout(ms)
}

/** ページを指定の位置まで、加減速をつけてスクロールする */
export async function smoothScrollTo(
  page: Page,
  top: number,
  durationMs: number
): Promise<void> {
  await page.evaluate(
    async ({ top, durationMs }) => {
      const from = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      const to = Math.max(0, Math.min(top, max))
      const startedAt = performance.now()
      await new Promise<void>((resolve) => {
        const step = (now: number) => {
          const t = Math.min(1, (now - startedAt) / durationMs)
          const eased = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2
          window.scrollTo({
            top: from + (to - from) * eased,
            behavior: 'instant',
          })
          if (t < 1) requestAnimationFrame(step)
          else resolve()
        }
        requestAnimationFrame(step)
      })
    },
    { top, durationMs }
  )
}

/** 要素が画面の縦の中央に来るまで、加減速をつけてスクロールする */
export async function smoothScrollToCenter(
  locator: Locator,
  durationMs: number
): Promise<void> {
  const top = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return window.scrollY + rect.top - (window.innerHeight - rect.height) / 2
  })
  await smoothScrollTo(locator.page(), top, durationMs)
}

/**
 * 給油シートのテンキーで文字を順に押す
 *
 * @param keypad - 「数値入力テンキー」のグループ
 */
export async function tapKeypad(
  keypad: Locator,
  text: string,
  intervalMs = 180
): Promise<void> {
  for (const char of text) {
    const name = char === '.' ? '小数点' : char
    await keypad.getByRole('button', { name, exact: true }).tap()
    await keypad.page().waitForTimeout(intervalMs)
  }
}
