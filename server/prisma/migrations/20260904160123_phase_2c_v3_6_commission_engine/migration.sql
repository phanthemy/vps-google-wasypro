/*
  Warnings:

  - You are about to drop the column `basePoints` on the `Commission` table. All the data in the column will be lost.
  - You are about to drop the column `earnedMoney` on the `Commission` table. All the data in the column will be lost.
  - You are about to drop the column `earnedPoints` on the `Commission` table. All the data in the column will be lost.
  - You are about to drop the column `policyVersion` on the `Commission` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `Commission` table. All the data in the column will be lost.
  - You are about to drop the column `ruleKey` on the `Commission` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Commission` table. All the data in the column will be lost.
  - You are about to drop the column `lineCommissionPts` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `unitCommissionPts` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `commissionPoints` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isQualifying` on the `SPointTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `policyVersion` on the `SPointTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `snapshotBalance` on the `SPointTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `commissionPoints` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `SystemPolicyConfig` table. All the data in the column will be lost.
  - You are about to drop the column `participantAt` on the `User` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "CommissionProcessing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "processedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "policyVersion" TEXT NOT NULL DEFAULT '1.0.0',
    CONSTRAINT "CommissionProcessing_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BusinessIdSequence" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "nextVal" INTEGER NOT NULL DEFAULT 10000
);
INSERT INTO "new_BusinessIdSequence" ("id", "nextVal") SELECT "id", "nextVal" FROM "BusinessIdSequence";
DROP TABLE "BusinessIdSequence";
ALTER TABLE "new_BusinessIdSequence" RENAME TO "BusinessIdSequence";
CREATE TABLE "new_Commission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rateSnapshot" REAL,
    "rankSnapshot" TEXT,
    "baseAmount" REAL,
    "policyRef" TEXT,
    "metadata" TEXT,
    CONSTRAINT "Commission_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Commission_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Commission" ("amount", "baseAmount", "createdAt", "id", "metadata", "orderId", "policyRef", "rankSnapshot", "rateSnapshot", "receiverId", "status", "type") SELECT "amount", "baseAmount", "createdAt", "id", "metadata", "orderId", "policyRef", "rankSnapshot", "rateSnapshot", "receiverId", "status", "type" FROM "Commission";
DROP TABLE "Commission";
ALTER TABLE "new_Commission" RENAME TO "Commission";
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "sourceCtvId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "sponsorUserId" TEXT,
    "linkedUserId" TEXT,
    CONSTRAINT "Customer_sourceCtvId_fkey" FOREIGN KEY ("sourceCtvId") REFERENCES "User" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Customer_sponsorUserId_fkey" FOREIGN KEY ("sponsorUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Customer_linkedUserId_fkey" FOREIGN KEY ("linkedUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Customer" ("expiresAt", "fullName", "id", "phone", "registeredAt", "sourceCtvId", "status", "updatedAt") SELECT "expiresAt", "fullName", "id", "phone", "registeredAt", "sourceCtvId", "status", "updatedAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE UNIQUE INDEX "Customer_linkedUserId_key" ON "Customer"("linkedUserId");
CREATE UNIQUE INDEX "Customer_phone_sourceCtvId_key" ON "Customer"("phone", "sourceCtvId");
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "totalAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderType" TEXT NOT NULL DEFAULT 'RETAIL',
    "isSelfBuy" BOOLEAN NOT NULL DEFAULT false,
    "purchaseType" TEXT NOT NULL DEFAULT 'CUSTOMER_PURCHASE',
    "ordererUserId" TEXT,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_ordererUserId_fkey" FOREIGN KEY ("ordererUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "customerId", "id", "isSelfBuy", "orderType", "status", "totalAmount") SELECT "createdAt", "customerId", "id", "isSelfBuy", "orderType", "status", "totalAmount" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE TABLE "new_OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_OrderItem" ("amount", "id", "orderId", "qty", "serviceId") SELECT "amount", "id", "orderId", "qty", "serviceId" FROM "OrderItem";
DROP TABLE "OrderItem";
ALTER TABLE "new_OrderItem" RENAME TO "OrderItem";
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "price" REAL NOT NULL DEFAULT 0,
    "originalPrice" REAL,
    "rating" REAL NOT NULL DEFAULT 5,
    "reviewsCount" INTEGER NOT NULL DEFAULT 0,
    "image" TEXT,
    "gallery" TEXT,
    "description" TEXT,
    "specs" TEXT,
    "isHot" BOOLEAN NOT NULL DEFAULT false,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "promotion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("categoryId", "createdAt", "description", "gallery", "id", "image", "isHot", "isNew", "originalPrice", "price", "promotion", "rating", "reviewsCount", "slug", "specs", "stock", "title", "updatedAt") SELECT "categoryId", "createdAt", "description", "gallery", "id", "image", "isHot", "isNew", "originalPrice", "price", "promotion", "rating", "reviewsCount", "slug", "specs", "stock", "title", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE TABLE "new_SPointTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "points" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SPointTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SPointTransaction" ("createdAt", "description", "id", "orderId", "points", "type", "userId") SELECT "createdAt", "description", "id", "orderId", "points", "type", "userId" FROM "SPointTransaction";
DROP TABLE "SPointTransaction";
ALTER TABLE "new_SPointTransaction" RENAME TO "SPointTransaction";
CREATE TABLE "new_Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "group" TEXT,
    "price" REAL NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "productType" TEXT,
    "listPrice" REAL,
    CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Service" ("categoryId", "description", "group", "id", "imageUrl", "listPrice", "name", "price", "productType") SELECT "categoryId", "description", "group", "id", "imageUrl", "listPrice", "name", "price", "productType" FROM "Service";
DROP TABLE "Service";
ALTER TABLE "new_Service" RENAME TO "Service";
CREATE TABLE "new_SystemPolicyConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SystemPolicyConfig" ("description", "id", "key", "updatedAt", "value", "version") SELECT "description", "id", "key", "updatedAt", "value", "version" FROM "SystemPolicyConfig";
DROP TABLE "SystemPolicyConfig";
ALTER TABLE "new_SystemPolicyConfig" RENAME TO "SystemPolicyConfig";
CREATE UNIQUE INDEX "SystemPolicyConfig_key_key" ON "SystemPolicyConfig"("key");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT '123456',
    "cccd" TEXT,
    "bankInfo" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'SILVER',
    "role" TEXT NOT NULL DEFAULT 'ctv',
    "parentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "note" TEXT,
    "rank" TEXT,
    "rankStatus" TEXT,
    "rankAchievedAt" DATETIME,
    "regionCode" TEXT,
    "sPoints" REAL NOT NULL DEFAULT 0,
    "wholesaleEligible" BOOLEAN NOT NULL DEFAULT false,
    "totalMachinesBought" INTEGER NOT NULL DEFAULT 0,
    "rankActivationMethod" TEXT,
    "rankActivatedBy" TEXT,
    "businessId" TEXT,
    "isSystemParticipant" BOOLEAN NOT NULL DEFAULT false,
    "qualifyingPoints" REAL NOT NULL DEFAULT 0,
    "sponsorUserId" TEXT,
    CONSTRAINT "User_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User" ("userId") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("bankInfo", "businessId", "cccd", "createdAt", "fullName", "id", "isSystemParticipant", "mustChangePassword", "note", "parentId", "password", "phone", "qualifyingPoints", "rank", "rankAchievedAt", "rankActivatedBy", "rankActivationMethod", "rankStatus", "regionCode", "role", "sPoints", "sponsorUserId", "status", "tier", "totalMachinesBought", "updatedAt", "userId", "wholesaleEligible") SELECT "bankInfo", "businessId", "cccd", "createdAt", "fullName", "id", "isSystemParticipant", "mustChangePassword", "note", "parentId", "password", "phone", "qualifyingPoints", "rank", "rankAchievedAt", "rankActivatedBy", "rankActivationMethod", "rankStatus", "regionCode", "role", "sPoints", "sponsorUserId", "status", "tier", "totalMachinesBought", "updatedAt", "userId", "wholesaleEligible" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX "User_businessId_key" ON "User"("businessId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CommissionProcessing_orderId_key" ON "CommissionProcessing"("orderId");
