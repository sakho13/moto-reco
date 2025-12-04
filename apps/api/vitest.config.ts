import path from 'path'
import dotenv from 'dotenv'
import { defineConfig } from 'vitest/config'

// .envファイルを読み込む
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.spec.ts',
        '**/*.test.ts',
        'dist/',
      ],
    },
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist'],
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
      '@shared-types': path.resolve(
        __dirname,
        '../../packages/shared-types/src'
      ),
    },
  },
})
