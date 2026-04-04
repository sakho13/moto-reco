-- CreateTable
CREATE TABLE "TUserMyBikeTouringSpot" (
    "id" TEXT NOT NULL,
    "touring_id" TEXT NOT NULL,
    "name" TEXT,
    "memo" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "visited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TUserMyBikeTouringSpot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TUserMyBikeTouringSpot_touring_id_visited_at_idx" ON "TUserMyBikeTouringSpot"("touring_id", "visited_at");

-- AddForeignKey
ALTER TABLE "TUserMyBikeTouringSpot" ADD CONSTRAINT "TUserMyBikeTouringSpot_touring_id_fkey" FOREIGN KEY ("touring_id") REFERENCES "TUserMyBikeTouring"("id") ON DELETE CASCADE ON UPDATE CASCADE;
