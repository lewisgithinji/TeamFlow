/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['@teamflow/eslint-config/nextjs'],
  ignorePatterns: ['node_modules', '.next', 'out', '*.config.js', '*.config.ts'],
  rules: {
    // Custom rules for frontend
    'react/no-unescaped-entities': 'off',
    '@next/next/no-html-link-for-pages': 'off',
  },
};
