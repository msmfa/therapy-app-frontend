// ESLint v9 flat config for React Native + TypeScript (no prettier, no import plugin)
const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const react = require('eslint-plugin-react');
const reactNative = require('eslint-plugin-react-native');
const globals = require('globals');

module.exports = [
  // Global ignores
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.expo/**',
      '**/*.config.js',
      '**/__tests__/**',
      '**/*.test.*',
    ],
  },

  // Base JS recommended
  js.configs.recommended,

  // TS/TSX sources
  {
    files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: './tsconfig.json',
      },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react,
      'react-native': reactNative,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // TypeScript strict - no any
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',

      // React Native
      'react-native/no-unused-styles': 'error',

      // Unused vars (TypeScript-aware)
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],

      // Whitespace / formatting
      indent: ['error', 4, { SwitchCase: 1 }],
      'no-mixed-spaces-and-tabs': 'error',
      'no-trailing-spaces': 'error',
      'eol-last': ['error', 'always'],
      'linebreak-style': ['error', 'unix'],
      'space-in-parens': ['error', 'never'],
      'space-before-blocks': ['error', 'always'],
      'keyword-spacing': ['error', { before: true, after: true }],
      'comma-spacing': ['error', { before: false, after: true }],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],

      // JSX spacing/indent
      'react/jsx-indent': ['error', 4],
      'react/jsx-indent-props': ['error', 4],
      'react/jsx-curly-spacing': ['error', { when: 'always', children: true, allowMultiline: true }],
      'react/jsx-equals-spacing': ['error', 'never'],
      'react/jsx-tag-spacing': ['error', { beforeSelfClosing: 'always' }],
    },
  },
];
