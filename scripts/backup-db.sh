#!/bin/bash
# Database Backup Script for AAA Platform
# Backs up PostgreSQL database and uploads to S3
# Usage: ./backup-db.sh
# Cron: 0 2 * * * /app/scripts/backup-db.sh >> /var/log/backup.log 2>&1

set -e  # Exit on error

# Configuration
BACKUP_DIR="/var/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/aaa_backup_$TIMESTAMP.sql.gz"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

# Database credentials (from environment)
DB_HOST=${POSTGRES_HOST:-postgres}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB:-aaa_production}
DB_USER=${POSTGRES_USER:-aaa}
DB_PASSWORD=${POSTGRES_PASSWORD}

# S3 configuration
S3_BUCKET=${BACKUP_S3_BUCKET:-aaa-backups-production}
S3_PREFIX="postgresql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

log "Starting database backup..."
log "Database: $DB_NAME on $DB_HOST:$DB_PORT"

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    error "pg_dump command not found. Install postgresql-client."
    exit 1
fi

# Perform backup
log "Creating backup file: $BACKUP_FILE"
export PGPASSWORD="$DB_PASSWORD"

if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --no-owner --no-acl --clean --if-exists \
    | gzip > "$BACKUP_FILE"; then
    log "Backup created successfully"
else
    error "Backup failed!"
    exit 1
fi

unset PGPASSWORD

# Check backup file size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "Backup size: $BACKUP_SIZE"

# Validate backup (try to list contents)
if gzip -t "$BACKUP_FILE" 2>/dev/null; then
    log "Backup file integrity verified"
else
    error "Backup file is corrupted!"
    exit 1
fi

# Upload to S3 (if AWS CLI is available)
if command -v aws &> /dev/null; then
    log "Uploading backup to S3: s3://$S3_BUCKET/$S3_PREFIX/"
    
    if aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/$S3_PREFIX/" --storage-class INTELLIGENT_TIERING; then
        log "Upload to S3 successful"
    else
        error "Failed to upload to S3"
        # Don't exit - we still have local backup
    fi
    
    # List S3 backups
    log "Current S3 backups:"
    aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX/" | tail -5
else
    warn "AWS CLI not found. Skipping S3 upload."
fi

# Clean up old local backups
log "Cleaning up local backups older than $RETENTION_DAYS days..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "aaa_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)
if [ "$DELETED_COUNT" -gt 0 ]; then
    log "Deleted $DELETED_COUNT old backup(s)"
else
    log "No old backups to delete"
fi

# Display local backups
log "Local backups:"
ls -lh "$BACKUP_DIR"/*.sql.gz | tail -5

# Send notification (optional - uncomment if using webhook)
# curl -X POST "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
#   -H "Content-Type: application/json" \
#   -d "{\"text\":\"Database backup completed: $BACKUP_FILE ($BACKUP_SIZE)\"}"

log "Backup completed successfully!"
log "Backup location: $BACKUP_FILE"
log "S3 location: s3://$S3_BUCKET/$S3_PREFIX/aaa_backup_$TIMESTAMP.sql.gz"

exit 0
