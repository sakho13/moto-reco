-- CreateTable
CREATE TABLE "TUserGoods" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "my_bike_id" TEXT,
    "goods_model_id" TEXT NOT NULL,
    "purchased_at" TIMESTAMPTZ,
    "price" INTEGER,
    "memo" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "TUserGoods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TUserGoods_user_id_purchased_at_idx" ON "TUserGoods"("user_id", "purchased_at" DESC);

-- CreateIndex
CREATE INDEX "TUserGoods_my_bike_id_idx" ON "TUserGoods"("my_bike_id");

-- CreateIndex
CREATE INDEX "TUserGoods_goods_model_id_idx" ON "TUserGoods"("goods_model_id");

-- AddForeignKey
ALTER TABLE "TUserGoods" ADD CONSTRAINT "TUserGoods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "MUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TUserGoods" ADD CONSTRAINT "TUserGoods_my_bike_id_fkey" FOREIGN KEY ("my_bike_id") REFERENCES "TUserMyBike"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TUserGoods" ADD CONSTRAINT "TUserGoods_goods_model_id_fkey" FOREIGN KEY ("goods_model_id") REFERENCES "MGoodsModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
