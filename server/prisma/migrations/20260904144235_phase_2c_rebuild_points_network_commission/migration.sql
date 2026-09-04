/*
  Warnings:

  - Added the required column `updatedAt` to the `Commission` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "BusinessIdSequence" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "nextVal" INTEGER NOT NULL DEFAULT 10001
);

-- CreateTable
CREATE TABLE "SystemPolicyConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedBy" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0'
);

-- CreateTable
CREATE TABLE "SPointTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "points" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "isQualifying" BOOLEAN NOT NULL DEFAULT false,
    "snapshotBalance" REAL NOT NULL DEFAULT 0,
    "policyVersion" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SPointTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommissionPriceRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productType" TEXT NOT NULL,
    "minPrice" REAL,
    "maxPrice" REAL,
    "rate" REAL,
    "commType" TEXT NOT NULL,
    "rankRequired" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WholesaleOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buyerUserId" TEXT NOT NULL,
    "totalMachines" INTEGER NOT NULL,
    "discountRate" REAL NOT NULL,
    "basePriceType" TEXT NOT NULL DEFAULT 'PRICE',
    "priceTotal" REAL NOT NULL,
    "listPriceTotal" REAL,
    "finalAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "shippedAt" DATETIME,
    "completedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WholesaleOrder_buyerUserId_fkey" FOREIGN KEY ("buyerUserId") REFERENCES "User" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WholesaleOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wholesaleOrderId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "unitListPrice" REAL,
    "discountRate" REAL NOT NULL,
    "discountedPrice" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    CONSTRAINT "WholesaleOrderItem_wholesaleOrderId_fkey" FOREIGN KEY ("wholesaleOrderId") REFERENCES "WholesaleOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WholesaleOrderItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RankHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fromRank" TEXT,
    "toRank" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "triggeredBy" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RankHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Commission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "rateSnapshot" REAL,
    "rankSnapshot" TEXT,
    "baseAmount" REAL,
    "policyRef" TEXT,
    "metadata" TEXT,
    "ruleKey" TEXT,
    "policyVersion" TEXT,
    "role" TEXT,
    "basePoints" REAL,
    "earnedPoints" REAL,
    "earnedMoney" REAL,
    CONSTRAINT "Commission_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Commission_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Commission" ("amount", "createdAt", "id", "orderId", "receiverId", "status", "type") SELECT "amount", "createdAt", "id", "orderId", "receiverId", "status", "type" FROM "Commission";
DROP TABLE "Commission";
ALTER TABLE "new_Commission" RENAME TO "Commission";
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "totalAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderType" TEXT NOT NULL DEFAULT 'RETAIL',
    "isSelfBuy" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "customerId", "id", "status", "totalAmount") SELECT "createdAt", "customerId", "id", "status", "totalAmount" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE TABLE "new_OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "unitCommissionPts" REAL NOT NULL DEFAULT 0,
    "lineCommissionPts" REAL NOT NULL DEFAULT 0,
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
    "commissionPoints" REAL NOT NULL DEFAULT 0,
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
    "commissionPoints" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Service" ("categoryId", "description", "group", "id", "imageUrl", "name", "price") SELECT "categoryId", "description", "group", "id", "imageUrl", "name", "price" FROM "Service";
DROP TABLE "Service";
ALTER TABLE "new_Service" RENAME TO "Service";
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
    "sponsorUserId" TEXT,
    "isSystemParticipant" BOOLEAN NOT NULL DEFAULT false,
    "participantAt" DATETIME,
    "qualifyingPoints" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "User_sponsorUserId_fkey" FOREIGN KEY ("sponsorUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User" ("userId") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("bankInfo", "cccd", "createdAt", "fullName", "id", "mustChangePassword", "note", "parentId", "password", "phone", "role", "status", "tier", "updatedAt", "userId") SELECT "bankInfo", "cccd", "createdAt", "fullName", "id", "mustChangePassword", "note", "parentId", "password", "phone", "role", "status", "tier", "updatedAt", "userId" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX "User_businessId_key" ON "User"("businessId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SystemPolicyConfig_key_key" ON "SystemPolicyConfig"("key");
