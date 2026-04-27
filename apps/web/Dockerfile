# ベースイメージ
FROM node:22-alpine AS base

# 依存関係インストール
FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# pnpm インストール
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# package.jsonとpnpm-workspace.yamlコピー
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/database/package.json ./packages/database/
COPY packages/firebase-auth-server/package.json ./packages/firebase-auth-server/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY packages/theme/package.json ./packages/theme/
COPY packages/ui/package.json ./packages/ui/

# 依存関係インストール
RUN pnpm install --frozen-lockfile

# ビルド時環境変数の定義
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
ARG MICRO_CMS_API_KEY
ARG MICRO_CMS_SERVICE_DOMAIN
ARG APP_VERSION

# ARGをENVに変換してNext.jsビルドで利用可能にする
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
ENV NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=$NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
ENV NEXT_PUBLIC_APP_VERSION=$APP_VERSION
ENV MICRO_CMS_API_KEY=$MICRO_CMS_API_KEY
ENV MICRO_CMS_SERVICE_DOMAIN=$MICRO_CMS_SERVICE_DOMAIN

ENV NODE_ENV=production

COPY . .

RUN npm install -g prisma

# Prisma生成
RUN pnpm turbo db:generate

# Next.jsビルド
RUN pnpm --filter @apps/web build

# 本番イメージ
FROM base AS runner
WORKDIR /app

# Cloud SQL Proxyのダウンロード
ADD https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 /usr/local/bin/cloud_sql_proxy
RUN chmod 755 /usr/local/bin/cloud_sql_proxy

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

ARG MICRO_CMS_API_KEY
ARG MICRO_CMS_SERVICE_DOMAIN
ENV MICRO_CMS_API_KEY=$MICRO_CMS_API_KEY
ENV MICRO_CMS_SERVICE_DOMAIN=$MICRO_CMS_SERVICE_DOMAIN

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 必要なファイルのみコピー
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# 起動スクリプトをコピー
COPY apps/web/start.sh /app/start.sh
RUN chmod 755 /app/start.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["/app/start.sh"]
