import { config } from '@repo/eslint-config/base'

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    rules: {
      // Playwright の test/expect はグローバルとして利用
      'no-undef': 'off',
    },
  },
]
