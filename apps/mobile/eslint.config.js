import tseslint from 'typescript-eslint'

export default tseslint.config({
  ignores: ['**/node_modules/**', 'node_modules/**', 'metro.config.js', '.expo/**'],
  files: ['**/*.ts', '**/*.tsx'],
  extends: [tseslint.configs.recommended],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
  },
})
