const js = require('@eslint/js');
const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const jestPlugin = require('eslint-plugin-jest');
const globals = require('globals');

module.exports = [
  {
    ignores: ['node_modules/**', 'dist/**', '.vscode/**', 'scripts/**', '.chrome-bins/**', 'jest.config.js', 'eslint.config.js', 'webpack.config.js'],
  },
  js.configs.recommended,
  ...typescriptEslint.configs['flat/strict-type-checked'],
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: true,
      },
    },
  },
  {
    files: ['**/*.ts', '**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      // Airbnb-equivalent best-practice rules
      'no-var': 'error',
      'prefer-const': 'error',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'no-console': 'warn',
      'prefer-arrow-callback': 'error',
      'no-shadow': 'off',
      // TypeScript (downgrade to warn)
      '@typescript-eslint/no-unused-vars': 'warn',
      // Project-specific overrides
      'class-methods-use-this': 'off',
      'no-param-reassign': 'off',
    },
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    ...typescriptEslint.configs['flat/disable-type-checked'],
  },
  {
    files: ['tests/**/*.ts'],
    ...typescriptEslint.configs['flat/disable-type-checked'],
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
