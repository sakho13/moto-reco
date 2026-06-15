-- AlterTable: TUserMyBikeTouringSpot
-- スポットをスキップしたか記録するフラグを追加
ALTER TABLE "TUserMyBikeTouringSpot" ADD COLUMN "is_skipped" BOOLEAN NOT NULL DEFAULT false;
