/* eslint-env node */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json'],
  },
  env: {
    es2022: true,
    node: true,
    browser: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  overrides: [
    {
      files: ['vite.config.ts', 'vitest.config.ts'],
      parserOptions: { project: null },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      files: ['vitest-env.d.ts'],
      parserOptions: { project: null },
    },
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/consistent-type-imports': 'warn',
    'import/order': [
      'warn',
      {
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
        groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index']],
        pathGroups: [
          {
            pattern: '@{domain,store,persistence,ui}*/**',
            group: 'internal',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
      },
    ],
    'import/no-unresolved': ['error', { ignore: ['^vitest/config$'] }],
  },
};
