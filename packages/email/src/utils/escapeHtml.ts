const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

/**
 * HTMLメール本文に埋め込む文字列をエスケープする
 *
 * @remarks
 * ユーザーが入力した値（表示名・メールアドレスなど）をテンプレートへ展開する際は必ず通すこと。
 * 属性値に埋め込む場合もダブルクォート・シングルクォートをエスケープするため安全に使える。
 */
export const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] ?? char)
