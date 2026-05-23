const { FlatCompat } = require('@eslint/eslintrc');
const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const jestPlugin = require('eslint-plugin-jest');
const globals = require('globals');

const compat = new FlatCompat({ baseDirectory: __dirname });

module.exports = [
  {
    ignores: ['node_modules/**', 'dist/**', '.vscode/**', 'jest.config.js'],
  },
  ...compat.extends('airbnb-base'),
  {
    files: ['**/*.ts', '**/*.js'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    languageOptions: {
      parser: typescriptParser,
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      'import/no-unresolved': 'off',
      'import/no-extraneous-dependencies': 'off',
      'import/extensions': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'class-methods-use-this': 'off',
      'no-param-reassign': 'off',
    },
  },
  {
    files: ['tests/**/*.test.ts'],
    plugins: { jest: jestPlugin },
    languageOptions: {
      globals: jestPlugin.environments.globals.globals,
    },
  },
  {
    files: ['*.d.ts'],
    rules: {
      'max-classes-per-file': 'off',
    },
  },
];
