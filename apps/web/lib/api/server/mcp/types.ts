import type { UserEntity } from '@repo/shared-domain'
import type { UserId } from '@repo/shared-types'

/**
 * MCPツール登録関数(`registerXxxTools`)に共通で渡すコンテキスト
 *
 * @remarks
 * `userEntity` はプラン別の件数制限（`userEntity.limits`）を参照する
 * ツール（例: `create_touring_plan`）のために保持する。
 */
export type McpToolContext = {
  userId: UserId
  userEntity: UserEntity
}
