import { escapeHtml } from '../../utils/escapeHtml'

/** メール本文のリンク先に使う本番URL */
export const APP_BASE_URL = 'https://moto-reco.com'

/**
 * メールの配色・書体
 *
 * @remarks
 * アプリのライトテーマ（packages/theme）に合わせる。
 * メールクライアントは CSS 変数を解釈しないため値を直接持つ。
 */
const EMAIL_THEME = {
  paper: '#F4EDDF',
  card: '#FFFBF3',
  line: '#D6C9AC',
  brand: '#9B2226',
  brandInk: '#FFF3E2',
  amber: '#C08A2E',
  amberSoft: '#FBF1DC',
  ink: '#241D16',
  inkLight: '#6E6152',
  display:
    "'Hiragino Mincho ProN','Hiragino Mincho Pro','Yu Mincho',YuMincho,'Noto Serif JP',serif",
  body: "'Hiragino Sans','Hiragino Kaku Gothic ProN','Yu Gothic',YuGothic,'Noto Sans JP',Meiryo,sans-serif",
} as const

type EmailAction = {
  /** ボタンの文言 */
  label: string
  /** 遷移先URL（埋め込み時にエスケープする） */
  url: string
}

type EmailLayoutParams = {
  /** 受信一覧で件名の横に表示される要約（プレーンテキスト） */
  preheader: string
  /** 本文の見出し（プレーンテキスト） */
  heading: string
  /**
   * 本文のHTML
   *
   * @remarks
   * ユーザー入力値を含める場合は呼び出し側で必ず escapeHtml を通すこと。
   * 段落は emailParagraph などのヘルパーで組み立てる。
   */
  bodyHtml: string
  /** 主要な操作ボタン */
  action?: EmailAction
  /** ボタン下の補足（心当たりがない場合の案内など。プレーンテキスト） */
  footnote?: string
}

/**
 * 本文の段落を返す
 *
 * @param html - 段落の中身（ユーザー入力値はエスケープ済みであること）
 */
export const emailParagraph = (html: string): string =>
  `<p style="margin:0 0 16px;font-family:${EMAIL_THEME.body};font-size:15px;line-height:1.8;color:${EMAIL_THEME.ink};">${html}</p>`

/**
 * 注意書きの囲みを返す（期限など読み飛ばされたくない情報に使う）
 *
 * @param title - 見出し（プレーンテキスト）
 * @param text - 本文（プレーンテキスト）
 */
export const emailCallout = (title: string, text: string): string => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;border-collapse:separate;">
  <tr>
    <td style="background:${EMAIL_THEME.amberSoft};border-left:4px solid ${EMAIL_THEME.amber};border-radius:3px;padding:14px 16px;">
      <p style="margin:0 0 4px;font-family:${EMAIL_THEME.body};font-size:13px;font-weight:700;color:${EMAIL_THEME.ink};">${escapeHtml(title)}</p>
      <p style="margin:0;font-family:${EMAIL_THEME.body};font-size:13px;line-height:1.7;color:${EMAIL_THEME.ink};">${escapeHtml(text)}</p>
    </td>
  </tr>
</table>`

/**
 * 番号付きの項目一覧を返す（できることの紹介など）
 *
 * @param items - 見出しと説明（プレーンテキスト）
 */
export const emailNumberedList = (
  items: readonly { title: string; description: string }[]
): string => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 24px;">
  ${items
    .map(
      (item, index) => `
  <tr>
    <td width="44" valign="top" style="padding:12px 0;border-top:1px solid ${EMAIL_THEME.line};font-family:${EMAIL_THEME.display};font-size:20px;font-weight:700;color:${EMAIL_THEME.brand};">${String(index + 1).padStart(2, '0')}</td>
    <td valign="top" style="padding:12px 0;border-top:1px solid ${EMAIL_THEME.line};">
      <p style="margin:0 0 2px;font-family:${EMAIL_THEME.body};font-size:15px;font-weight:700;color:${EMAIL_THEME.ink};">${escapeHtml(item.title)}</p>
      <p style="margin:0;font-family:${EMAIL_THEME.body};font-size:13px;line-height:1.7;color:${EMAIL_THEME.inkLight};">${escapeHtml(item.description)}</p>
    </td>
  </tr>`
    )
    .join('')}
</table>`

