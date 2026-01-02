#!/bin/bash

# 引数
ENVIRONMENT=$1

# 環境変数の読み込み
if [ "$ENVIRONMENT" == "production" ]; then
  pnpm turbo db:migrate

  exit 0
fi

pnpm turbo db:generate
pnpm turbo db:migrate
pnpm turbo db:seed

exit 0