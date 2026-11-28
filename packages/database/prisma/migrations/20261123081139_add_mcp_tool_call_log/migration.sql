-- CreateTable
CREATE TABLE "TMcpToolCallLog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "client_id" TEXT,
    "tool_name" TEXT NOT NULL,
    "is_error" BOOLEAN NOT NULL DEFAULT false,
    "duration_ms" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TMcpToolCallLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TMcpToolCallLog_created_at_idx" ON "TMcpToolCallLog"("created_at");

-- CreateIndex
CREATE INDEX "TMcpToolCallLog_user_id_created_at_idx" ON "TMcpToolCallLog"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "TMcpToolCallLog_client_id_idx" ON "TMcpToolCallLog"("client_id");

-- AddForeignKey
ALTER TABLE "TMcpToolCallLog" ADD CONSTRAINT "TMcpToolCallLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "MUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TMcpToolCallLog" ADD CONSTRAINT "TMcpToolCallLog_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "MOAuthClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

