-- AlterTable
ALTER TABLE "MUser" ADD COLUMN     "is_profile_public" BOOLEAN NOT NULL DEFAULT true;

-- ゲストアカウントのプロフィール公開設定をFALSEにバックフィル
UPDATE "MUser" SET "is_profile_public" = false WHERE role = 'GUEST';
