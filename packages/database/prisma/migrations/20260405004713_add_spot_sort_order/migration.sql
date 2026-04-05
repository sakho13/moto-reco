-- DropIndex
DROP INDEX "TUserMyBikeTouringSpot_touring_id_visited_at_idx";

-- AlterTable
ALTER TABLE "TUserMyBikeTouringSpot" ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "TUserMyBikeTouringSpot_touring_id_sort_order_idx" ON "TUserMyBikeTouringSpot"("touring_id", "sort_order");

-- 既存スポットの sort_order を visited_at 順で採番する
UPDATE "TUserMyBikeTouringSpot"
SET "sort_order" = sub.row_num - 1
FROM (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY touring_id ORDER BY visited_at ASC) AS row_num
  FROM "TUserMyBikeTouringSpot"
) sub
WHERE "TUserMyBikeTouringSpot".id = sub.id;
