#!/bin/sh
# Cloud SQL Proxyをバックグラウンド起動
cloud_sql_proxy -instances=motoreco-8ce2a:asia-northeast1:motoreco-db=tcp:5432 &

# Proxyの起動を待機
sleep 3

# Next.jsアプリを起動
exec node apps/admin/server.js
