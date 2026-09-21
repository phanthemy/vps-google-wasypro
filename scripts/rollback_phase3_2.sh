#!/bin/bash
# ============================================================
# ROLLBACK SCRIPT: Phase 3.2 → Phase 3.1 Stable
# ============================================================
# PURPOSE:  Restore system to Phase 3.1 checkpoint
# TAG:      phase-3.1-stable
# COMMIT:   f8e2d6e
# CREATED:  2026-09-21
#
# USAGE:
#   bash /var/www/wasypro/scripts/rollback_phase3_2.sh
#
# WARNING: This will STOP production, restore code + DB + schema,
#          and only restart if ALL verifications PASS.
# ============================================================

set -euo pipefail

PROJECT_DIR="/var/www/wasypro"
SERVER_DIR="$PROJECT_DIR/server"
DB_FILE="$SERVER_DIR/dev.db"
DB_BACKUP="$SERVER_DIR/dev.db.backup_phase3_1_stable"
SCHEMA_FILE="$SERVER_DIR/prisma/schema.prisma"
SCHEMA_BACKUP="$SERVER_DIR/prisma/schema.prisma.backup_phase3_1_stable"
GIT_TAG="phase-3.1-stable"
PM2_APP="happylife-backend"

# Expected checksums
EXPECTED_DB_SHA256="e8a11aee0ba10f72e0835fd37596db85939759afdbc13ba4b5d2468c21d4709e"
EXPECTED_SCHEMA_SHA256="18e3d7d5f7f54a76f2a776039c78782e74eff1a8b6460cfb4b6351e448625c33"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED=0

log_pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
log_fail() { echo -e "${RED}[FAIL]${NC} $1"; FAILED=1; }
log_info() { echo -e "${YELLOW}[INFO]${NC} $1"; }

echo "============================================================"
echo "  ROLLBACK: Phase 3.2 → Phase 3.1 Stable"
echo "  Started: $(date -Iseconds)"
echo "============================================================"
echo ""

# ── DRY-RUN MODE ──────────────────────────────────────────────
DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
    DRY_RUN=true
    log_info "DRY-RUN MODE: No changes will be made."
    echo ""
fi

# ── PRE-FLIGHT: Verify backups exist ─────────────────────────
echo "=== Step 0: Pre-flight checks ==="

if [ ! -f "$DB_BACKUP" ]; then
    log_fail "Database backup not found: $DB_BACKUP"
else
    log_pass "Database backup exists: $DB_BACKUP"
fi

if [ ! -f "$SCHEMA_BACKUP" ]; then
    log_fail "Schema backup not found: $SCHEMA_BACKUP"
else
    log_pass "Schema backup exists: $SCHEMA_BACKUP"
fi

# Verify backup checksums
ACTUAL_DB_SHA256=$(sha256sum "$DB_BACKUP" | awk '{print $1}')
if [ "$ACTUAL_DB_SHA256" != "$EXPECTED_DB_SHA256" ]; then
    log_fail "Database backup checksum MISMATCH!"
    echo "       Expected: $EXPECTED_DB_SHA256"
    echo "       Actual:   $ACTUAL_DB_SHA256"
else
    log_pass "Database backup checksum verified"
fi

ACTUAL_SCHEMA_SHA256=$(sha256sum "$SCHEMA_BACKUP" | awk '{print $1}')
if [ "$ACTUAL_SCHEMA_SHA256" != "$EXPECTED_SCHEMA_SHA256" ]; then
    log_fail "Schema backup checksum MISMATCH!"
    echo "       Expected: $EXPECTED_SCHEMA_SHA256"
    echo "       Actual:   $ACTUAL_SCHEMA_SHA256"
else
    log_pass "Schema backup checksum verified"
fi

# Verify tag exists
cd "$PROJECT_DIR"
if ! git rev-parse "$GIT_TAG" >/dev/null 2>&1; then
    log_fail "Git tag '$GIT_TAG' not found"
else
    log_pass "Git tag '$GIT_TAG' exists → $(git log --oneline -1 $GIT_TAG)"
fi

if [ $FAILED -eq 1 ]; then
    echo ""
    echo -e "${RED}=== PRE-FLIGHT FAILED. ABORTING ROLLBACK. ===${NC}"
    exit 1
fi

echo ""
log_pass "All pre-flight checks passed"

