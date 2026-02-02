#!/bin/bash
# Database Restore Script for AAA Platform
# Restores PostgreSQL database from backup file
# Usage: ./restore-db.sh <backup_file.sql.gz>

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Check arguments
if [ $# -eq 0 ]; then
    error "No backup file specified"
    echo "Usage: $0 <backup_file.sql.gz>"
    echo "Example: $0 /var/backups/postgres/aaa_backup_20260202_020000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Database credentials (from environment)
DB_HOST=${POSTGRES_HOST:-postgres}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB:-aaa_production}
DB_USER=${POSTGRES_USER:-aaa}
DB_PASSWORD=${POSTGRES_PASSWORD}

log "Database Restore Script"
log "======================"
log "Backup file: $BACKUP_FILE"
log "Target database: $DB_NAME on $DB_HOST:$DB_PORT"
log "Target user: $DB_USER"
log ""

# Verify backup file integrity
log "Verifying backup file integrity..."
if gzip -t "$BACKUP_FILE" 2>/dev/null; then
    log "Backup file integrity verified"
else
    error "Backup file is corrupted or invalid!"
    exit 1
fi

# Warning prompt
warn "⚠️  WARNING: This will OVERWRITE all data in database '$DB_NAME'"
warn "⚠️  Make sure you have a recent backup before proceeding!"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log "Restore cancelled by user"
    exit 0
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    error "psql command not found. Install postgresql-client."
    exit 1
fi

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

log "Starting database restore..."

# Restore database
log "Restoring from: $BACKUP_FILE"
if gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -q; then
    log "Database restore completed successfully"
else
    error "Database restore failed!"
    unset PGPASSWORD
    exit 1
fi

unset PGPASSWORD

# Verify restore
log "Verifying restore..."
export PGPASSWORD="$DB_PASSWORD"
TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
unset PGPASSWORD

log "Tables in database: $TABLE_COUNT"

if [ "$TABLE_COUNT" -gt 0 ]; then
    log "Restore verification passed"
else
    warn "Database appears to be empty after restore"
fi

log "Restore completed successfully!"
log "Database: $DB_NAME on $DB_HOST:$DB_PORT"

exit 0
