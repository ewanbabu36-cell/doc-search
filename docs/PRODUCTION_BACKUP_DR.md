# DOC SEARCH — Production Backup & Disaster Recovery (DR)

### 1. Backup Strategy
- **Continuous Archiving**: PostgreSQL WAL-G archiving to S3-compatible encrypted bucket
- **Daily Full Backups**: `pg_dump -Fc` executed at 00:00 UTC
- **Retention Policy**: 30 days daily, 12 months monthly

### 2. Recovery Objectives
- **RPO (Recovery Point Objective)**: < 5 minutes
- **RTO (Recovery Time Objective)**: < 30 minutes

### 3. Restore Verification Procedure
```bash
# 1. Provision isolated staging database
createdb docsearch_restore_test

# 2. Restore dump
pg_restore -d docsearch_restore_test backup_latest.dump

# 3. Verify integrity
node scratch/verify_db_integrity.js
```
