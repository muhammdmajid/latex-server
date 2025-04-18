import js from '@eslint/js';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';

export default [
  {
    files: ['**/*.{js,jsx}'],  // Target JavaScript and JSX files
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',  // ECMAScript latest version
        sourceType: 'module',   // Use ES6 module syntax
      },
      globals: {
        ...globals.browser,  // Browser globals
        ...globals.node,     // Node.js globals
      },
    },
    plugins: {
      import: importPlugin,  // Use the import plugin
    },
    rules: {
      ...js.configs.recommended.rules,  // Use the recommended ESLint rules
      'import/no-unresolved': [
        'error',
        {
          ignore: ['^@/(.*)', '^~/(.*)'],  // Custom alias to be ignored
        },
      ],
      'import/order': [
        'error',
        {
          groups: [
            ['builtin', 'external'],  // Built-in and external imports first
            'internal',               // Internal imports next
            'parent', 'sibling', 'index' // Parent, sibling, and index last
          ],
          'newlines-between': 'always',  // Ensure there is a newline between groups
        },
      ],
    },
  },
];
