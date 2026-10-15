#!/usr/bin/env bash
# ==============================================================================
# DocSearch Disaster Recovery - Cloud S3 / R2 Encrypted Backup Sync
# Syncs local AES-256-GCM encrypted database snapshots to off-site object storage
# ==============================================================================

set -eo pipefail

BACKUP_LOCAL_DIR="/opt/docsearch/data/backups/encrypted"
ENV_FILE="/opt/docsearch/.env.production"

if [[ -f "${ENV_FILE}" ]]; then
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
fi

if [[ "${S3_BACKUP_ENABLED}" != "true" ]]; then
  echo "[*] S3 off-site backup is disabled in .env.production (S3_BACKUP_ENABLED=false). Skipping cloud sync."
  exit 0
fi

if ! command -v aws &> /dev/null; then
  echo "[!] AWS CLI not found. Please install awscli or configure rclone."
  exit 1
fi

echo "[+] Syncing encrypted backup snapshots to s3://${S3_BUCKET_NAME}/backups/..."

aws s3 sync "${BACKUP_LOCAL_DIR}" "s3://${S3_BUCKET_NAME}/backups/" \
  --endpoint-url "${S3_ENDPOINT:-https://s3.amazonaws.com}" \
  --region "${S3_REGION:-ap-south-1}" \
  --delete

echo "[✔] Cloud backup sync completed successfully."
