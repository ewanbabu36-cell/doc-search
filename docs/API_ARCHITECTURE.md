# DOC SEARCH — API Architecture Specification

## 1. Overview
The DOC SEARCH API Gateway provides a unified, secure entry point for all frontend platforms (Company Platform, Partner Platform, Mobile Apps).

## 2. Request Lifecycle & Layer Stack
```
1. Client Request (HTTPS)
   │
2. Fastify API Gateway
   ├── Helmet Security Headers
   ├── CORS Validation (Strict Whitelist, No Wildcard in Prod)
   └── Rate Limiter (Sliding Window)
   │
3. Authentication Hook (`authenticate`)
   ├── Extract Bearer Token
   ├── Cryptographic Signature Verification (HS256)
   ├── Issuer / Audience / Expiration Verification
   └── Construct Request-scoped SessionContext
   │
4. Authorization & Scope Hooks (`requirePermission`, `requireBranchScope`)
   ├── RBAC Permission Evaluation
   ├── Role Membership Verification
   └── Facility Branch Boundary Check
   │
5. Fastify Route Handler
   ├── Zod DTO Schema Parsing & Validation
   └── Status Code & Response Envelope Mapping
   │
6. Domain Service
   ├── Business Logic & State Transition Machine
   └── Orchestrate Cryptographic Audit Logging
   │
7. Repository Layer
   ├── Parameterized Drizzle Queries
   └── Transaction Management with `withSecurityContext`
   │
8. PostgreSQL Database
   └── Row-Level Security (RLS) & Foreign Key Integrity
```

## 3. Response Envelope Structure
- **Success Response**:
```json
{
  "success": true,
  "data": { ... },
  "total": 100
}
```
- **Error Response**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid partner payload",
    "requestId": "uuid",
    "details": [
      { "field": "primaryContactEmail", "message": "Invalid email format" }
    ]
  }
}
```
