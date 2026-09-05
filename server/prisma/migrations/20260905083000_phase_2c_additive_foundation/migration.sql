-- Phase 2C Additive Foundation Migration
-- FINAL SPEC v3.6: Point/Money Integer Representation & Policy Audit History

-- 1. Create new models
CREATE TABLE IF NOT EXISTS "CommissionProcessing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "processedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "policyVersion" TEXT NOT NULL DEFAULT '1.0.0',
    CONSTRAINT "CommissionProcessing_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "CommissionProcessing_orderId_key" ON "CommissionProcessing"("orderId");

CREATE TABLE IF NOT EXISTS "BusinessIdSequence" (
    "id" INTEGER NOT NULL PRIMARY KEY DEFAULT 1,
    "nextVal" INTEGER NOT NULL DEFAULT 10000
);

CREATE TABLE IF NOT EXISTS "SystemPolicyConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "updatedBy" TEXT,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "SystemPolicyConfig_key_key" ON "SystemPolicyConfig"("key");

CREATE TABLE IF NOT EXISTS "SystemPolicyAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "policyId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SystemPolicyAuditLog_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "SystemPolicyConfig" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 2. Add columns to existing tables
-- Service
ALTER TABLE "Service" ADD COLUMN "commissionPoints" INTEGER NOT NULL DEFAULT 0;

-- Product
ALTER TABLE "Product" ADD COLUMN "commissionPoints" INTEGER NOT NULL DEFAULT 0;

-- OrderItem
ALTER TABLE "OrderItem" ADD COLUMN "unitCommissionPts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "OrderItem" ADD COLUMN "lineCommissionPts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "OrderItem" ADD COLUMN "productId" TEXT;

-- Order
ALTER TABLE "Order" ADD COLUMN "purchaseType" TEXT NOT NULL DEFAULT 'CUSTOMER_PURCHASE';
ALTER TABLE "Order" ADD COLUMN "ordererUserId" TEXT;

-- Customer
ALTER TABLE "Customer" ADD COLUMN "sponsorUserId" TEXT;
ALTER TABLE "Customer" ADD COLUMN "linkedUserId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_linkedUserId_key" ON "Customer"("linkedUserId");

-- User
ALTER TABLE "User" ADD COLUMN "isSystemParticipant" BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "businessId" TEXT;
ALTER TABLE "User" ADD COLUMN "participantAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "qualifyingPoints" INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS "User_businessId_key" ON "User"("businessId");

-- Commission
ALTER TABLE "Commission" ADD COLUMN "ruleKey" TEXT;
ALTER TABLE "Commission" ADD COLUMN "policyVersion" TEXT;
ALTER TABLE "Commission" ADD COLUMN "role" TEXT;
ALTER TABLE "Commission" ADD COLUMN "basePoints" INTEGER;
ALTER TABLE "Commission" ADD COLUMN "earnedPoints" INTEGER;
ALTER TABLE "Commission" ADD COLUMN "earnedMoney" INTEGER;

-- SPointTransaction
ALTER TABLE "SPointTransaction" ADD COLUMN "isQualifying" BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE "SPointTransaction" ADD COLUMN "snapshotBalance" REAL;
ALTER TABLE "SPointTransaction" ADD COLUMN "policyVersion" TEXT;
CREATE TABLE IF NOT EXISTS "CommissionPointAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemName" TEXT,
    "oldValue" INTEGER,
    "newValue" INTEGER NOT NULL,
    "actor" TEXT,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
