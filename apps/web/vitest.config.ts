import path from 'path'
import dotenv from 'dotenv'
import { defineConfig } from 'vitest/config'

// .envファイルを読み込む
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '__tests__/',
        '**/*.spec.ts',
        '**/*.test.ts',
        '.next/',
      ],
    },
    include: ['__tests__/**/*.{test,spec}.ts'],
    exclude: ['node_modules', '.next'],
    // テストの逐次実行（DB操作が競合しないように）
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@repo/shared-types': path.resolve(
        __dirname,
        '../../packages/shared-types/src'
      ),
      '@repo/shared-utils': path.resolve(
        __dirname,
        '../../packages/shared-utils/src'
      ),
      '@repo/database': path.resolve(__dirname, '../../packages/database/src'),
      '@repo/firebase-auth-server': path.resolve(
        __dirname,
        '../../packages/firebase-auth-server/src'
      ),
    },
  },
})
