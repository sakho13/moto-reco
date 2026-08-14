-- AlterTable: TUserQuit の復帰方式をコード方式からトークンハッシュ方式へ変更し、
-- 完全物理削除バッチが参照する purge_at (退会30日後) を追加する。
ALTER TABLE "TUserQuit" ADD COLUMN "recovery_token_hash" TEXT;
ALTER TABLE "TUserQuit" ADD COLUMN "purge_at" TIMESTAMPTZ;

-- Backfill: 既存行は新しい復帰トークン方式では復帰不可になるため、
-- recovery_token_hash はダミー値（旧recovery_codeのSHA-256ハッシュ）で埋める。
-- purge_at は quit_at の30日後として算出する。
UPDATE "TUserQuit"
SET
  "recovery_token_hash" = encode(sha256(("id" || ':' || "recovery_code")::bytea), 'hex'),
  "purge_at" = "quit_at" + INTERVAL '30 days'
WHERE "recovery_token_hash" IS NULL;

ALTER TABLE "TUserQuit" ALTER COLUMN "recovery_token_hash" SET NOT NULL;
ALTER TABLE "TUserQuit" ALTER COLUMN "purge_at" SET NOT NULL;

ALTER TABLE "TUserQuit" DROP COLUMN "recovery_code";

-- DropIndex
DROP INDEX "TUserQuit_status_idx";

-- CreateIndex
CREATE INDEX "TUserQuit_status_purge_at_idx" ON "TUserQuit"("status", "purge_at");

-- CreateTable: 内部API（削除バッチ等）を保護するシステム共通APIキー
CREATE TABLE "MSystemApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "MSystemApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MSystemApiKey_key_hash_key" ON "MSystemApiKey"("key_hash");

-- CreateIndex
CREATE INDEX "MSystemApiKey_is_active_idx" ON "MSystemApiKey"("is_active");
