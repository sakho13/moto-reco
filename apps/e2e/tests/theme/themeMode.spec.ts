import { expect, test } from '@playwright/test'
import { AboutPage } from '../../pages/aboutPage'

/**
 * テーマモード切り替え E2E テスト
 */
test.describe('テーマモード', () => {
  test.use({ colorScheme: 'light' })

  test('ダークモードに切り替えた設定が再読み込み後も保持される', async ({
    page,
  }) => {
    const aboutPage = new AboutPage(page)
    await aboutPage.goto()

    await expect(page.locator('html')).toHaveAttribute(
      'data-theme-mode',
      'light'
    )
    await aboutPage.themeToggleButton.click()
    await expect(page.locator('html')).toHaveAttribute(
      'data-theme-mode',
      'dark'
    )

    await page.reload()

    await expect(page.locator('html')).toHaveAttribute(
      'data-theme-mode',
      'dark'
    )
    await expect(aboutPage.themeToggleButton).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  test('ライトモードに戻した設定が再読み込み後も保持される', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      if (!window.sessionStorage.getItem('theme-initialized')) {
        window.localStorage.setItem('theme-mode', 'dark')
        window.sessionStorage.setItem('theme-initialized', 'true')
      }
    })
    const aboutPage = new AboutPage(page)
    await aboutPage.goto()

    await expect(page.locator('html')).toHaveAttribute(
      'data-theme-mode',
      'dark'
    )
    await aboutPage.themeToggleButton.click()
    await expect(page.locator('html')).toHaveAttribute(
      'data-theme-mode',
      'light'
    )

    await page.reload()

    await expect(page.locator('html')).toHaveAttribute(
      'data-theme-mode',
      'light'
    )
  })
})
