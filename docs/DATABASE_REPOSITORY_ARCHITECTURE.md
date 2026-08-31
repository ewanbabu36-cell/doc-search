# DOC SEARCH — Database & Repository Architecture

## 1. Multi-Tier Persistence Strategy
1. **Schema Layer (`packages/database/src/schema/`)**:
   - `core`: `tenants`, `branches`, `users`, `sessions`, `auditEvents`, `credentials`, `roles`.
   - `company`: `partnerProfiles`, `partnerAgreements`, `partnerLifecycleTransitions`, `products`, `plans`, `subscriptions`.
   - `clinical`: `radiologyOrders`, `radiologyStudies`, `radiologyReports`, `radiologyCriticalFindings`, etc.
2. **Repository Layer (`apps/api-gateway/src/repositories/`)**:
   - Parameterized queries using Drizzle ORM.
   - Every method supports passing an active transaction or client (`dbClient = getDatabase()`).
   - Pure persistence logic; zero HTTP or framework dependencies.
3. **Transaction & Security Context (`withSecurityContext`)**:
   - Executes database queries within an isolated transaction.
   - Sets PostgreSQL session variables:
     ```sql
     SET LOCAL app.current_tenant_id = '...';
     SET LOCAL app.current_branch_id = '...';
     SET LOCAL app.current_user_id = '...';
     SET LOCAL app.is_super_admin = '...';
     ```
   - Guarantees complete tenant isolation at the SQL query planner level.
