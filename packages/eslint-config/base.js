import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import turboPlugin from 'eslint-plugin-turbo'
import tseslint from 'typescript-eslint'
import onlyWarn from 'eslint-plugin-only-warn'
import pluginImportX from 'eslint-plugin-import-x'

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      'turbo/no-undeclared-env-vars': 'warn',
      semi: ['error', 'never'],
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    plugins: {
      'import-x': pluginImportX,
    },
    rules: {
      'import-x/no-duplicates': 'error',
      'import-x/no-cycle': 'warn',
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
          ],
          pathGroups: [
            {
              pattern: '@repo/**',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '@packages/**',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '@shared-types/**',
              group: 'internal',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          'newlines-between': 'never',
        },
      ],
    },
  },
  {
    ignores: ['dist/**'],
  },
]
