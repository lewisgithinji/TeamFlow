/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['@teamflow/eslint-config/base'],
  ignorePatterns: [
    'node_modules',
    'dist',
    'build',
    '.next',
    '.turbo',
    'coverage',
    '*.config.js',
    '*.config.ts',
  ],
};
