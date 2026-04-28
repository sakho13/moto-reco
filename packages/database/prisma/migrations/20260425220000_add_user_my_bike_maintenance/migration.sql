CREATE TABLE "TUserMyBikeMaintenance" (
    "id" TEXT NOT NULL,
    "my_bike_id" TEXT NOT NULL,
    "performed_at" TIMESTAMP(3) NOT NULL,
    "mileage" INTEGER NOT NULL,
    "memo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TUserMyBikeMaintenance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TUserMyBikeMaintenanceItem" (
    "id" TEXT NOT NULL,
    "maintenance_id" TEXT NOT NULL,
    "maintenance_type" "MaintenanceType" NOT NULL,
    "value" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TUserMyBikeMaintenanceItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TUserMyBikeMaintenance_my_bike_id_performed_at_idx" ON "TUserMyBikeMaintenance"("my_bike_id", "performed_at");

CREATE INDEX "TUserMyBikeMaintenanceItem_maintenance_id_idx" ON "TUserMyBikeMaintenanceItem"("maintenance_id");

CREATE UNIQUE INDEX "TUserMyBikeMaintenanceItem_maintenance_id_maintenance_type_key" ON "TUserMyBikeMaintenanceItem"("maintenance_id", "maintenance_type");

ALTER TABLE "TUserMyBikeMaintenance" ADD CONSTRAINT "TUserMyBikeMaintenance_my_bike_id_fkey" FOREIGN KEY ("my_bike_id") REFERENCES "TUserMyBike"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TUserMyBikeMaintenanceItem" ADD CONSTRAINT "TUserMyBikeMaintenanceItem_maintenance_id_fkey" FOREIGN KEY ("maintenance_id") REFERENCES "TUserMyBikeMaintenance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
