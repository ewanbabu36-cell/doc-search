# Doc Search — Monorepo Boundary Specification

## Rule Matrix

| From \ To | `apps/company-platform` | `apps/partner-platform` | `apps/api-gateway` | `packages/shared-core` | `packages/api-contracts` | `packages/database` | `packages/auth` | `packages/ui-kit` |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **`apps/company-platform`** | Self | **DENIED** | **DENIED** | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| **`apps/partner-platform`** | **DENIED** | Self | **DENIED** | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| **`apps/api-gateway`** | **DENIED** | **DENIED** | Self | ALLOWED | ALLOWED | ALLOWED | ALLOWED | **DENIED** |
| **`packages/auth`** | **DENIED** | **DENIED** | **DENIED** | ALLOWED | ALLOWED | ALLOWED | Self | **DENIED** |
| **`packages/database`** | **DENIED** | **DENIED** | **DENIED** | ALLOWED | **DENIED** | Self | **DENIED** | **DENIED** |
| **`packages/api-contracts`** | **DENIED** | **DENIED** | **DENIED** | ALLOWED | Self | **DENIED** | **DENIED** | **DENIED** |
| **`packages/ui-kit`** | **DENIED** | **DENIED** | **DENIED** | ALLOWED | **DENIED** | **DENIED** | **DENIED** | Self |
| **`packages/shared-core`** | **DENIED** | **DENIED** | **DENIED** | Self | **DENIED** | **DENIED** | **DENIED** | **DENIED** |

## Enforcement
Architectural boundaries are enforced via `eslint-plugin-boundaries` configured in `@docsearch/eslint-config`.
Any attempt by Phase 1 to import Phase 2 code (or vice-versa) results in a build and lint failure.
