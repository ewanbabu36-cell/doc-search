# Doc Search — Master Architecture

## Philosophy
> "Simple for normal users, powerful for professionals, intelligent for management, and secure by design."

## High-Level Topology

```
+-------------------------------------------------------------------------+
|                              DOC SEARCH                                 |
+-------------------------------------------------------------------------+
|                                                                         |
|  +---------------------------+             +--------------------------+ |
|  |   apps/company-platform   |             |  apps/partner-platform   | |
|  | (Phase 1: 15 Domains)     |             | (Phase 2: Clinic/Hospital)| |
|  +-------------+-------------+             +------------+-------------+ |
|                |                                        |               |
|                +-------------------+--------------------+               |
|                                    |                                    |
|                       +------------v-------------+                      |
|                       |     apps/api-gateway     |                      |
|                       +------------+-------------+                      |
|                                    |                                    |
|       +----------------------------+----------------------------+       |
|       |                            |                            |       |
|  +----v---------------+   +--------v---------+   +--------------v----+  |
|  | packages/auth      |   | packages/database|   |packages/ui-kit    |  |
|  | - RBAC/ABAC Engine |   | - Drizzle ORM    |   | - Healthcare Light|  |
|  | - Session Context  |   | - Schema Isolation|  | - Black & White   |  |
|  +--------------------+   +------------------+   +-------------------+  |
|       |                            |                            |       |
|       +----------------------------+----------------------------+       |
|                                    |                                    |
|                       +------------v-------------+                      |
|                       |   packages/shared-core   |                      |
|                       |   packages/api-contracts |                      |
|                       +--------------------------+                      |
+-------------------------------------------------------------------------+
```

## Boundaries & Principles
- **Phase 1 (Company Platform):** Internal governance, SaaS billing, telemetry, partner lifecycle.
- **Phase 2 (Partner Platform):** Clinical workflows, hospital operations, patient records, provider tools.
- **Shared Packages (`packages/*`):** Zero direct cross-app imports. Interoperability happens exclusively via `@docsearch/api-contracts` and shared core services.
