# Category 17: Performance Baseline Audit Report
Generated: 2026-09-29T05:46:53.561Z

## 1. Executive Summary
- **API Gateway Target**: `http://127.0.0.1:4000`
- **Database Engine**: PostgreSQL 18.4 on `127.0.0.1:5432`
- **Database Indexes Active**: 2139
- **N+1 Query Suspects in Repositories**: 5
- **Peak API Throughput Measured**: 190 RPS (at concurrency = 10)
- **Node.js Memory Utilization**: RSS = 86.38 MB, Heap Used = 17.7 MB

## 2. Core API Endpoint Latency Baseline (25 iterations each)
| Endpoint | Method | Status | Payload (Bytes) | P50 (ms) | P75 (ms) | P95 (ms) | P99 (ms) | Avg (ms) |
|---|---|---|---|---|---|---|---|---|
| Health Check | `GET` | 200 | 180 | 15.66 | 16.38 | 18.64 | 86.22 | 16.2 |
| Auth Session (/me) | `GET` | 200 | 402 | 16.19 | 16.92 | 20.58 | 166.81 | 21.28 |
| Patients List | `GET` | 200 | 5076 | 15.72 | 16.42 | 24.31 | 50.24 | 17 |
| Patient Search | `GET` | 200 | 26 | 16.22 | 17.86 | 32.28 | 105.63 | 21.1 |
| Encounters List | `GET` | 200 | 6359 | 15.32 | 17.91 | 21.87 | 40.86 | 16.67 |
| Lab Orders List | `GET` | 200 | 9016 | 15.39 | 16.87 | 21.01 | 46.45 | 16.61 |
| Radiology Orders List | `GET` | 200 | 3611 | 15.34 | 18.12 | 23.9 | 62.08 | 17.68 |
| Billing Invoices List | `GET` | 200 | 1314 | 15.82 | 16.37 | 21.27 | 35.3 | 16.43 |
| Pharmacy Inventory List | `GET` | 200 | 1568 | 15.51 | 16.59 | 21.48 | 50.19 | 16.12 |
| HQ Command Center Overview | `GET` | 200 | 8209 | 17.07 | 32.04 | 76.66 | 204.8 | 34.82 |

## 3. Concurrency & Throughput Scaling Matrix
| Concurrent Users | Total Requests | Total Time (ms) | Throughput (RPS) | P50 (ms) | P95 (ms) | Error Count |
|---|---|---|---|---|---|---|
| 2 | 20 | 186 | **107.5** | 15.7 | 46.69 | 0 |
| 5 | 50 | 263.2 | **190** | 24.26 | 57.15 | 0 |
| 10 | 100 | 678.7 | **147.3** | 52.63 | 149.71 | 0 |

## 4. Frontend Production Bundle Sizes
| Application | Total (KB) | JS (KB) | CSS (KB) | Files | Largest Chunk |
|---|---|---|---|---|---|
| partner-platform | 819171.6 | 809051.8 | 736.8 | 11537 | index-Chujv3rn.js (4841.3 KB) |
| company-platform | 325925 | 321201.1 | 797 | 2584 | index-CcfG2yz-.js (2780.7 KB) |
| landing-page | 5813.5 | 5237.5 | 258.5 | 90 | index-Dv3VxF1i.js (337.6 KB) |

## 5. Potential N+1 Code Patterns in Repositories (Sample)
- `apps/api-gateway/src/repositories/partner/SupplyChainRepository.ts:360`: `for (const itm of data.items) {`
- `apps/api-gateway/src/repositories/partner/SupplyChainRepository.ts:433`: `for (const itm of data.items) {`
- `apps/api-gateway/src/repositories/partner/SupplyChainRepository.ts:590`: `for (const itm of data.items) {`
- `apps/api-gateway/src/repositories/partner/SupplyChainRepository.ts:1072`: `for (const itm of data.items) {`
- `apps/api-gateway/src/repositories/partner/SupplyChainRepository.ts:1118`: `for (const item of transferItemsList) {`
