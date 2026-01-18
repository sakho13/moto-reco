CREATE TABLE "TUserMyBikeTouring" (
    "id" TEXT NOT NULL,
    "my_bike_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "start_mileage" INTEGER,
    "end_mileage" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TUserMyBikeTouring_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TUserMyBikeTouring_my_bike_id_start_date_idx" ON "TUserMyBikeTouring"("my_bike_id", "start_date");

ALTER TABLE "TUserMyBikeTouring" ADD CONSTRAINT "TUserMyBikeTouring_my_bike_id_fkey" FOREIGN KEY ("my_bike_id") REFERENCES "TUserMyBike"("id") ON DELETE CASCADE ON UPDATE CASCADE;
