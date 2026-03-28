#!/bin/sh
# Cloud SQL Proxyをバックグラウンド起動
cloud_sql_proxy --port 5432 motoreco-8ce2a:asia-northeast1:motoreco-db &

# Proxyの起動を待機
sleep 2

# Next.jsアプリを起動
exec node apps/web/server.js
