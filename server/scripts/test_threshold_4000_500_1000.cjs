/**
 * TEST SUITE: THRESHOLD CROSSING 4.000 + 500 + 1.000 CP
 * Verifies exact business rules:
 * - Order 1 (4.000 CP): 4.000 * 20% = 800 CP (800.000 VND), NO SELF, QP = 4.000, no BID
 * - Order 2 (500 CP): 500 * 20% = 100 CP (100.000 VND), NO SELF, QP = 4.500, no BID
 * - Order 3 (1.000 CP): Qualifying 500 * 20% = 100 CP, Excess 500 * 10% = 50 CP. Total = 150 CP (150.000 VND).
 *                       NO SELF on crossing order. User promoted to AMBASSADOR, BID assigned.
 * - Total across 3 orders = 800 + 100 + 150 = 1.050 CP (1.050.000 VND)
 * - Order 4 (2.000 CP post-BID): User gets SELF 20% = 400 CP, Sponsor gets DIRECT_WITH_ID 10% = 200 CP.
 */

const { PrismaClient } = require("@prisma/client");
const assert = require("assert");

const prisma = new PrismaClient();
const { executeOrderSettlement } = require("../index.js");

async function runTest() {
  console.log("==================================================================");
  console.log("   TEST: 4.000 + 500 + 1.000 CP THRESHOLD CROSSING VERIFICATION   ");
  console.log("==================================================================");

  const timestamp = Date.now();
  const createdUserIds = [];
  const createdCustomerIds = [];
  const createdServiceIds = [];
  const createdOrderIds = [];

  let passedTests = 0;
  function pass(msg) {
    passedTests++;
    console.log(`  ✅ PASS: ${msg}`);
  }

  try {
    // 1. Setup Sponsor A (Ambassador with BID)
    const userA = await prisma.user.create({
      data: {
        userId: `TEST_SPONSOR_A_${timestamp}`,
        fullName: "Sponsor Ambassador A",
        phone: `0981${Math.floor(100000 + Math.random() * 900000)}`,
        role: "ctv",
        rank: "AMBASSADOR",
        rankStatus: "ACTIVE_RANK",
        businessId: `WK-A${timestamp.toString().slice(-4)}`,
        isSystemParticipant: true,
      }
    });
    createdUserIds.push(userA.id);

    // 2. Setup Customer B (Participant, no BID, priorQP = 0)
    const userB = await prisma.user.create({
      data: {
        userId: `TEST_BUYER_B_${timestamp}`,
        fullName: "Buyer Candidate B",
        phone: `0982${Math.floor(100000 + Math.random() * 900000)}`,
        role: "customer",
        rank: "CUSTOMER",
        rankStatus: "NOT_QUALIFIED",
        businessId: null,
        isSystemParticipant: true,
        qualifyingPoints: 0,
        parentId: userA.userId,
      }
    });
    createdUserIds.push(userB.id);

    // 3. Customer record linking B to sponsor A
    const customerB = await prisma.customer.create({
      data: {
        fullName: userB.fullName,
        phone: userB.phone,
        sourceCtvId: userA.userId,
        sponsorUserId: userA.id,
        linkedUserId: userB.id,
        expiresAt: new Date(Date.now() + 30 * 86400000),
      }
    });
    createdCustomerIds.push(customerB.id);

    // 4. Products/Services with specific CP
    const cat = await prisma.serviceCategory.findFirst();
    const catId = cat ? cat.id : (await prisma.serviceCategory.create({ data: { name: `Cat_${timestamp}` } })).id;

    const svcC4000 = await prisma.service.create({
      data: {
        name: `Service 4000 CP ${timestamp}`,
        price: 40000000,
        categoryId: catId,
        commissionPoints: 4000,
      }
    });
    createdServiceIds.push(svcC4000.id);

    const svcC500 = await prisma.service.create({
      data: {
        name: `Service 500 CP ${timestamp}`,
        price: 5000000,
        categoryId: catId,
        commissionPoints: 500,
      }
    });
    createdServiceIds.push(svcC500.id);

    const svcC1000 = await prisma.service.create({
      data: {
        name: `Service 1000 CP ${timestamp}`,
        price: 10000000,
        categoryId: catId,
        commissionPoints: 1000,
      }
    });
    createdServiceIds.push(svcC1000.id);

    const svcC2000 = await prisma.service.create({
      data: {
        name: `Service 2000 CP ${timestamp}`,
        price: 20000000,
        categoryId: catId,
        commissionPoints: 2000,
      }
    });
    createdServiceIds.push(svcC2000.id);

    // -------------------------------------------------------------
    // STEP 1: ORDER 1 = 4.000 CP (Prior QP = 0, After = 4.000 CP)
    // -------------------------------------------------------------
    console.log("\n--- STEP 1: ORDER 1 = 4.000 CP ---");
    const order1 = await prisma.order.create({
      data: {
        customerId: customerB.id,
        ordererUserId: userA.id,
        purchaseType: "CUSTOMER_PURCHASE",
        isSelfBuy: false,
        totalAmount: svcC4000.price,
        status: "COMPLETED",
        items: {
          create: [{
            serviceId: svcC4000.id,
            amount: svcC4000.price,
            qty: 1,
            unitCommissionPts: 4000,
            lineCommissionPts: 4000,
          }]
        }
      }
    });
    createdOrderIds.push(order1.id);

    const res1 = await executeOrderSettlement(order1.id);
    assert(res1.success === true, "Order 1 settlement succeeded");
    assert(res1.activated === false, "User B not yet activated (4.000 < 5.000)");

    const comms1 = await prisma.commission.findMany({ where: { orderId: order1.id } });
    const directNoId1 = comms1.find(c => c.ruleKey === "AMBASSADOR_DIRECT_NO_ID");
    assert(directNoId1, "Order 1 generated AMBASSADOR_DIRECT_NO_ID");
    assert(directNoId1.receiverId === userA.userId, "Receiver is Sponsor A");
    assert(directNoId1.basePoints === 4000, "Base points = 4000");
    assert(directNoId1.rateSnapshot === 0.20, "Rate snapshot = 20%");
    assert(directNoId1.earnedPoints === 800, `Earned points = 800 CP, got ${directNoId1.earnedPoints}`);
    assert(directNoId1.earnedMoney === 800000, "Earned money = 800,000 VND");

    const selfComm1 = comms1.find(c => c.role === "SELF");
    assert(!selfComm1, "Order 1 has NO SELF commission");

    const userB_after1 = await prisma.user.findUnique({ where: { id: userB.id } });
    assert(userB_after1.qualifyingPoints === 4000, `User B QP = 4000, got ${userB_after1.qualifyingPoints}`);
    assert(userB_after1.businessId === null, "User B has no businessId yet");
    pass("Order 1 (4.000 CP): Sponsor gets 800 CP (20%), NO SELF, QP = 4.000, no BID");

    // -------------------------------------------------------------
    // STEP 2: ORDER 2 = 500 CP (Prior QP = 4.000, After = 4.500 CP)
    // -------------------------------------------------------------
    console.log("\n--- STEP 2: ORDER 2 = 500 CP ---");
    const order2 = await prisma.order.create({
      data: {
        customerId: customerB.id,
        ordererUserId: userA.id,
        purchaseType: "CUSTOMER_PURCHASE",
        isSelfBuy: false,
        totalAmount: svcC500.price,
        status: "COMPLETED",
        items: {
          create: [{
            serviceId: svcC500.id,
            amount: svcC500.price,
            qty: 1,
            unitCommissionPts: 500,
            lineCommissionPts: 500,
          }]
        }
      }
    });
    createdOrderIds.push(order2.id);

    const res2 = await executeOrderSettlement(order2.id);
    assert(res2.success === true, "Order 2 settlement succeeded");
    assert(res2.activated === false, "User B not yet activated (4.500 < 5.000)");

    const comms2 = await prisma.commission.findMany({ where: { orderId: order2.id } });
    const directNoId2 = comms2.find(c => c.ruleKey === "AMBASSADOR_DIRECT_NO_ID");
    assert(directNoId2, "Order 2 generated AMBASSADOR_DIRECT_NO_ID");
    assert(directNoId2.receiverId === userA.userId, "Receiver is Sponsor A");
    assert(directNoId2.basePoints === 500, "Base points = 500");
    assert(directNoId2.rateSnapshot === 0.20, "Rate snapshot = 20%");
    assert(directNoId2.earnedPoints === 100, `Earned points = 100 CP, got ${directNoId2.earnedPoints}`);
    assert(directNoId2.earnedMoney === 100000, "Earned money = 100,000 VND");

    const selfComm2 = comms2.find(c => c.role === "SELF");
    assert(!selfComm2, "Order 2 has NO SELF commission");

    const userB_after2 = await prisma.user.findUnique({ where: { id: userB.id } });
    assert(userB_after2.qualifyingPoints === 4500, `User B QP = 4500, got ${userB_after2.qualifyingPoints}`);
    assert(userB_after2.businessId === null, "User B has no businessId yet");
    pass("Order 2 (500 CP): Sponsor gets 100 CP (20%), NO SELF, QP = 4.500, no BID");

    // -------------------------------------------------------------
    // STEP 3: ORDER 3 = 1.000 CP (Prior QP = 4.500, Crossing threshold 5.000 -> 5.500 CP)
    // -------------------------------------------------------------
    console.log("\n--- STEP 3: ORDER 3 = 1.000 CP (THRESHOLD CROSSING) ---");
    const order3 = await prisma.order.create({
      data: {
        customerId: customerB.id,
        ordererUserId: userA.id,
        purchaseType: "CUSTOMER_PURCHASE",
        isSelfBuy: false,
        totalAmount: svcC1000.price,
        status: "COMPLETED",
        items: {
          create: [{
            serviceId: svcC1000.id,
            amount: svcC1000.price,
            qty: 1,
            unitCommissionPts: 1000,
            lineCommissionPts: 1000,
          }]
        }
      }
    });
    createdOrderIds.push(order3.id);

    const res3 = await executeOrderSettlement(order3.id);
    assert(res3.success === true, "Order 3 settlement succeeded");
    assert(res3.activated === true, "User B activated on crossing order!");
    assert(res3.allocatedBusinessId.startsWith("WK-"), "Business ID allocated to User B");

    const comms3 = await prisma.commission.findMany({ where: { orderId: order3.id } });

    // NO DIRECT_NO_ID on split order
    const directNoId3 = comms3.find(c => c.ruleKey.includes("DIRECT_NO_ID"));
    assert(!directNoId3, "DIRECT_NO_ID is NOT created on threshold-crossing order (replaced by SPLIT)");

    // NO SELF on threshold-crossing order
    const selfComm3 = comms3.find(c => c.role === "SELF");
    assert(!selfComm3, "NO SELF commission on threshold-crossing order (priorBusinessId was null)");

    // Qualifying Split: 500 CP * 20% = 100 CP
    const qualComm3 = comms3.find(c => c.ruleKey === "AMBASSADOR_QUALIFYING_SPLIT");
    assert(qualComm3, "AMBASSADOR_QUALIFYING_SPLIT created");
    assert(qualComm3.basePoints === 500, `Qualifying basePoints = 500 (5000 - 4500), got ${qualComm3.basePoints}`);
    assert(qualComm3.rateSnapshot === 0.20, "Qualifying rate = 20%");
    assert(qualComm3.earnedPoints === 100, `Qualifying earnedPoints = 100 CP, got ${qualComm3.earnedPoints}`);
    assert(qualComm3.earnedMoney === 100000, "Qualifying earnedMoney = 100,000 VND");

    // Excess Split: 500 CP * 10% = 50 CP
    const excessComm3 = comms3.find(c => c.ruleKey === "AMBASSADOR_EXCESS_SPLIT");
    assert(excessComm3, "AMBASSADOR_EXCESS_SPLIT created");
    assert(excessComm3.basePoints === 500, `Excess basePoints = 500 (1000 - 500), got ${excessComm3.basePoints}`);
    assert(excessComm3.rateSnapshot === 0.10, "Excess rate = 10%");
    assert(excessComm3.earnedPoints === 50, `Excess earnedPoints = 50 CP, got ${excessComm3.earnedPoints}`);
    assert(excessComm3.earnedMoney === 50000, "Excess earnedMoney = 50,000 VND");

    const order3TotalCommission = qualComm3.earnedPoints + excessComm3.earnedPoints;
    assert(order3TotalCommission === 150, `Order 3 total commission = 150 CP, got ${order3TotalCommission}`);
    pass("Order 3 (1.000 CP): Split into 500@20% (100 CP) + 500@10% (50 CP) = 150 CP (150,000 VND)");

    // Check user promotion in database
    const userB_after3 = await prisma.user.findUnique({ where: { id: userB.id } });
    assert(userB_after3.qualifyingPoints === 5500, `User B QP = 5500, got ${userB_after3.qualifyingPoints}`);
    assert(userB_after3.rank === "AMBASSADOR", "User B promoted to AMBASSADOR");
    assert(userB_after3.rankStatus === "ACTIVE_RANK", "User B rankStatus is ACTIVE_RANK");
    assert(userB_after3.businessId !== null, `User B has Business ID: ${userB_after3.businessId}`);
    pass("User B successfully promoted to AMBASSADOR with Business ID after Order 3");

    // TOTAL COMMISSION CHECK ACROSS ALL 3 ORDERS
    const totalComms123 = directNoId1.earnedPoints + directNoId2.earnedPoints + order3TotalCommission;
    assert(totalComms123 === 1050, `Total across 3 orders must be 1.050 CP, got ${totalComms123}`);
    pass("TOTAL COMMISSION ACROSS ALL 3 ORDERS: 800 + 100 + 150 = 1.050 CP (1,050,000 VND) EXACTLY MATCHED");

    // -------------------------------------------------------------
    // STEP 4: ORDER 4 = 2.000 CP (POST-BID ORDER)
    // Placed after B has BID -> B gets SELF (20%), A gets DIRECT_WITH_ID (10%)
    // -------------------------------------------------------------
    console.log("\n--- STEP 4: ORDER 4 = 2.000 CP (POST-BID ORDER) ---");
    const order4 = await prisma.order.create({
      data: {
        customerId: customerB.id,
        ordererUserId: userB.id,
        purchaseType: "CUSTOMER_PURCHASE",
        isSelfBuy: true,
        totalAmount: svcC2000.price,
        status: "COMPLETED",
        items: {
          create: [{
            serviceId: svcC2000.id,
            amount: svcC2000.price,
            qty: 1,
            unitCommissionPts: 2000,
            lineCommissionPts: 2000,
          }]
        }
      }
    });
    createdOrderIds.push(order4.id);

    const res4 = await executeOrderSettlement(order4.id);
    assert(res4.success === true, "Order 4 settlement succeeded");

    const comms4 = await prisma.commission.findMany({ where: { orderId: order4.id } });

    // B gets SELF: 2.000 * 20% = 400 CP
    const selfComm4 = comms4.find(c => c.receiverId === userB.userId && c.role === "SELF");
    assert(selfComm4, "Order 4 generated SELF commission for B");
    assert(selfComm4.ruleKey === "AMBASSADOR_SELF_BUY", "Rule is AMBASSADOR_SELF_BUY");
    assert(selfComm4.rateSnapshot === 0.20, "SELF rate = 20%");
    assert(selfComm4.basePoints === 2000, "SELF base points = 2000");
    assert(selfComm4.earnedPoints === 400, `SELF earned points = 400 CP, got ${selfComm4.earnedPoints}`);
    assert(selfComm4.earnedMoney === 400000, "SELF earned money = 400,000 VND");

    // A gets DIRECT_WITH_ID: 2.000 * 10% = 200 CP
    const directWithId4 = comms4.find(c => c.receiverId === userA.userId && c.role === "DIRECT_SPONSOR");
    assert(directWithId4, "Order 4 generated DIRECT_SPONSOR for A");
    assert(directWithId4.ruleKey === "AMBASSADOR_DIRECT_WITH_ID", "Rule is AMBASSADOR_DIRECT_WITH_ID");
    assert(directWithId4.rateSnapshot === 0.10, "DIRECT_WITH_ID rate = 10%");
    assert(directWithId4.basePoints === 2000, "DIRECT base points = 2000");
    assert(directWithId4.earnedPoints === 200, `DIRECT earned points = 200 CP, got ${directWithId4.earnedPoints}`);
    assert(directWithId4.earnedMoney === 200000, "DIRECT earned money = 200,000 VND");

    pass("Order 4 (Post-BID): Buyer B gets SELF = 400 CP (20%), Sponsor A gets DIRECT_WITH_ID = 200 CP (10%)");

    console.log("\n==================================================================");
    console.log(`   ALL ${passedTests} ASSERTIONS PASSED SUCCESSFULLY!             `);
    console.log("==================================================================");
  } finally {
    console.log("\n[CLEANUP] Cleaning up test data...");
    for (const orderId of createdOrderIds) {
      await prisma.commission.deleteMany({ where: { orderId } }).catch(() => {});
      await prisma.commissionProcessing.deleteMany({ where: { orderId } }).catch(() => {});
      await prisma.orderItem.deleteMany({ where: { orderId } }).catch(() => {});
      await prisma.sPointTransaction.deleteMany({ where: { orderId } }).catch(() => {});
      await prisma.order.deleteMany({ where: { id: orderId } }).catch(() => {});
    }
    for (const customerId of createdCustomerIds) {
      await prisma.customer.deleteMany({ where: { id: customerId } }).catch(() => {});
    }
    for (const userId of createdUserIds) {
      const u = await prisma.user.findUnique({ where: { id: userId } });
      if (u) {
        await prisma.rankHistory.deleteMany({ where: { userId: u.userId } }).catch(() => {});
      }
      await prisma.user.deleteMany({ where: { id: userId } }).catch(() => {});
    }
    for (const svcId of createdServiceIds) {
      await prisma.service.deleteMany({ where: { id: svcId } }).catch(() => {});
    }
    console.log("[CLEANUP] Complete.");
  }
}

runTest()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ TEST FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
