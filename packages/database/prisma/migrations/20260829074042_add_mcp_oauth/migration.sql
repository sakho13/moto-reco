-- CreateEnum
CREATE TYPE "OAuthTokenEndpointAuthMethod" AS ENUM ('NONE', 'CLIENT_SECRET_BASIC');

-- CreateTable
CREATE TABLE "MOAuthClient" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "client_secret_hash" TEXT,
    "client_name" TEXT NOT NULL,
    "redirect_uris" TEXT[],
    "token_endpoint_auth_method" "OAuthTokenEndpointAuthMethod" NOT NULL DEFAULT 'NONE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "MOAuthClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TOAuthAuthorizationCode" (
    "id" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "redirect_uri" TEXT NOT NULL,
    "code_challenge" TEXT NOT NULL,
    "code_challenge_method" TEXT NOT NULL DEFAULT 'S256',
    "scopes" "MApiKeyScope"[] DEFAULT ARRAY['READ']::"MApiKeyScope"[],
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TOAuthAuthorizationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TOAuthToken" (
    "id" TEXT NOT NULL,
    "access_token_hash" TEXT NOT NULL,
    "refresh_token_hash" TEXT,
    "client_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "scopes" "MApiKeyScope"[] DEFAULT ARRAY['READ']::"MApiKeyScope"[],
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "access_token_expires_at" TIMESTAMPTZ NOT NULL,
    "refresh_token_expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "TOAuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MOAuthClient_client_id_key" ON "MOAuthClient"("client_id");

-- CreateIndex
CREATE INDEX "MOAuthClient_client_id_idx" ON "MOAuthClient"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "TOAuthAuthorizationCode_code_hash_key" ON "TOAuthAuthorizationCode"("code_hash");

-- CreateIndex
CREATE INDEX "TOAuthAuthorizationCode_client_id_idx" ON "TOAuthAuthorizationCode"("client_id");

-- CreateIndex
CREATE INDEX "TOAuthAuthorizationCode_user_id_idx" ON "TOAuthAuthorizationCode"("user_id");

-- CreateIndex
CREATE INDEX "TOAuthAuthorizationCode_expires_at_idx" ON "TOAuthAuthorizationCode"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "TOAuthToken_access_token_hash_key" ON "TOAuthToken"("access_token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "TOAuthToken_refresh_token_hash_key" ON "TOAuthToken"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "TOAuthToken_client_id_idx" ON "TOAuthToken"("client_id");

-- CreateIndex
CREATE INDEX "TOAuthToken_user_id_revoked_idx" ON "TOAuthToken"("user_id", "revoked");

-- AddForeignKey
ALTER TABLE "TOAuthAuthorizationCode" ADD CONSTRAINT "TOAuthAuthorizationCode_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "MOAuthClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TOAuthAuthorizationCode" ADD CONSTRAINT "TOAuthAuthorizationCode_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "MUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TOAuthToken" ADD CONSTRAINT "TOAuthToken_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "MOAuthClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TOAuthToken" ADD CONSTRAINT "TOAuthToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "MUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
