# PHASE 3.1 — ROLLBACK CHECKPOINT REPORT
**Tạo lúc**: 2026-09-21 09:44 ICT  
**Mục tiêu**: Safety checkpoint trước Phase 3.2

---

## 1. GIT STATE

| Thông tin | Giá trị |
| :--- | :--- |
| **Branch** | `main` |
| **Commit** | `f8e2d6e` |
| **Message** | `feat(npp): Phase 3.1 - NPP database foundation (5 new tables, User/RankHistory/CommissionPeriod extensions)` |
| **Tag** | `phase-3.1-stable` → commit `f8e2d6e` |
| **Working tree** | `clean` (nothing to commit) |
| **Uncommitted changes** | **KHÔNG** |
| **GitHub push** | ✅ `main` pushed, tag `phase-3.1-stable` pushed |

---

## 2. DATABASE BACKUP

| Thông tin | Giá trị |
| :--- | :--- |
| **Live DB** | `/var/www/wasypro/server/dev.db` |
| **Backup** | `/var/www/wasypro/server/dev.db.backup_phase3_1_stable` |
| **Kích thước** | `520,192 bytes` (khớp) |
| **SHA256** | `e8a11aee0ba10f72e0835fd37596db85939759afdbc13ba4b5d2468c21d4709e` |
| **integrity_check** | ✅ `ok` |
| **foreign_key_check** | ✅ `clean` (trống) |

---

## 3. SCHEMA BACKUP

| Thông tin | Giá trị |
| :--- | :--- |
| **Live Schema** | `/var/www/wasypro/server/prisma/schema.prisma` |
| **Backup** | `/var/www/wasypro/server/prisma/schema.prisma.backup_phase3_1_stable` |
| **Kích thước** | `25,290 bytes` (khớp) |
| **SHA256** | `18e3d7d5f7f54a76f2a776039c78782e74eff1a8b6460cfb4b6351e448625c33` |

---

## 4. MIGRATION STATE

| Thông tin | Giá trị |
| :--- | :--- |
| **Prisma migrate status** | ✅ `Database schema is up to date!` |
| **Tổng migrations** | 5 |
| **Migration cuối** | `20260921090000_phase_3_1_npp_foundation` (applied) |

**Danh sách migrations**:
```
20260902000000_init_baseline
20260902114800_phase1a_security_patch
20260905083000_phase_2c_additive_foundation
20260906130000_phase_period_lifecycle
20260921090000_phase_3_1_npp_foundation    ← Phase 3.1
```

---

## 5. CHECKSUMS

| File | SHA256 |
| :--- | :--- |
| `dev.db.backup_phase3_1_stable` | `e8a11aee0ba10f72e0835fd37596db85939759afdbc13ba4b5d2468c21d4709e` |
| `schema.prisma.backup_phase3_1_stable` | `18e3d7d5f7f54a76f2a776039c78782e74eff1a8b6460cfb4b6351e448625c33` |

---

## 6. ROLLBACK SCRIPT

| Thông tin | Giá trị |
| :--- | :--- |
| **Path** | `/var/www/wasypro/scripts/rollback_phase3_2.sh` |
| **Permissions** | `-rwxrwxr-x` (executable) |
| **Size** | `7,492 bytes` |
| **Dry-run support** | ✅ `--dry-run` flag |

### Rollback script thực hiện (theo thứ tự):
1. Pre-flight: verify backup files + checksums + git tag tồn tại
2. Stop PM2 `happylife-backend`
3. Restore Git code từ tag `phase-3.1-stable`
4. Restore `dev.db` từ `dev.db.backup_phase3_1_stable`
5. Restore `schema.prisma` từ `schema.prisma.backup_phase3_1_stable`
6. `npx prisma generate`
7. `npx prisma validate`
8. `PRAGMA integrity_check`
9. `PRAGMA foreign_key_check`
10. Git status verification
11. **Chỉ restart PM2 nếu TOÀN BỘ verification PASS**
12. **Nếu bất kỳ bước nào FAIL → KHÔNG restart PM2 → exit 1**

### Script KHÔNG bao giờ:
- ❌ Xóa backup files
- ❌ Overwrite backup files
- ❌ Delete git tag
- ❌ Reset backup file

---

## 7. DRY-RUN VERIFICATION

```
=== Step 0: Pre-flight checks ===
[PASS] Database backup exists
[PASS] Schema backup exists
[PASS] Database backup checksum verified
[PASS] Schema backup checksum verified
[PASS] Git tag 'phase-3.1-stable' exists → f8e2d6e

[PASS] All pre-flight checks passed

=== DRY-RUN COMPLETE: All checks passed. Safe to run without --dry-run ===
```

---

## 8. ROLLBACK COMMAND

```bash
# Dry-run (kiểm tra, không thay đổi gì):
bash /var/www/wasypro/scripts/rollback_phase3_2.sh --dry-run

# Rollback thật:
bash /var/www/wasypro/scripts/rollback_phase3_2.sh
```

---

## PHASE 3.1 ROLLBACK CHECKPOINT: PASS

## READY FOR PHASE 3.2: YES

```
ROLLBACK COMMAND:
bash /var/www/wasypro/scripts/rollback_phase3_2.sh
```
