// eslint-disable-next-line import/no-extraneous-dependencies
require('@rushstack/eslint-patch/modern-module-resolution');

/** @type { import('eslint').Linter.Config } */
module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 'latest',
    parser: '@typescript-eslint/parser',
    project: './tsconfig.json'
  },
  extends: [
    'eslint:recommended',
    'airbnb-base',
    'airbnb-typescript/base',
  ],
  plugins: ['unused-imports'],
  rules: {
    'no-return-assign': 0,
    'no-param-reassign': 0,
    'no-shadow': 0,
    'no-useless-constructor': 0,
    'no-use-before-define': 0,
    'no-underscore-dangle': 0,
    'no-plusplus': 0,
    'no-restricted-syntax': 0,
    'max-len': 0,
    'class-methods-use-this': 0,
    'max-classes-per-file': 0,
    'import/prefer-default-export': 0,
    'unused-imports/no-unused-imports': 1,
    'unused-imports/no-unused-vars': 0,
    '@typescript-eslint/consistent-type-imports': 1,
    '@typescript-eslint/strict-boolean-expressions': 2
  },
  ignorePatterns: ['**/dist/**', '**/node_modules/**'],
};
