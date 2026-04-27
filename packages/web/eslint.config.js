import globals from 'globals'
import js from '@eslint/js'
import ts from 'typescript-eslint'

export default [
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: globals.browser,
    },
    extends: [js.configs.recommended, ...ts.configs.recommended],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
]