const renderAction = (action: EmailAction): string => {
  const url = escapeHtml(action.url)
  return `
<table class="mr-action" role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 12px;">
  <tr>
    <td align="center" bgcolor="${EMAIL_THEME.brand}" style="border-radius:7px;background:${EMAIL_THEME.brand};">
      <a href="${url}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:${EMAIL_THEME.body};font-size:15px;font-weight:700;letter-spacing:0.04em;color:${EMAIL_THEME.brandInk};text-decoration:none;border-radius:7px;">${escapeHtml(action.label)}</a>
    </td>
  </tr>
</table>
<p style="margin:0 0 8px;font-family:${EMAIL_THEME.body};font-size:12px;line-height:1.7;color:${EMAIL_THEME.inkLight};">ボタンが押せない場合は、次のURLをブラウザに貼り付けてください。<br><a href="${url}" target="_blank" style="color:${EMAIL_THEME.brand};word-break:break-all;">${url}</a></p>`
}

/**
 * 配信メール共通のレイアウトでHTMLを組み立てる
 *
 * @remarks
 * 多くのメールクライアントで崩れないよう、table レイアウトとインラインスタイルで組む。
 * 文字列の引数（heading / preheader / footnote / action）はここでエスケープする。
 */
export const renderEmailLayout = (params: EmailLayoutParams): string => {
  const t = EMAIL_THEME
  const year = new Date().getFullYear()

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${escapeHtml(params.heading)}</title>
<style>
  @media only screen and (max-width: 480px) {
    .mr-content { padding: 26px 20px 22px !important; }
    .mr-action, .mr-action tbody, .mr-action tr, .mr-action td, .mr-action a { display: block !important; width: 100% !important; box-sizing: border-box; text-align: center; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${t.paper};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${escapeHtml(params.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${t.paper}" style="background:${t.paper};">
  <tr>
    <td align="center" style="padding:32px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
        <tr>
          <td style="padding:0 4px 16px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle" style="padding-right:10px;"><img src="${APP_BASE_URL}/apple-touch-icon.png" width="32" height="32" alt="" style="display:block;border:0;border-radius:8px;"></td>
                <td valign="middle" style="font-family:${t.display};font-size:22px;font-weight:700;letter-spacing:0.02em;color:${t.ink};">MotoReco</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:${t.card};border:1px solid ${t.line};border-radius:14px;overflow:hidden;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td height="6" style="height:6px;line-height:6px;font-size:0;background:${t.brand};">&nbsp;</td></tr>
              <tr><td height="2" style="height:2px;line-height:2px;font-size:0;background:${t.amber};">&nbsp;</td></tr>
              <tr>
                <td class="mr-content" style="padding:32px 32px 28px;">
                  <h1 style="margin:0 0 20px;font-family:${t.display};font-size:22px;line-height:1.5;font-weight:700;color:${t.ink};">${escapeHtml(params.heading)}</h1>
                  ${params.bodyHtml}
                  ${params.action ? renderAction(params.action) : ''}
                  ${params.footnote ? `<p style="margin:20px 0 0;padding-top:16px;border-top:1px dashed ${t.line};font-family:${t.body};font-size:12px;line-height:1.7;color:${t.inkLight};">${escapeHtml(params.footnote)}</p>` : ''}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 8px 0;font-family:${t.body};font-size:11px;line-height:1.8;color:${t.inkLight};text-align:center;">
            このメールは送信専用アドレスからお送りしています。ご返信いただいてもお答えできません。<br>
            <a href="${APP_BASE_URL}" target="_blank" style="color:${t.inkLight};">moto-reco.com</a> ・ バイクのメンテナンスを、スマートに管理する<br>
            &copy; ${year} MotoReco
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}
