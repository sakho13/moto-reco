import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, test, vi } from 'vitest'
import { EmailService, EmailType } from '@repo/email'

const MALICIOUS_NAME = '<a href="https://evil.example">ログイン</a>&\'"'
const ESCAPED_NAME =
  '&lt;a href=&quot;https://evil.example&quot;&gt;ログイン&lt;/a&gt;&amp;&#39;&quot;'

const buildService = () => {
  const send = vi.fn().mockResolvedValue(undefined)
  return { service: new EmailService({ send }), send }
}

const sentHtml = (send: ReturnType<typeof vi.fn>): string =>
  (send.mock.calls[0]?.[0] as { html: string }).html

describe('メールテンプレートのHTMLエスケープ', () => {
  test('ウェルカムメールでユーザー名がエスケープされる', async () => {
    const { service, send } = buildService()

    await service.sendByType(EmailType.WELCOME, {
      to: 'user@example.com',
      userName: MALICIOUS_NAME,
    })

    const html = sentHtml(send)
    expect(html).toContain(ESCAPED_NAME)
    expect(html).not.toContain('<a href="https://evil.example">')
  })

  test('退会完了メールでユーザー名がエスケープされ、トークンはURLエンコードされる', async () => {
    const { service, send } = buildService()

    await service.sendByType(EmailType.USER_QUIT, {
      to: 'user@example.com',
      userName: MALICIOUS_NAME,
      recoveryToken: 'abc"><script>',
    })

    const html = sentHtml(send)
    expect(html).toContain(ESCAPED_NAME)
    expect(html).not.toContain('<script>')
    expect(html).toContain('token=abc%22%3E%3Cscript%3E')
  })

  test('通知メールアドレス確認メールは確認リンクのみを含み、トークンはURLエンコードされる', async () => {
    const { service, send } = buildService()

    await service.sendByType(EmailType.NOTIFICATION_EMAIL_VERIFICATION, {
      to: 'new@example.com',
      token: 'abc"><script>',
    })

    const html = sentHtml(send)
    expect(html).not.toContain('<script>')
    expect(html).toContain(
      'https://moto-reco.com/app/verify-notification-email?token=abc%22%3E%3Cscript%3E'
    )
  })

  test('全メールが共通レイアウト（プレヘッダー・送信専用の案内）で組み立てられる', async () => {
    const { service, send } = buildService()

    await service.sendByType(EmailType.WELCOME, {
      to: 'user@example.com',
      userName: 'テスト',
    })
    await service.sendByType(EmailType.NOTIFICATION_EMAIL_VERIFICATION, {
      to: 'user@example.com',
      token: 'token',
    })
    await service.sendByType(EmailType.USER_QUIT, {
      to: 'user@example.com',
      userName: 'テスト',
      recoveryToken: 'token',
    })

    for (const [message] of send.mock.calls as [{ html: string }][]) {
      expect(message.html).toMatch(/^<!doctype html>/)
      expect(message.html).toContain(
        '<meta name="color-scheme" content="light only">'
      )
      expect(message.html).toContain(
        'このメールは送信専用アドレスからお送りしています'
      )
    }
  })

  test('ヘッダーのロゴ画像はWebアプリのpublic配下に実在するファイルを参照する', async () => {
    const { service, send } = buildService()

    await service.sendByType(EmailType.WELCOME, {
      to: 'user@example.com',
      userName: 'テスト',
    })

    const html = sentHtml(send)
    const src = html.match(/<img src="https:\/\/moto-reco\.com(\/[^"]+)"/)?.[1]
    expect(src).toBeDefined()
    // public/ 配下以外（app/ のアイコン等）は命名規約次第で配信されないため、実ファイルの存在で確認する
    expect(
      existsSync(path.resolve(__dirname, '../../../public', `.${src}`))
    ).toBe(true)
  })
})
