-- Phase 3.1: NPP Package System Foundation
-- Applied via prisma db push (SQLite) on 2026-09-21
-- This migration file documents the schema changes for audit trail

-- 1. Extend User table with NPP fields
ALTER TABLE " User\ ADD COLUMN \isNpp\ BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE \User\ ADD COLUMN \nppActivatedAt\ DATETIME;

-- 2. Extend RankHistory table with NPP fields
ALTER TABLE \RankHistory\ ADD COLUMN \nppPurchaseId\ TEXT;
ALTER TABLE \RankHistory\ ADD COLUMN \effectiveFrom\ DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE \RankHistory\ ADD COLUMN \effectiveTo\ DATETIME;
CREATE INDEX \RankHistory_userId_effectiveFrom_idx\ ON \RankHistory\(\userId\, \effectiveFrom\);

-- 3. Create NppPackage table
CREATE TABLE \NppPackage\ (
 \id\ TEXT NOT NULL PRIMARY KEY,
 \code\ TEXT NOT NULL,
 \name\ TEXT NOT NULL,
 \description\ TEXT,
 \grossPrice\ BIGINT NOT NULL,
 \defaultDiscount\ INTEGER NOT NULL DEFAULT 0,
 \assignedRank\ TEXT NOT NULL DEFAULT 'AMBASSADOR',
 \isActive\ BOOLEAN NOT NULL DEFAULT true,
 \createdAt\ DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 \updatedAt\ DATETIME NOT NULL
);
CREATE UNIQUE INDEX \NppPackage_code_key\ ON \NppPackage\(\code\);

