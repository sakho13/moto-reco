import path from 'path'
import dotenv from 'dotenv'
import { defineConfig } from 'vitest/config'

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.{test,spec}.ts'],
    exclude: ['node_modules', '.next'],
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
