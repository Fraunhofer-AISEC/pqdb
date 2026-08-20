import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default [
  {
    ignores: ['build/**', 'node_modules/**'],
  },
  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  importPlugin.flatConfigs.recommended,
  jsxA11y.flatConfigs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx'],
        },
      },
    },
    rules: {
      'import/no-unresolved': ['error', { ignore: ['^csv-stringify/'] }],
    },
  },
  {
    // Keep the project's import-sorting rule scoped to application code in
    // src/, not to tooling/config files. simple-import-sort provides reliable
    // autofix via `eslint --fix`.
    files: ['src/**/*.{js,jsx}'],
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
  {
    files: ['vite.config.mjs'],
    rules: {
      'import/no-unresolved': 'off',
    },
  },
];
