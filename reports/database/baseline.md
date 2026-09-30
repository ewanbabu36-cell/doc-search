# DOC SEARCH — CATEGORY 9: DATABASE AUDIT BASELINE

**Generated:** 2026-09-29T00:20:06.034Z
**Target Environment:** Native PostgreSQL 18.4 on Port 5432
**Database Name:** docsearch

---

## 1. Executive Summary

| Metric | Result |
| :--- | :--- |
| **PostgreSQL Engine** | PostgreSQL 18.4 on x86_64-windows, compiled by msvc-19.44.35226, 64-bit |
| **Connection Status** | CONNECTED (127.0.0.1:5432) |
| **Database Schemas** | 8 (auth, billing, clinical, company, core, drizzle, public, workflow) |
| **Database Base Tables** | **501** tables |
| **Database Views** | **0** views |
| **Total Database Columns** | **8388** columns |
| **Database Indexes** | **2140** indexes |
| **Total Constraints** | **8365** (PK: 497, FK: 1012, Unique: 123, Check: 6733) |
| **Database Enums** | **0** custom enum types |
| **Sequences** | **1** |
| **Triggers** | **4** |
| **Installed Extensions** | **1** (plpgsql) |
| **SQL Migrations on Disk** | **69** files (packages/database/migrations) |
| **ORM Schema Tables** | **499** tables (packages/database/src/schema) |
| **Verified ORM ↔ DB Matches**| **499** tables |

---

## 2. Table Distribution by PostgreSQL Schema

| Schema | Table Count |
| :--- | :--- |
| `clinical` | **321** |
| `company` | **133** |
| `core` | **32** |
| `drizzle` | **1** |
| `public` | **14** |

---

## 3. Database Constraints Summary

- **Primary Keys:** 497
- **Foreign Keys:** 1012
- **Unique Constraints:** 123
- **Check Constraints:** 6733

---

## 4. Installed Extensions

- **plpgsql** (v1.0)

---

## 5. Migrations Inventory (69 Files)

- `0000_curvy_stature.sql`
- `0001_left_iron_monger.sql`
- `0002_kind_power_man.sql`
- `0003_fluffy_boomerang.sql`
- `0004_panoramic_mattie_franklin.sql`
- `0005_chilly_green_goblin.sql`
- `0006_young_agent_brand.sql`
- `0007_wandering_hardball.sql`
- `0008_dusty_sauron.sql`
- `0009_perfect_ezekiel_stane.sql`
- `0010_watery_kylun.sql`
- `0011_flimsy_stardust.sql`
- `0012_yummy_enchantress.sql`
- `0013_new_rage.sql`
- `0014_giant_nighthawk.sql`
- `0015_productive_machine_man.sql`
- `0016_tiresome_proemial_gods.sql`
- `0017_parallel_nocturne.sql`
- `0018_late_energizer.sql`
- `0019_fancy_mole_man.sql`

... and 49 more migration files.

---

## 6. Database Fallbacks & In-Memory Isolation

- **Findings:** 1
- [PG_MEM_RUNTIME_REFERENCE] `packages/database/src/client.ts`: pg-mem referenced in non-test runtime file