-- 4. Create NppPackageItem table
CREATE TABLE \NppPackageItem\ (
 \id\ TEXT NOT NULL PRIMARY KEY,
 \packageId\ TEXT NOT NULL,
 \productId\ TEXT NOT NULL,
 \quantity\ INTEGER NOT NULL DEFAULT 1,
 \note\ TEXT,
 CONSTRAINT \NppPackageItem_packageId_fkey\ FOREIGN KEY (\packageId\) REFERENCES \NppPackage\ (\id\) ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT \NppPackageItem_productId_fkey\ FOREIGN KEY (\productId\) REFERENCES \Product\ (\id\) ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX \NppPackageItem_packageId_productId_key\ ON \NppPackageItem\(\packageId\, \productId\);
CREATE INDEX \NppPackageItem_packageId_idx\ ON \NppPackageItem\(\packageId\);
CREATE INDEX \NppPackageItem_productId_idx\ ON \NppPackageItem\(\productId\);

-- 5. Create NppPurchase table
CREATE TABLE \NppPurchase\ (
 \id\ TEXT NOT NULL PRIMARY KEY,
 \code\ TEXT NOT NULL,
 \userId\ TEXT NOT NULL,
 \userCode\ TEXT NOT NULL,
 \packageId\ TEXT NOT NULL,
 \grossPrice\ BIGINT NOT NULL,
 \discountRateBps\ INTEGER NOT NULL DEFAULT 0,
 \discountAmount\ BIGINT NOT NULL DEFAULT 0,
 \netPayableAmount\ BIGINT NOT NULL,
 \depositAmount\ BIGINT NOT NULL DEFAULT 0,
 \paidAmount\ BIGINT NOT NULL DEFAULT 0,
 \remainingAmount\ BIGINT NOT NULL DEFAULT 0,
 \actualPaidAmount\ BIGINT NOT NULL,
 \depositAt\ DATETIME,
 \depositNote\ TEXT,
 \isPaidInFull\ BOOLEAN NOT NULL DEFAULT false,
 \paidInFullAt\ DATETIME,
 \paidInFullConfirmedBy\ TEXT,
 \status\ TEXT NOT NULL DEFAULT 'NEW',
 \settlementStatus\ TEXT NOT NULL DEFAULT 'PENDING',
 \activatedAt\ DATETIME,
 \assignedRank\ TEXT NOT NULL,
 \allocatedBusinessId\ TEXT,
 \packageSnapshot\ TEXT NOT NULL,
 \shippingAddress\ TEXT,
 \recipientPhone\ TEXT,
 \recipientName\ TEXT,
 \createdAt\ DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 \updatedAt\ DATETIME NOT NULL,
 CONSTRAINT \NppPurchase_userId_fkey\ FOREIGN KEY (\userId\) REFERENCES \User\ (\id\) ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT \NppPurchase_packageId_fkey\ FOREIGN KEY (\packageId\) REFERENCES \NppPackage\ (\id\) ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX \NppPurchase_code_key\ ON \NppPurchase\(\code\);
CREATE INDEX \NppPurchase_userId_idx\ ON \NppPurchase\(\userId\);
CREATE INDEX \NppPurchase_packageId_idx\ ON \NppPurchase\(\packageId\);
CREATE INDEX \NppPurchase_status_idx\ ON \NppPurchase\(\status\);
CREATE INDEX \NppPurchase_isPaidInFull_idx\ ON \NppPurchase\(\isPaidInFull\);
CREATE INDEX \NppPurchase_settlementStatus_idx\ ON \NppPurchase\(\settlementStatus\);

-- 6. Create NppPayment table
CREATE TABLE \NppPayment\ (
 \id\ TEXT NOT NULL PRIMARY KEY,
 \purchaseId\ TEXT NOT NULL,
 \amount\ BIGINT NOT NULL,
 \paymentMethod\ TEXT NOT NULL DEFAULT 'BANK_TRANSFER',
 \referenceCode\ TEXT,
 \note\ TEXT,
 \confirmedBy\ TEXT NOT NULL,
 \paidAt\ DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 \createdAt\ DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT \NppPayment_purchaseId_fkey\ FOREIGN KEY (\purchaseId\) REFERENCES \NppPurchase\ (\id\) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX \NppPayment_purchaseId_idx\ ON \NppPayment\(\purchaseId\);

-- 7. Create NppCommission table
CREATE TABLE \NppCommission\ (
 \id\ TEXT NOT NULL PRIMARY KEY,
 \purchaseId\ TEXT NOT NULL,
 \beneficiaryId\ TEXT NOT NULL,
 \beneficiaryUserId\ TEXT NOT NULL,
 \level\ INTEGER NOT NULL,
 \rateBps\ INTEGER NOT NULL,
 \commissionBase\ BIGINT NOT NULL,
 \earnedMoney\ BIGINT NOT NULL,
 \earnedPoints\ INTEGER NOT NULL,
 \rankAtCommission\ TEXT NOT NULL,
 \policyVersion\ TEXT NOT NULL DEFAULT 'NPP-v1.0',
 \status\ TEXT NOT NULL DEFAULT 'PENDING_CLEARING',
 \createdAt\ DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 \settledAt\ DATETIME,
 \availableAt\ DATETIME,
 \paidAt\ DATETIME,
 \periodId\ TEXT,
 CONSTRAINT \NppCommission_purchaseId_fkey\ FOREIGN KEY (\purchaseId\) REFERENCES \NppPurchase\ (\id\) ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT \NppCommission_beneficiaryId_fkey\ FOREIGN KEY (\beneficiaryId\) REFERENCES \User\ (\id\) ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT \NppCommission_periodId_fkey\ FOREIGN KEY (\periodId\) REFERENCES \CommissionPeriod\ (\id\) ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX \NppCommission_purchaseId_level_key\ ON \NppCommission\(\purchaseId\, \level\);
CREATE INDEX \NppCommission_beneficiaryId_idx\ ON \NppCommission\(\beneficiaryId\);
CREATE INDEX \NppCommission_status_idx\ ON \NppCommission\(\status\);
CREATE INDEX \NppCommission_periodId_idx\ ON \NppCommission\(\periodId\);
