-- CreateEnum
CREATE TYPE "GoodsCategory" AS ENUM ('HELMET', 'GLOVE', 'JACKET', 'PANTS', 'BOOTS', 'RAINWEAR', 'INTERCOM', 'DRIVE_RECORDER', 'NAVIGATION', 'BOX_CASE', 'BAG', 'CHAIN_LOCK', 'COVER', 'TOOL', 'OTHER');

-- CreateTable
CREATE TABLE "MGoodsManufacturer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT,
    "logo_url" TEXT,
    "website_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "MGoodsManufacturer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MGoodsModel" (
    "id" TEXT NOT NULL,
    "goods_manufacturer_id" TEXT NOT NULL,
    "model_number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "GoodsCategory" NOT NULL,
    "amazon_asin" TEXT,
    "rakuten_item_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "MGoodsModel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MGoodsManufacturer_name_key" ON "MGoodsManufacturer"("name");

-- CreateIndex
CREATE INDEX "MGoodsModel_category_idx" ON "MGoodsModel"("category");

-- CreateIndex
CREATE UNIQUE INDEX "MGoodsModel_goods_manufacturer_id_model_number_key" ON "MGoodsModel"("goods_manufacturer_id", "model_number");

-- AddForeignKey
ALTER TABLE "MGoodsModel" ADD CONSTRAINT "MGoodsModel_goods_manufacturer_id_fkey" FOREIGN KEY ("goods_manufacturer_id") REFERENCES "MGoodsManufacturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
