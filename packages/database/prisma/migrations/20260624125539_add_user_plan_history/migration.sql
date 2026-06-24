-- CreateEnum
CREATE TYPE "MUserPlan" AS ENUM ('FREE', 'PREMIUM');

-- CreateTable
CREATE TABLE "TUserPlanHistory" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan" "MUserPlan" NOT NULL,
    "changed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_by_id" TEXT NOT NULL,
    "reason" TEXT,

    CONSTRAINT "TUserPlanHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TUserPlanHistory_user_id_changed_at_idx" ON "TUserPlanHistory"("user_id", "changed_at" DESC);

-- AddForeignKey
ALTER TABLE "TUserPlanHistory" ADD CONSTRAINT "TUserPlanHistory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "MUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TUserPlanHistory" ADD CONSTRAINT "TUserPlanHistory_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "MUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
