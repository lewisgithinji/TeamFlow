/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['@teamflow/eslint-config/node'],
  ignorePatterns: ['node_modules', 'dist', '*.config.js'],
  rules: {
    // Custom rules for backend
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
