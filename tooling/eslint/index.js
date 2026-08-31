/** @type {import('eslint').Linter.Config} */
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import', 'boundaries'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:boundaries/recommended'
  ],
  settings: {
    'boundaries/elements': [
      { type: 'app-company', pattern: 'apps/company-platform/*' },
      { type: 'app-partner', pattern: 'apps/partner-platform/*' },
      { type: 'app-api-gateway', pattern: 'apps/api-gateway/*' },
      { type: 'pkg-shared-core', pattern: 'packages/shared-core/*' },
      { type: 'pkg-api-contracts', pattern: 'packages/api-contracts/*' },
      { type: 'pkg-auth', pattern: 'packages/auth/*' },
      { type: 'pkg-database', pattern: 'packages/database/*' },
      { type: 'pkg-ui-kit', pattern: 'packages/ui-kit/*' }
    ]
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],

    // Strict boundary enforcement:
    // 1. Phase 1 (company-platform) can never import Phase 2 (partner-platform)
    // 2. Phase 2 (partner-platform) can never import Phase 1 (company-platform)
    // 3. Apps cannot cross-import sibling apps
    // 4. Packages can only import approved lower-level packages
    'boundaries/element-types': [
      'error',
      {
        default: 'disallow',
        rules: [
          {
            from: 'app-company',
            allow: ['pkg-shared-core', 'pkg-api-contracts', 'pkg-auth', 'pkg-database', 'pkg-ui-kit'],
            disallow: ['app-partner', 'app-api-gateway']
          },
          {
            from: 'app-partner',
            allow: ['pkg-shared-core', 'pkg-api-contracts', 'pkg-auth', 'pkg-database', 'pkg-ui-kit'],
            disallow: ['app-company', 'app-api-gateway']
          },
          {
            from: 'app-api-gateway',
            allow: ['pkg-shared-core', 'pkg-api-contracts', 'pkg-auth', 'pkg-database'],
            disallow: ['app-company', 'app-partner', 'pkg-ui-kit']
          },
          {
            from: 'pkg-auth',
            allow: ['pkg-shared-core', 'pkg-api-contracts', 'pkg-database']
          },
          {
            from: 'pkg-database',
            allow: ['pkg-shared-core']
          },
          {
            from: 'pkg-api-contracts',
            allow: ['pkg-shared-core']
          },
          {
            from: 'pkg-ui-kit',
            allow: ['pkg-shared-core']
          },
          {
            from: 'pkg-shared-core',
            allow: []
          }
        ]
      }
    ]
  }
};
