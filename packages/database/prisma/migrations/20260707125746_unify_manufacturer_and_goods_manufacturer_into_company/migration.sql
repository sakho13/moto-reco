-- MManufacturer と MGoodsManufacturer を MCompany に統合
-- 既存データを保持したまま、テーブルリネーム + カラム追加 + データ移行を行う

-- =========================================================================
-- 1. CompanyCategory enum を作成
-- =========================================================================
CREATE TYPE "CompanyCategory" AS ENUM ('BIKE_MAKER', 'GOODS_MANUFACTURER');

-- =========================================================================
-- 2. MManufacturer を MCompany にリネームし、categories カラムを追加
--    (既存行は全てバイクメーカーなので一時デフォルトで ['BIKE_MAKER'] を設定)
-- =========================================================================
ALTER TABLE "MManufacturer" RENAME TO "MCompany";

ALTER TABLE "MCompany" ADD COLUMN "categories" "CompanyCategory"[] NOT NULL DEFAULT ARRAY['BIKE_MAKER']::"CompanyCategory"[];

ALTER TABLE "MCompany" ALTER COLUMN "categories" DROP DEFAULT;

-- =========================================================================
-- 3. 制約・インデックス名を MCompany 用にリネーム（fresh generateとの差分を防止）
-- =========================================================================
ALTER TABLE "MCompany" RENAME CONSTRAINT "MManufacturer_pkey" TO "MCompany_pkey";
ALTER INDEX "MManufacturer_name_key" RENAME TO "MCompany_name_key";

-- =========================================================================
-- 4. MGoodsManufacturer のデータを MCompany へ移行
--    (id/timestampsを保持。name衝突時は categories をマージ)
-- =========================================================================
INSERT INTO "MCompany" ("id", "name", "name_en", "logo_url", "website_url", "country", "categories", "is_active", "created_at", "updated_at")
SELECT
  "id",
  "name",
  "name_en",
  "logo_url",
  "website_url",
  NULL,
  ARRAY['GOODS_MANUFACTURER']::"CompanyCategory"[],
  "is_active",
  "created_at",
  "updated_at"
FROM "MGoodsManufacturer"
ON CONFLICT ("name") DO UPDATE
  SET "categories" = "MCompany"."categories" || EXCLUDED."categories";

-- =========================================================================
-- 5. MGoodsModel.goods_manufacturer_id を MCompany 側の id に付け替え
--    (name衝突でMGoodsManufacturer行がMCompanyにInsertされず既存行にマージされた
--     ケースに対応するため、name経由で正しいCompany.idへ再マッピングする)
-- =========================================================================
UPDATE "MGoodsModel" gm
SET "goods_manufacturer_id" = c."id"
FROM "MGoodsManufacturer" old_gm
JOIN "MCompany" c ON c."name" = old_gm."name"
WHERE gm."goods_manufacturer_id" = old_gm."id"
  AND gm."goods_manufacturer_id" != c."id";

-- =========================================================================
-- 6. MGoodsModel の FK を MGoodsManufacturer → MCompany に張り替え
-- =========================================================================
ALTER TABLE "MGoodsModel" DROP CONSTRAINT "MGoodsModel_goods_manufacturer_id_fkey";

ALTER TABLE "MGoodsModel"
  ADD CONSTRAINT "MGoodsModel_goods_manufacturer_id_fkey"
  FOREIGN KEY ("goods_manufacturer_id") REFERENCES "MCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- =========================================================================
-- 7. 旧 MGoodsManufacturer テーブルを削除
-- =========================================================================
DROP TABLE "MGoodsManufacturer";

-- =========================================================================
-- 8. MBike の FK ("MBike_manufacturer_id_fkey") はカラム名由来の命名であり、
--    RENAME TO の影響を受けない（PostgresのFKはOIDベースで対象テーブルを
--    参照し続けるため、参照先テーブル名の変更のみでは張り替え不要）
-- =========================================================================
