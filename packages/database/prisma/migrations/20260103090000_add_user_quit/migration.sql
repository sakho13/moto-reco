-- CreateEnum
CREATE TYPE "UserQuitStatus" AS ENUM ('QUIT', 'RECOVERED');

-- CreateTable
CREATE TABLE "TUserQuit" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "quit_at" TIMESTAMP(3) NOT NULL,
    "quit_reason" TEXT NOT NULL,
    "recovery_code" TEXT NOT NULL,
    "status" "UserQuitStatus" NOT NULL DEFAULT 'QUIT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TUserQuit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TUserQuit_user_id_key" ON "TUserQuit"("user_id");

-- CreateIndex
CREATE INDEX "TUserQuit_status_idx" ON "TUserQuit"("status");

-- AddForeignKey
ALTER TABLE "TUserQuit" ADD CONSTRAINT "TUserQuit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "MUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
