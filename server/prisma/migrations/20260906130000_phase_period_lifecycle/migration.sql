-- Period Lifecycle Migration
-- Phase: Period Lifecycle (CommissionPeriod + PeriodPolicyConfig + PeriodPolicyAuditLog + PeriodCloseAudit)
-- Additive only — backward compatible with all existing data

-- 1. CommissionPeriod: Kỳ hoa hồng
CREATE TABLE "CommissionPeriod" (
    "id"         TEXT NOT NULL PRIMARY KEY,
    "periodName" TEXT NOT NULL,
    "startAt"    DATETIME NOT NULL,
    "endAt"      DATETIME NOT NULL,
    "status"     TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy"  TEXT NOT NULL,
    "closedAt"   DATETIME,
    "closedBy"   TEXT
);

-- 2. PeriodPolicyConfig: Policy gắn theo kỳ
CREATE TABLE "PeriodPolicyConfig" (
    "id"            TEXT NOT NULL PRIMARY KEY,
    "periodId"      TEXT NOT NULL,
    "key"           TEXT NOT NULL,
    "value"         TEXT NOT NULL,
    "description"   TEXT,
    "version"       TEXT NOT NULL,
    "updatedBy"     TEXT,
    "createdAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     DATETIME NOT NULL,
    "effectiveFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PeriodPolicyConfig_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "CommissionPeriod" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE ("periodId", "key")
);

-- 3. PeriodPolicyAuditLog: Audit log thay đổi policy
CREATE TABLE "PeriodPolicyAuditLog" (
    "id"            TEXT NOT NULL PRIMARY KEY,
    "policyId"      TEXT NOT NULL,
    "periodId"      TEXT NOT NULL,
    "key"           TEXT NOT NULL,
    "oldValue"      TEXT,
    "newValue"      TEXT NOT NULL,
    "version"       TEXT NOT NULL,
    "updatedBy"     TEXT,
    "updatedAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason"        TEXT,
    "effectiveFrom" DATETIME,
    CONSTRAINT "PeriodPolicyAuditLog_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "PeriodPolicyConfig" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 4. PeriodCloseAudit: Audit khi chốt kỳ
CREATE TABLE "PeriodCloseAudit" (
    "id"                TEXT NOT NULL PRIMARY KEY,
    "periodId"          TEXT NOT NULL,
    "closedBy"          TEXT NOT NULL,
    "closedAt"          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "oldStatus"         TEXT NOT NULL,
    "newStatus"         TEXT NOT NULL,
    "totalOrders"       INTEGER NOT NULL DEFAULT 0,
    "totalCommissions"  INTEGER NOT NULL DEFAULT 0,
    "totalEarnedPoints" INTEGER NOT NULL DEFAULT 0,
    "totalEarnedMoney"  INTEGER NOT NULL DEFAULT 0,
    "metadata"          TEXT,
    CONSTRAINT "PeriodCloseAudit_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "CommissionPeriod" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PeriodCloseAudit_periodId_key" ON "PeriodCloseAudit"("periodId");

-- 5. Add periodId (nullable) to Order
ALTER TABLE "Order" ADD COLUMN "periodId" TEXT REFERENCES "CommissionPeriod"("id");

-- 6. Add periodId (nullable) to Commission
ALTER TABLE "Commission" ADD COLUMN "periodId" TEXT REFERENCES "CommissionPeriod"("id");

-- 7. Add periodId and policySetVersion (nullable) to CommissionProcessing
ALTER TABLE "CommissionProcessing" ADD COLUMN "periodId" TEXT REFERENCES "CommissionPeriod"("id");
ALTER TABLE "CommissionProcessing" ADD COLUMN "policySetVersion" TEXT;
