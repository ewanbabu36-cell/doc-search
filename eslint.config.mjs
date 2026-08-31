import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.turbo/**',
      '**/coverage/**',
      'tooling/pnpm.cjs',
      'tooling/worker.js',
      'tooling/*.js'
    ]
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'debug'] }]
    }
  },
  // 1. Phase 1 Boundary: company-platform cannot import partner-platform, landing-page, or api-gateway
  {
    files: ['apps/company-platform/**/*.ts', 'apps/company-platform/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['*partner-platform*', '**/partner-platform/**', '@docsearch/partner-platform*', '../*partner*'],
              message: 'Boundary Violation: Phase 1 (company-platform) is strictly forbidden from importing Phase 2 (partner-platform).'
            },
            {
              group: ['*api-gateway*', '**/api-gateway/**', '@docsearch/api-gateway*'],
              message: 'Boundary Violation: Company platform cannot import API gateway internal modules.'
            }
          ]
        }
      ]
    }
  },
  // 2. Phase 2 Boundary: partner-platform cannot import company-platform, landing-page, or api-gateway
  {
    files: ['apps/partner-platform/**/*.ts', 'apps/partner-platform/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['*company-platform*', '**/company-platform/**', '@docsearch/company-platform*', '../*company*'],
              message: 'Boundary Violation: Phase 2 (partner-platform) is strictly forbidden from importing Phase 1 (company-platform).'
            },
            {
              group: ['*landing-page*', '**/landing-page/**', '@docsearch/landing-page*', '../*landing*'],
              message: 'Boundary Violation: Partner platform is strictly forbidden from importing Landing Page.'
            },
            {
              group: ['*api-gateway*', '**/api-gateway/**', '@docsearch/api-gateway*'],
              message: 'Boundary Violation: Partner platform cannot import API gateway internal modules.'
            }
          ]
        }
      ]
    }
  },
  // 3. Public Web Boundary: landing-page cannot import internal backend or platform internals
  {
    files: ['apps/landing-page/**/*.ts', 'apps/landing-page/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['*company-platform*', '**/company-platform/**', '@docsearch/company-platform*'],
              message: 'Boundary Violation: Landing page cannot import company platform internal modules.'
            },
            {
              group: ['*partner-platform*', '**/partner-platform/**', '@docsearch/partner-platform*'],
              message: 'Boundary Violation: Landing page cannot import partner platform internal modules.'
            },
            {
              group: ['*api-gateway*', '**/api-gateway/**', '@docsearch/api-gateway*'],
              message: 'Boundary Violation: Landing page cannot import API gateway internal modules.'
            }
          ]
        }
      ]
    }
  },
  // 4. Shared Packages Boundary: Shared packages cannot import apps
  {
    files: ['packages/**/*.ts', 'packages/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['*apps*', '**/apps/**', '@docsearch/company-platform*', '@docsearch/partner-platform*', '@docsearch/landing-page*', '@docsearch/api-gateway*'],
              message: 'Boundary Violation: Shared packages cannot import application layer code.'
            }
          ]
        }
      ]
    }
  }
];
