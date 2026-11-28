/**
 * MCPツールが返す `etcType`（ETC車載器の搭載状況）の説明
 *
 * @remarks
 * LLMがルートを検討するときに搭載状況を考慮できるよう、ツールの description に含める。
 * `null`（未設定）と `NONE`（未搭載）は意味が異なるため、両方を明記する。
 */
export const ETC_TYPE_DESCRIPTION =
  '値は NONE: 未搭載, ETC: ETC, ETC2: ETC2.0, null: 未設定 のいずれかです。' +
  '高速道路を使うルートを検討するときは、NONE ならスマートIC（ETC専用）を使えず料金所での現金・クレジットカード精算になること、' +
  'null なら搭載状況が不明であることを考慮してください。'
