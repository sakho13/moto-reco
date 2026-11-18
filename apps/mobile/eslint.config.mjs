import globals from 'globals'
import { config } from '@repo/eslint-config/react-internal'

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    ignores: ['.expo/**', 'dist/**', 'android/**', 'ios/**', 'expo-env.d.ts'],
  },
  {
    // React Native 本体は Flow で書かれていて import-x の解析（no-cycle 等）が読めないため、
    // 依存先として解析しない
    settings: {
      'import-x/ignore': ['node_modules/react-native/'],
    },
  },
  {
    // Expo（Metro）の設定ファイルは CommonJS で書く
    files: ['*.config.js'],
    languageOptions: { globals: globals.node, sourceType: 'commonjs' },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
]
