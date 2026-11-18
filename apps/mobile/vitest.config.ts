import path from 'path'
import { defineConfig } from 'vitest/config'

/**
 * Vitest の設定
 *
 * @remarks
 * React Native に依存しない純粋関数（`src/**\/*.test.ts`）だけをテストする。
 * 画面の動作は Expo Go / シミュレーターで確認する。
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
