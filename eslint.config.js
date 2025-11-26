import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  // Base config for all files
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: ['./tsconfig.json', './tsconfig.backend.json'],
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      import: importPlugin,
      prettier,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['./tsconfig.json', './tsconfig.backend.json'],
        },
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': 'allow-with-description' }],
      'linebreak-style': 'off',
      'class-methods-use-this': 'off',
      'import/no-unresolved': 'off',
      '@typescript-eslint/no-this-alias': [
        'error',
        {
          allowDestructuring: true,
          allowedNames: ['self'],
        },
      ],
      'require-yield': 'off',
      'no-plusplus': 'off',
      'import/no-cycle': 'off',
      'prefer-rest-params': 'off',
      'no-param-reassign': ['error', { props: false }],
      'func-names': ['error', 'always', { generators: 'never' }],
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react/prop-types': 'off', // Using TypeScript for prop validation
    },
  },
  // Backend files (Node.js only)
  {
    files: ['src/backend/**/*.ts', 'src/**/*.ts'],
    ignores: ['src/frontend/**/*'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.backend.json',
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
  // Frontend files (React)
  {
    files: ['src/frontend/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        ...globals.browser,
      },
    },
  },
  // Config files (exclude from TypeScript project parsing)
  {
    files: [
      '*.js',
      '*.config.{js,ts}',
      'vite.config.ts',
      '.eslintrc.js',
      '.prettierrc.js',
      'eslint.config.js',
      'tailwind.config.js',
      '.husky/**/*',
    ],
    languageOptions: {
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
        project: null, // Don't use TypeScript project for config files
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      'no-undef': 'off', // Config files may use Node globals
    },
  },
  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.js.map',
      '*.d.ts',
      'public/**',
      'index.html',
      'pnpm-lock.yaml',
      'package-lock.json',
      'yarn.lock',
      '.eslintcache',
      '*.log',
    ],
  }
);
