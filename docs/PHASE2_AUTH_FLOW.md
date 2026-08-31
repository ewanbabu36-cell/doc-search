# Phase 2 Authentication & Session Bootstrap Flow

## 1. End-to-End Architecture

```
                                 LANDING PAGE
                                      │
                                      ▼
                               REAL LOGIN FORM
                        (Email + scrypt Password)
                                      │
                                      ▼
                           POST /api/v1/auth/login
                                      │
                                      ▼
                          Fastify API Gateway
                                      │
                                      ▼
                        Find User in core.users
                                      │
                                      ▼
                   Verify scrypt Hash in core.credentials
                                      │
                                      ▼
                      Resolve Tenant & Branch Membership
                                      │
                                      ▼
                        Resolve RBAC Granular Permissions
                                      │
                                      ▼
                     Create Persistent Session in DB
                                      │
                                      ▼
                    Generate Signed JWT Access Token
                                      │
                                      ▼
                          Establish Client Session
                                      │
                                      ▼
                       Render Server-Authorized Panel
                                      │
                                      ▼
                            Execute Lab Operations
                                      │
                                      ▼
                         LOGOUT: Revoke DB Session
```

---

## 2. Session Bootstrap & Lifecycle Rules
1. **No Frontend Self-Privilege**: The frontend client never computes its own role or permissions; all authorizations originate from the JWT claims signed by the API Gateway.
2. **Persistent Storage in PostgreSQL**: Sessions are maintained in `core.sessions`, surviving server restarts and browser reloads.
3. **Revocation on Logout**: Clicking logout sends a signed request to `POST /api/v1/auth/logout` which updates `revoked_at` in the database before discarding local client tokens.
