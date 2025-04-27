const globals = require('globals');
const reactHooks = require('eslint-plugin-react-hooks');
const reactRefresh = require('eslint-plugin-react-refresh');

module.exports = [
  { ignores: ['dist', 'node_modules', 'eslint.config.js'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser, // Suitable for React, even if the server renders in the browser
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true }, // Enables JSX syntax
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh, // Includes the React Refresh plugin
    },
    rules: {
      "no-console": "warn",  // Warns about using console statements to avoid debug output in production code
      "prefer-const": "error",  // Enforces the use of 'const' for variables that are not reassigned
      "no-unused-vars": "warn",  // Warns about declared variables that are never used
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ], // React Refresh rule to ensure proper component export
      'react-hooks/rules-of-hooks': 'error', // Ensures proper usage of React hooks
      'react-hooks/exhaustive-deps': 'warn', // Warns about missing dependencies in hooks
    },
  },
];