if [ "$DRY_RUN" = true ]; then
    echo ""
    echo -e "${GREEN}=== DRY-RUN COMPLETE: All checks passed. Safe to run without --dry-run ===${NC}"
    exit 0
fi

echo ""

# ── Step 1: Stop PM2 backend ─────────────────────────────────
echo "=== Step 1: Stop PM2 backend ==="
pm2 stop "$PM2_APP" 2>/dev/null && log_pass "PM2 app '$PM2_APP' stopped" || log_info "PM2 app '$PM2_APP' was not running or not found"
echo ""

# ── Step 2: Restore Git code to tag ──────────────────────────
echo "=== Step 2: Restore Git to tag '$GIT_TAG' ==="
cd "$PROJECT_DIR"
git checkout "$GIT_TAG" -- . 2>&1
CURRENT_COMMIT=$(git rev-parse HEAD)
TAG_COMMIT=$(git rev-parse "$GIT_TAG^{commit}")
log_info "HEAD commit: $CURRENT_COMMIT"
log_info "Tag commit:  $TAG_COMMIT"
log_pass "Git code restored to tag '$GIT_TAG'"
echo ""

# ── Step 3: Restore database ─────────────────────────────────
echo "=== Step 3: Restore database ==="
cp "$DB_BACKUP" "$DB_FILE"
RESTORED_DB_SHA256=$(sha256sum "$DB_FILE" | awk '{print $1}')
if [ "$RESTORED_DB_SHA256" != "$EXPECTED_DB_SHA256" ]; then
    log_fail "Restored database checksum MISMATCH after copy!"
else
    log_pass "Database restored and checksum verified"
fi
echo ""

# ── Step 4: Restore schema.prisma ────────────────────────────
echo "=== Step 4: Restore schema.prisma ==="
cp "$SCHEMA_BACKUP" "$SCHEMA_FILE"
RESTORED_SCHEMA_SHA256=$(sha256sum "$SCHEMA_FILE" | awk '{print $1}')
if [ "$RESTORED_SCHEMA_SHA256" != "$EXPECTED_SCHEMA_SHA256" ]; then
    log_fail "Restored schema checksum MISMATCH after copy!"
else
    log_pass "Schema restored and checksum verified"
fi
echo ""

# ── Step 5: Prisma generate ──────────────────────────────────
echo "=== Step 5: Prisma generate ==="
cd "$SERVER_DIR"
if npx prisma generate 2>&1; then
    log_pass "Prisma client generated"
else
    log_fail "Prisma generate failed"
fi
echo ""

# ── Step 6: Prisma validate ──────────────────────────────────
echo "=== Step 6: Prisma validate ==="
if npx prisma validate 2>&1; then
    log_pass "Prisma schema valid"
else
    log_fail "Prisma validate failed"
fi
echo ""

# ── Step 7: Database integrity ───────────────────────────────
echo "=== Step 7: Database integrity ==="
INTEGRITY=$(sqlite3 "$DB_FILE" 'PRAGMA integrity_check;')
if [ "$INTEGRITY" = "ok" ]; then
    log_pass "PRAGMA integrity_check = ok"
else
    log_fail "PRAGMA integrity_check = $INTEGRITY"
fi

FK_CHECK=$(sqlite3 "$DB_FILE" 'PRAGMA foreign_key_check;')
if [ -z "$FK_CHECK" ]; then
    log_pass "PRAGMA foreign_key_check = clean"
else
    log_fail "PRAGMA foreign_key_check found violations: $FK_CHECK"
fi
echo ""

# ── Step 8: Git verification ─────────────────────────────────
echo "=== Step 8: Git verification ==="
cd "$PROJECT_DIR"
git status
echo "HEAD: $(git rev-parse HEAD)"
echo ""

# ── Step 9: Final decision ───────────────────────────────────
echo "============================================================"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}=== ALL VERIFICATIONS PASSED ===${NC}"
    echo ""
    echo "=== Step 9: Restart PM2 ==="
    pm2 start "$PM2_APP" 2>/dev/null && log_pass "PM2 app '$PM2_APP' restarted" || log_fail "PM2 restart failed"
    echo ""
    echo -e "${GREEN}=== ROLLBACK COMPLETE ===${NC}"
    echo "System is now at Phase 3.1 Stable checkpoint."
else
    echo -e "${RED}=== VERIFICATION FAILED ===${NC}"
    echo -e "${RED}PM2 will NOT be restarted.${NC}"
    echo "Review the failures above and fix manually."
    exit 1
fi
