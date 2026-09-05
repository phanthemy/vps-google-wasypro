/**
 * PHASE 2C-6 COMMISSION ENGINE CORE VERIFICATION TEST SUITE
 * Tests all 16 business rule requirements and scenarios.
 */

const { PrismaClient } = require("@prisma/client");
const assert = require("assert");

const prisma = new PrismaClient();
const { executeOrderSettlement } = require("../index.js");

async function runPhase2C6Tests() {
  console.log("=================================================");
  console.log("   PHASE 2C-6 COMMISSION ENGINE CORE TEST SUITE   ");
  console.log("=================================================");

  // 0. PRE-CHECK DATA PRESERVATION
  const baseUsers = await prisma.user.count();
  const baseCustomers = await prisma.customer.count();
  const baseOrders = await prisma.order.count();
  const baseCommissions = await prisma.commission.count();
  const baseProcessing = await prisma.commissionProcessing.count();
  const seqBefore = await prisma.businessIdSequence.findUnique({ where: { id: 1 } });
  const initialNextVal = seqBefore ? seqBefore.nextVal : 10001;

  console.log(`[PRE-CHECK] Users: ${baseUsers}, Customers: ${baseCustomers}, Orders: ${baseOrders}, Commissions: ${baseCommissions}, nextVal: ${initialNextVal}`);

  const createdUserIds = [];
  const createdUsers = [];
  const createdCustomerIds = [];
  const createdServiceIds = [];
  const createdOrderIds = [];

  let passedTests = 0;
  function pass(msg) {
    passedTests++;
    console.log(`  ✅ PASS: ${msg}`);
  }

  try {
    const timestamp = Date.now();

    // -------------------------------------------------------------
    // FIXTURE SETUP
    // -------------------------------------------------------------
    console.log("\n--- SETTING UP FIXTURES ---");

    // 1. Upstream Managers Chain: D3 -> D2 -> D1 -> F0
    const userD3 = await prisma.user.create({
      data: {
        userId: `TEST_D3_${timestamp}`,
        fullName: "Upstream Manager D3",
        phone: `0981${Math.floor(100000 + Math.random() * 900000)}`,
        role: "ctv",
        rank: "SALES_MANAGER",
        rankStatus: "ACTIVE_RANK",
        businessId: `WK-73003`,
        isSystemParticipant: true,
      }
    });
    createdUserIds.push(userD3.id);
    createdUsers.push({ id: userD3.id, userId: userD3.userId });

    const userD2 = await prisma.user.create({
      data: {
        userId: `TEST_D2_${timestamp}`,
        fullName: "Upstream Manager D2",
        phone: `0982${Math.floor(100000 + Math.random() * 900000)}`,
        role: "ctv",
        rank: "SALES_MANAGER",
        rankStatus: "ACTIVE_RANK",
        businessId: `WK-73002`,
        parentId: userD3.userId,
        isSystemParticipant: true,
      }
    });
    createdUserIds.push(userD2.id);
    createdUsers.push({ id: userD2.id, userId: userD2.userId });

    const userD1 = await prisma.user.create({
      data: {
        userId: `TEST_D1_${timestamp}`,
        fullName: "Upstream Manager D1",
        phone: `0983${Math.floor(100000 + Math.random() * 900000)}`,
        role: "ctv",
        rank: "SALES_MANAGER",
        rankStatus: "ACTIVE_RANK",
        businessId: `WK-73001`,
        parentId: userD2.userId,
        isSystemParticipant: true,
      }
    });
    createdUserIds.push(userD1.id);
    createdUsers.push({ id: userD1.id, userId: userD1.userId });

    // 2. F0 Members
    const userAmbassador = await prisma.user.create({
      data: {
        userId: `TEST_AMB_${timestamp}`,
        fullName: "Ambassador F0",
        phone: `0984${Math.floor(100000 + Math.random() * 900000)}`,
        role: "ctv",
        rank: "AMBASSADOR",
        rankStatus: "ACTIVE_RANK",
        businessId: `WK-71001`,
        parentId: userD1.userId,
        isSystemParticipant: true,
        qualifyingPoints: 5000,
      }
    });
    createdUserIds.push(userAmbassador.id);
    createdUsers.push({ id: userAmbassador.id, userId: userAmbassador.userId });

    const userManager = await prisma.user.create({
      data: {
        userId: `TEST_MGR_${timestamp}`,
        fullName: "Manager F0",
        phone: `0985${Math.floor(100000 + Math.random() * 900000)}`,
        role: "ctv",
        rank: "SALES_MANAGER",
        rankStatus: "ACTIVE_RANK",
        businessId: `WK-71002`,
        isSystemParticipant: true,
        qualifyingPoints: 5000,
      }
    });
    createdUserIds.push(userManager.id);
    createdUsers.push({ id: userManager.id, userId: userManager.userId });

    const userDirector = await prisma.user.create({
      data: {
        userId: `TEST_DIR_${timestamp}`,
        fullName: "Director F0",
        phone: `0986${Math.floor(100000 + Math.random() * 900000)}`,
        role: "ctv",
        rank: "SALES_DIRECTOR",
        rankStatus: "ACTIVE_RANK",
        businessId: `WK-71003`,
        isSystemParticipant: true,
        qualifyingPoints: 5000,
      }
    });
    createdUserIds.push(userDirector.id);
    createdUsers.push({ id: userDirector.id, userId: userDirector.userId });

    // 3. Direct Sponsors
    const sponsorAmb = await prisma.user.create({
      data: {
        userId: `TEST_SP_AMB_${timestamp}`,
        fullName: "Direct Sponsor Ambassador",
        phone: `0987${Math.floor(100000 + Math.random() * 900000)}`,
        role: "ctv",
        rank: "AMBASSADOR",
        rankStatus: "ACTIVE_RANK",
        businessId: `WK-72001`,
        isSystemParticipant: true,
      }
    });
    createdUserIds.push(sponsorAmb.id);
    createdUsers.push({ id: sponsorAmb.id, userId: sponsorAmb.userId });

    const sponsorMgr = await prisma.user.create({
      data: {
        userId: `TEST_SP_MGR_${timestamp}`,
        fullName: "Direct Sponsor Manager",
        phone: `0988${Math.floor(100000 + Math.random() * 900000)}`,
        role: "ctv",
        rank: "SALES_MANAGER",
        rankStatus: "ACTIVE_RANK",
        businessId: `WK-72002`,
        isSystemParticipant: true,
      }
    });
    createdUserIds.push(sponsorMgr.id);
    createdUsers.push({ id: sponsorMgr.id, userId: sponsorMgr.userId });

    const sponsorDir = await prisma.user.create({
      data: {
        userId: `TEST_SP_DIR_${timestamp}`,
        fullName: "Direct Sponsor Director",
        phone: `0989${Math.floor(100000 + Math.random() * 900000)}`,
        role: "ctv",
        rank: "SALES_DIRECTOR",
        rankStatus: "ACTIVE_RANK",
        businessId: `WK-72003`,
        isSystemParticipant: true,
      }
    });
    createdUserIds.push(sponsorDir.id);
    createdUsers.push({ id: sponsorDir.id, userId: sponsorDir.userId });

    // 4. Director parent for unconfigured test
    const userDirectorParent = await prisma.user.create({
      data: {
        userId: `TEST_DIR_P_${timestamp}`,
        fullName: "Director Parent",
        phone: `0971${Math.floor(100000 + Math.random() * 900000)}`,
        role: "ctv",
        rank: "SALES_DIRECTOR",
        rankStatus: "ACTIVE_RANK",
        businessId: `WK-73010`,
        isSystemParticipant: true,
      }
    });
    createdUserIds.push(userDirectorParent.id);
    createdUsers.push({ id: userDirectorParent.id, userId: userDirectorParent.userId });

    const userChildOfDir = await prisma.user.create({
      data: {
        userId: `TEST_DIR_C_${timestamp}`,
        fullName: "Child of Director",
        phone: `0972${Math.floor(100000 + Math.random() * 900000)}`,
        role: "ctv",
        rank: "AMBASSADOR",
        rankStatus: "ACTIVE_RANK",
        businessId: `WK-73011`,
        parentId: userDirectorParent.userId,
        isSystemParticipant: true,
        qualifyingPoints: 5000,
      }
    });
    createdUserIds.push(userChildOfDir.id);
    createdUsers.push({ id: userChildOfDir.id, userId: userChildOfDir.userId });

    // 5. Test Services
    const defaultCat = await prisma.serviceCategory.findFirst();
    const catId = defaultCat ? defaultCat.id : (await prisma.serviceCategory.create({ data: { name: "Test Category" } })).id;

    const svc5000 = await prisma.service.create({
      data: {
        name: `Máy lọc nước 5000 CP ${timestamp}`,
        price: 50000000,
        commissionPoints: 5000,
        categoryId: catId,
      }
    });
    createdServiceIds.push(svc5000.id);

    const svc2000 = await prisma.service.create({
      data: {
        name: `Máy lọc nước 2000 CP ${timestamp}`,
        price: 20000000,
        commissionPoints: 2000,
        categoryId: catId,
      }
    });
    createdServiceIds.push(svc2000.id);

    const svc1000 = await prisma.service.create({
      data: {
        name: `Lõi lọc 1000 CP ${timestamp}`,
        price: 1000000,
        commissionPoints: 1000,
        categoryId: catId,
      }
    });
    createdServiceIds.push(svc1000.id);

    console.log("Fixtures created successfully.");

    // -------------------------------------------------------------
    // TEST 1: SELF Ambassador (20%) + UPSTREAM D1 & D2 + F3 NO COMM
    // -------------------------------------------------------------
    console.log("\n--- TEST 1: SELF Ambassador (20%) + Upstream D1/D2 ---");
    const custSelfAmb = await prisma.customer.create({ data: { expiresAt: new Date(Date.now() + 30 * 86400000), 
        fullName: "Cust Self Amb",
        phone: userAmbassador.phone,
        sourceCtvId: userD1.userId,
        sponsorUserId: userD1.id,
        linkedUserId: userAmbassador.id,
      }
    });
    createdCustomerIds.push(custSelfAmb.id);

    const order1 = await prisma.order.create({
      data: {
        customerId: custSelfAmb.id,
        ordererUserId: userAmbassador.id,
        purchaseType: "SELF_PURCHASE",
        isSelfBuy: true,
        totalAmount: svc5000.price,
        status: "COMPLETED",
        items: {
          create: [{
            serviceId: svc5000.id,
            amount: svc5000.price,
            qty: 1,
            unitCommissionPts: 5000,
            lineCommissionPts: 5000,
          }]
        }
      }
    });
    createdOrderIds.push(order1.id);

    const res1 = await executeOrderSettlement(order1.id);
    assert(res1.success === true, "Settlement 1 success");

    const comms1 = await prisma.commission.findMany({ where: { orderId: order1.id } });
    assert(comms1.length === 3, `Expected 3 commissions (SELF, D1, D2), got ${comms1.length}`);

    const selfComm = comms1.find(c => c.role === "SELF");
    assert(selfComm, "SELF commission exists");
    assert(selfComm.receiverId === userAmbassador.userId, "SELF receiver is Ambassador");
    assert(selfComm.ruleKey === "AMBASSADOR_SELF_BUY", "SELF ruleKey is AMBASSADOR_SELF_BUY");
    assert(selfComm.rateSnapshot === 0.20, "SELF rateSnapshot is 0.20");
    assert(selfComm.basePoints === 5000, "SELF basePoints is 5000");
    assert(selfComm.earnedPoints === 1000, "SELF earnedPoints is 1000 CP (5000 * 0.20)");
    assert(selfComm.earnedMoney === 1000000, "SELF earnedMoney is 1,000,000 VND");
    assert(selfComm.policyVersion === "1.0.0", "SELF policyVersion is 1.0.0");
    pass("SELF Ambassador: 5000 * 20% = 1000 CP (1,000,000 VND)");

    // Upstream D1
    const d1Comm = comms1.find(c => c.role === "UPSTREAM_D1");
    assert(d1Comm, "UPSTREAM_D1 exists");
    assert(d1Comm.receiverId === userD1.userId, "D1 receiver is userD1");
    assert(d1Comm.ruleKey === "MANAGER_F1_PURCHASE", "D1 ruleKey is MANAGER_F1_PURCHASE");
    assert(d1Comm.rateSnapshot === 0.10, "D1 rateSnapshot is 0.10");
    assert(d1Comm.basePoints === 5000, "D1 basePoints is 5000");
    assert(d1Comm.earnedPoints === 500, "D1 earnedPoints is 500 CP (5000 * 0.10)");
    assert(d1Comm.earnedMoney === 500000, "D1 earnedMoney is 500,000 VND");
    pass("UPSTREAM D1: Manager receives 10% F1 purchase (500 CP / 500,000 VND)");

    // Upstream D2
    const d2Comm = comms1.find(c => c.role === "UPSTREAM_D2");
    assert(d2Comm, "UPSTREAM_D2 exists");
    assert(d2Comm.receiverId === userD2.userId, "D2 receiver is userD2");
    assert(d2Comm.ruleKey === "MANAGER_F2_PURCHASE", "D2 ruleKey is MANAGER_F2_PURCHASE");
    assert(d2Comm.rateSnapshot === 0.05, "D2 rateSnapshot is 0.05");
    assert(d2Comm.basePoints === 5000, "D2 basePoints is 5000");
    assert(d2Comm.earnedPoints === 250, "D2 earnedPoints is 250 CP (5000 * 0.05)");
    assert(d2Comm.earnedMoney === 250000, "D2 earnedMoney is 250,000 VND");
    pass("UPSTREAM D2: Manager receives 5% F2 purchase (250 CP / 250,000 VND)");

    // Upstream D3 check
    const d3Comm = comms1.find(c => c.receiverId === userD3.userId);
    assert(!d3Comm, "D3 receives NO commission (depth <= 2 enforced)");
    pass("UPSTREAM F3: D3 received NO commission (strictly capped at depth 2)");

    // -------------------------------------------------------------
    // TEST 2: SELF Manager (25%)
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: SELF Manager (25%) ---");
    const custSelfMgr = await prisma.customer.create({ data: { expiresAt: new Date(Date.now() + 30 * 86400000), 
        fullName: "Cust Self Mgr",
        phone: userManager.phone,
        sourceCtvId: sponsorDir.userId,
        sponsorUserId: sponsorDir.id,
        linkedUserId: userManager.id,
      }
    });
    createdCustomerIds.push(custSelfMgr.id);

    const order2 = await prisma.order.create({
      data: {
        customerId: custSelfMgr.id,
        ordererUserId: userManager.id,
        purchaseType: "SELF_PURCHASE",
        isSelfBuy: true,
        totalAmount: svc5000.price,
        status: "COMPLETED",
        items: {
          create: [{
            serviceId: svc5000.id,
            amount: svc5000.price,
            qty: 1,
            unitCommissionPts: 5000,
            lineCommissionPts: 5000,
          }]
        }
      }
    });
    createdOrderIds.push(order2.id);

    const res2 = await executeOrderSettlement(order2.id);
    assert(res2.success === true, "Settlement 2 success");

    const comms2 = await prisma.commission.findMany({ where: { orderId: order2.id, role: "SELF" } });
    assert(comms2.length === 1, "Exactly 1 SELF commission");
    assert(comms2[0].ruleKey === "MANAGER_SELF_BUY", "Rule key is MANAGER_SELF_BUY");
    assert(comms2[0].rateSnapshot === 0.25, "Rate snapshot is 0.25");
    assert(comms2[0].earnedPoints === 1250, "Earned points is 1250 (5000 * 0.25)");
    assert(comms2[0].earnedMoney === 1250000, "Earned money is 1,250,000 VND");
    pass("SELF Manager: 5000 * 25% = 1250 CP (1,250,000 VND)");

    // -------------------------------------------------------------
    // TEST 3: SELF Director (30%)
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: SELF Director (30%) ---");
    const custSelfDir = await prisma.customer.create({ data: { expiresAt: new Date(Date.now() + 30 * 86400000), 
        fullName: "Cust Self Dir",
        phone: userDirector.phone,
        sourceCtvId: sponsorDir.userId,
        sponsorUserId: sponsorDir.id,
        linkedUserId: userDirector.id,
      }
    });
    createdCustomerIds.push(custSelfDir.id);

    const order3 = await prisma.order.create({
      data: {
        customerId: custSelfDir.id,
        ordererUserId: userDirector.id,
        purchaseType: "SELF_PURCHASE",
        isSelfBuy: true,
        totalAmount: svc5000.price,
        status: "COMPLETED",
        items: {
          create: [{
            serviceId: svc5000.id,
            amount: svc5000.price,
            qty: 1,
            unitCommissionPts: 5000,
            lineCommissionPts: 5000,
          }]
        }
      }
    });
    createdOrderIds.push(order3.id);

    const res3 = await executeOrderSettlement(order3.id);
    assert(res3.success === true, "Settlement 3 success");

    const comms3 = await prisma.commission.findMany({ where: { orderId: order3.id, role: "SELF" } });
    assert(comms3.length === 1, "Exactly 1 SELF commission");
    assert(comms3[0].ruleKey === "DIRECTOR_SELF_BUY", "Rule key is DIRECTOR_SELF_BUY");
    assert(comms3[0].rateSnapshot === 0.30, "Rate snapshot is 0.30");
    assert(comms3[0].earnedPoints === 1500, "Earned points is 1500 (5000 * 0.30)");
    assert(comms3[0].earnedMoney === 1500000, "Earned money is 1,500,000 VND");
    pass("SELF Director: 5000 * 30% = 1500 CP (1,500,000 VND)");

    // -------------------------------------------------------------
    // TEST 4: DIRECT_NO_ID Customer chưa join hệ thống (Retail)
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: DIRECT_NO_ID Customer Retail ---");
    // Ambassador sponsor
    const custRetailAmb = await prisma.customer.create({ data: { expiresAt: new Date(Date.now() + 30 * 86400000), 
        fullName: "Retail Cust 1",
        phone: "0911000111",
        sourceCtvId: sponsorAmb.userId,
        sponsorUserId: sponsorAmb.id,
        linkedUserId: null,
      }
    });
    createdCustomerIds.push(custRetailAmb.id);

    const order4a = await prisma.order.create({
      data: {
        customerId: custRetailAmb.id,
        ordererUserId: sponsorAmb.id,
        purchaseType: "CUSTOMER_PURCHASE",
        isSelfBuy: false,
        totalAmount: svc1000.price,
        status: "COMPLETED",
        items: {
          create: [{
            serviceId: svc1000.id,
            amount: svc1000.price,
            qty: 1,
            unitCommissionPts: 1000,
            lineCommissionPts: 1000,
          }]
        }
      }
    });
    createdOrderIds.push(order4a.id);

    const res4a = await executeOrderSettlement(order4a.id);
    assert(res4a.success === true, "Settlement 4a success");

    const comms4a = await prisma.commission.findMany({ where: { orderId: order4a.id } });
    assert(comms4a.length === 1, "Exactly 1 commission for retail sale");
    assert(comms4a[0].receiverId === sponsorAmb.userId, "Receiver is sponsor Ambassador");
    assert(comms4a[0].role === "DIRECT_SPONSOR", "Role is DIRECT_SPONSOR");
    assert(comms4a[0].ruleKey === "AMBASSADOR_DIRECT_NO_ID", "RuleKey is AMBASSADOR_DIRECT_NO_ID");
    assert(comms4a[0].rateSnapshot === 0.20, "Rate is 0.20");
    assert(comms4a[0].earnedPoints === 200, "Earned points is 200 (1000 * 0.20)");
    assert(comms4a[0].earnedMoney === 200000, "Earned money is 200,000 VND");
    pass("DIRECT_NO_ID Ambassador: 1000 * 20% = 200 CP (200,000 VND)");

    // Manager sponsor
    const custRetailMgr = await prisma.customer.create({ data: { expiresAt: new Date(Date.now() + 30 * 86400000), 
        fullName: "Retail Cust 2",
        phone: "0911000222",
        sourceCtvId: sponsorMgr.userId,
        sponsorUserId: sponsorMgr.id,
        linkedUserId: null,
      }
    });
    createdCustomerIds.push(custRetailMgr.id);

    const order4b = await prisma.order.create({
      data: {
        customerId: custRetailMgr.id,
        ordererUserId: sponsorMgr.id,
        purchaseType: "CUSTOMER_PURCHASE",
        isSelfBuy: false,
        totalAmount: svc1000.price,
        status: "COMPLETED",
        items: {
          create: [{
            serviceId: svc1000.id,
            amount: svc1000.price,
            qty: 1,
            unitCommissionPts: 1000,
            lineCommissionPts: 1000,
          }]
        }
      }
    });
    createdOrderIds.push(order4b.id);

    await executeOrderSettlement(order4b.id);
    const comms4b = await prisma.commission.findMany({ where: { orderId: order4b.id } });
    assert(comms4b[0].ruleKey === "MANAGER_DIRECT_NO_ID", "RuleKey is MANAGER_DIRECT_NO_ID");
    assert(comms4b[0].rateSnapshot === 0.25, "Rate is 0.25");
    assert(comms4b[0].earnedPoints === 250, "Earned points is 250 (1000 * 0.25)");
    pass("DIRECT_NO_ID Manager: 1000 * 25% = 250 CP (250,000 VND)");

    // Director sponsor
    const custRetailDir = await prisma.customer.create({ data: { expiresAt: new Date(Date.now() + 30 * 86400000), 
        fullName: "Retail Cust 3",
        phone: "0911000333",
        sourceCtvId: sponsorDir.userId,
        sponsorUserId: sponsorDir.id,
        linkedUserId: null,
      }
    });
    createdCustomerIds.push(custRetailDir.id);

    const order4c = await prisma.order.create({
      data: {
        customerId: custRetailDir.id,
        ordererUserId: sponsorDir.id,
        purchaseType: "CUSTOMER_PURCHASE",
        isSelfBuy: false,
        totalAmount: svc1000.price,
        status: "COMPLETED",
        items: {
          create: [{
            serviceId: svc1000.id,
            amount: svc1000.price,
            qty: 1,
            unitCommissionPts: 1000,
            lineCommissionPts: 1000,
          }]
        }
      }
    });
    createdOrderIds.push(order4c.id);

    await executeOrderSettlement(order4c.id);
    const comms4c = await prisma.commission.findMany({ where: { orderId: order4c.id } });
    assert(comms4c[0].ruleKey === "DIRECTOR_DIRECT_NO_ID", "RuleKey is DIRECTOR_DIRECT_NO_ID");
    assert(comms4c[0].rateSnapshot === 0.30, "Rate is 0.30");
    assert(comms4c[0].earnedPoints === 300, "Earned points is 300 (1000 * 0.30)");
    pass("DIRECT_NO_ID Director: 1000 * 30% = 300 CP (300,000 VND)");

    // -------------------------------------------------------------
    // TEST 5: DIRECT_NO_ID Customer đã join nhưng chưa vượt threshold
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: DIRECT_NO_ID Customer chưa vượt threshold ---");
    const userUnreached = await prisma.user.create({
      data: {
        userId: `TEST_UNREACHED_${timestamp}`,
        fullName: "Participant Unreached",
        phone: `0975${Math.floor(100000 + Math.random() * 900000)}`,
        role: "customer",
        isSystemParticipant: true,
        qualifyingPoints: 1000,
        businessId: null,
      }
    });
    createdUserIds.push(userUnreached.id);
    createdUsers.push({ id: userUnreached.id, userId: userUnreached.userId });

    const custUnreached = await prisma.customer.create({ data: { expiresAt: new Date(Date.now() + 30 * 86400000), 
        fullName: "Cust Unreached",
        phone: userUnreached.phone,
        sourceCtvId: sponsorAmb.userId,
        sponsorUserId: sponsorAmb.id,
        linkedUserId: userUnreached.id,
      }
    });
    createdCustomerIds.push(custUnreached.id);

    // Order has 2000 CP -> 1000 + 2000 = 3000 < 5000 threshold
    const order5 = await prisma.order.create({
      data: {
        customerId: custUnreached.id,
        ordererUserId: sponsorAmb.id,
        purchaseType: "CUSTOMER_PURCHASE",
        isSelfBuy: false,
        totalAmount: svc2000.price,
        status: "COMPLETED",
        items: {
          create: [{
            serviceId: svc2000.id,
            amount: svc2000.price,
            qty: 1,
            unitCommissionPts: 2000,
            lineCommissionPts: 2000,
          }]
        }
      }
    });
    createdOrderIds.push(order5.id);

    const res5 = await executeOrderSettlement(order5.id);
    assert(res5.activated === false, "User not activated (3000 < 5000)");

    const comms5 = await prisma.commission.findMany({ where: { orderId: order5.id } });
    assert(comms5.length === 1, "Only 1 commission (DIRECT_NO_ID)");
    assert(comms5[0].ruleKey === "AMBASSADOR_DIRECT_NO_ID", "RuleKey is AMBASSADOR_DIRECT_NO_ID");
    assert(comms5[0].rateSnapshot === 0.20, "Rate is 0.20");
    assert(comms5[0].earnedPoints === 400, "Earned points is 400 (2000 * 0.20)");
    assert(comms5[0].type === "DIRECT", "Type is DIRECT");

    // Verify user qualifyingPoints updated to 3000
    const checkUserUnreached = await prisma.user.findUnique({ where: { id: userUnreached.id } });
    assert(checkUserUnreached.qualifyingPoints === 3000, "Qualifying points increased to 3000");
    assert(checkUserUnreached.businessId === null, "BusinessId remains null");
    pass("DIRECT_NO_ID participant unreached: 2000 * 20% = 400 CP, qp = 3000, no split");

    // -------------------------------------------------------------
    // TEST 6: DIRECT_WITH_ID Customer đã có ID
    // -------------------------------------------------------------
    console.log("\n--- TEST 6: DIRECT_WITH_ID Customer đã có ID ---");
    const userWithId = await prisma.user.create({
      data: {
        userId: `TEST_WITH_ID_${timestamp}`,
        fullName: "Customer With ID",
        phone: `0976${Math.floor(100000 + Math.random() * 900000)}`,
        role: "customer",
        rank: "AMBASSADOR",
        businessId: "WK-79999",
        isSystemParticipant: true,
        qualifyingPoints: 5000,
      }
    });
    createdUserIds.push(userWithId.id);
    createdUsers.push({ id: userWithId.id, userId: userWithId.userId });

    const custWithId = await prisma.customer.create({ data: { expiresAt: new Date(Date.now() + 30 * 86400000), 
        fullName: "Cust With ID",
        phone: userWithId.phone,
        sourceCtvId: sponsorAmb.userId,
        sponsorUserId: sponsorAmb.id,
        linkedUserId: userWithId.id,
      }
    });
    createdCustomerIds.push(custWithId.id);

    const order6 = await prisma.order.create({
      data: {
        customerId: custWithId.id,
        ordererUserId: sponsorAmb.id,
        purchaseType: "CUSTOMER_PURCHASE",
        isSelfBuy: false,
        totalAmount: svc2000.price,
        status: "COMPLETED",
        items: {
          create: [{
            serviceId: svc2000.id,
            amount: svc2000.price,
            qty: 1,
            unitCommissionPts: 2000,
            lineCommissionPts: 2000,
          }]
        }
      }
    });
    createdOrderIds.push(order6.id);

    await executeOrderSettlement(order6.id);
    const comms6 = await prisma.commission.findMany({ where: { orderId: order6.id } });
    assert(comms6.length === 1, "Exactly 1 commission for DIRECT_WITH_ID");
    assert(comms6[0].ruleKey === "AMBASSADOR_DIRECT_WITH_ID", "RuleKey is AMBASSADOR_DIRECT_WITH_ID");
    assert(comms6[0].rateSnapshot === 0.10, "Rate is 10% (0.10)");
    assert(comms6[0].earnedPoints === 200, "Earned points is 200 CP (2000 * 0.10)");
    assert(comms6[0].earnedMoney === 200000, "Earned money is 200,000 VND");
    pass("DIRECT_WITH_ID: 2000 * 10% = 200 CP (200,000 VND)");

    // -------------------------------------------------------------
    // TEST 7: CRITICAL WORKED TEST: SPLIT 4.900 + 2.000
    // -------------------------------------------------------------
    console.log("\n--- TEST 7: CRITICAL WORKED TEST - SPLIT 4.900 + 2.000 ---");
    // Customer participant: currentQP = 4900, businessId = null
    const userSplit = await prisma.user.create({
      data: {
        userId: `TEST_SPLIT_${timestamp}`,
        fullName: "User Split Candidate",
        phone: `0977${Math.floor(100000 + Math.random() * 900000)}`,
        role: "customer",
        rank: "CUSTOMER",
        rankStatus: "NOT_QUALIFIED",
        businessId: null,
        isSystemParticipant: true,
        qualifyingPoints: 4900,
      }
    });
    createdUserIds.push(userSplit.id);
    createdUsers.push({ id: userSplit.id, userId: userSplit.userId });

    const custSplit = await prisma.customer.create({ data: { expiresAt: new Date(Date.now() + 30 * 86400000), 
        fullName: "Cust Split Candidate",
        phone: userSplit.phone,
        sourceCtvId: sponsorAmb.userId,
        sponsorUserId: sponsorAmb.id,
        linkedUserId: userSplit.id,
      }
    });
    createdCustomerIds.push(custSplit.id);

    // Order total CP = 2000
    const order7 = await prisma.order.create({
      data: {
        customerId: custSplit.id,
        ordererUserId: sponsorAmb.id,
        purchaseType: "CUSTOMER_PURCHASE",
        isSelfBuy: false,
        totalAmount: svc2000.price,
        status: "COMPLETED",
        items: {
          create: [{
            serviceId: svc2000.id,
            amount: svc2000.price,
            qty: 1,
            unitCommissionPts: 2000,
            lineCommissionPts: 2000,
          }]
        }
      }
    });
    createdOrderIds.push(order7.id);

    const res7 = await executeOrderSettlement(order7.id);
    assert(res7.success === true, "Settlement 7 success");
    assert(res7.activated === true, "User activated into Ambassador!");
    assert(res7.allocatedBusinessId === `WK-${initialNextVal}`, `Allocated Business ID is WK-${initialNextVal}`);

    const comms7 = await prisma.commission.findMany({
      where: { orderId: order7.id },
      orderBy: { createdAt: "asc" }
    });

    // Verify DIRECT_NO_ID is NOT created
    const directNoId = comms7.find(c => c.ruleKey.includes("DIRECT_NO_ID"));
    assert(!directNoId, "DIRECT_NO_ID = 0 (completely replaced by SPLIT)");
    pass("DIRECT_NO_ID = 0 when SPLIT is triggered");

    // Verify Qualifying part
    const qualComm = comms7.find(c => c.ruleKey === "AMBASSADOR_QUALIFYING_SPLIT");
    assert(qualComm, "AMBASSADOR_QUALIFYING_SPLIT commission created");
    assert(qualComm.receiverId === sponsorAmb.userId, "Receiver is direct sponsor");
    assert(qualComm.role === "DIRECT_SPONSOR", "Role is DIRECT_SPONSOR");
    assert(qualComm.type === "SPLIT", "Type is SPLIT");
    assert(qualComm.basePoints === 100, "Qualifying basePoints is exactly 100 (5000 - 4900)");
    assert(qualComm.rateSnapshot === 0.20, "Qualifying rateSnapshot is 0.20 (20%)");
    assert(qualComm.earnedPoints === 20, "Qualifying earnedPoints is exactly 20 CP (100 * 20%)");
    assert(qualComm.earnedMoney === 20000, "Qualifying earnedMoney is 20,000 VND");
    pass("SPLIT Qualifying part: 100 * 20% = 20 CP (20,000 VND)");

    // Verify Excess part
    const excessComm = comms7.find(c => c.ruleKey === "AMBASSADOR_EXCESS_SPLIT");
    assert(excessComm, "AMBASSADOR_EXCESS_SPLIT commission created");
    assert(excessComm.receiverId === sponsorAmb.userId, "Receiver is direct sponsor");
    assert(excessComm.role === "DIRECT_SPONSOR", "Role is DIRECT_SPONSOR");
    assert(excessComm.type === "SPLIT", "Type is SPLIT");
    assert(excessComm.basePoints === 1900, "Excess basePoints is exactly 1900 (2000 - 100)");
    assert(excessComm.rateSnapshot === 0.10, "Excess rateSnapshot is 0.10 (10%)");
    assert(excessComm.earnedPoints === 190, "Excess earnedPoints is exactly 190 CP (1900 * 10%)");
    assert(excessComm.earnedMoney === 190000, "Excess earnedMoney is 190,000 VND");
    pass("SPLIT Excess part: 1900 * 10% = 190 CP (190,000 VND)");

    const totalEarnedSplit = qualComm.earnedPoints + excessComm.earnedPoints;
    assert(totalEarnedSplit === 210, `Total earned points is 210 CP, got ${totalEarnedSplit}`);
    pass("WORKED TEST PASSED: 100*20% + 1900*10% = 210 CP (210,000 VND)");

    // Verify user activation state in DB
    const checkSplitUser = await prisma.user.findUnique({ where: { id: userSplit.id } });
    assert(checkSplitUser.qualifyingPoints === 6900, "User qualifyingPoints is 6900 (4900 + 2000)");
    assert(checkSplitUser.rank === "AMBASSADOR", "User rank promoted to AMBASSADOR");
    assert(checkSplitUser.businessId === `WK-${initialNextVal}`, `User businessId is WK-${initialNextVal}`);
    pass("Buyer successfully promoted to AMBASSADOR with Business ID");

    // -------------------------------------------------------------
    // TEST 8: SPLIT Idempotency / Retry
    // -------------------------------------------------------------
    console.log("\n--- TEST 8: SPLIT Idempotency / Retry ---");
    const retryRes = await executeOrderSettlement(order7.id);
    assert(retryRes.alreadyProcessed === true, "Idempotency caught duplicate order");

    const commsAfterRetry = await prisma.commission.findMany({ where: { orderId: order7.id } });
    assert(commsAfterRetry.length === 2, "Commission count still strictly 2 (no duplicates)");
    pass("Idempotency: Retrying order settlement returns alreadyProcessed = true, 0 new commissions");

    // -------------------------------------------------------------
    // TEST 9: A đặt hộ B -> A KHÔNG được nhận SELF
    // -------------------------------------------------------------
    console.log("\n--- TEST 9: A đặt hộ B -> A không nhận SELF ---");
    const order9 = await prisma.order.create({
      data: {
        customerId: custSplit.id, // Linked to userSplit (B)
        ordererUserId: userAmbassador.id, // User A places order
        purchaseType: "CUSTOMER_PURCHASE",
        isSelfBuy: false,
        totalAmount: svc1000.price,
        status: "COMPLETED",
        items: {
          create: [{
            serviceId: svc1000.id,
            amount: svc1000.price,
            qty: 1,
            unitCommissionPts: 1000,
            lineCommissionPts: 1000,
          }]
        }
      }
    });
    createdOrderIds.push(order9.id);

    await executeOrderSettlement(order9.id);
    const comms9 = await prisma.commission.findMany({ where: { orderId: order9.id } });

    // Orderer (userAmbassador) must NOT receive SELF commission
    const ordererComm = comms9.find(c => c.receiverId === userAmbassador.userId);
    assert(!ordererComm, "User A (orderer) received NO commission for placing order for B");

    // Self commission must NOT exist on order9
    const hasSelf9 = comms9.find(c => c.role === "SELF");
    assert(!hasSelf9, "No SELF commission exists for non-self order");
    pass("A đặt hộ B: A received 0 SELF commission");

    // -------------------------------------------------------------
    // TEST 10: DIRECT receiver luôn là Customer.sponsorUserId
    // -------------------------------------------------------------
    console.log("\n--- TEST 10: DIRECT receiver luôn là Customer.sponsorUserId ---");
    // Orderer is userAmbassador (sponsor is userD1)
    // Customer is custSplit (sponsor is sponsorAmb)
    // Direct commission MUST go to sponsorAmb, NEVER userD1!
    const directComm9 = comms9.find(c => c.role === "DIRECT_SPONSOR");
    assert(directComm9, "DIRECT_SPONSOR commission exists");
    assert(directComm9.receiverId === sponsorAmb.userId, "DIRECT commission strictly awarded to Customer's sponsor");
    assert(directComm9.receiverId !== userD1.userId, "DIRECT commission NOT awarded to Orderer's sponsor");
    pass("DIRECT receiver is strictly Customer.sponsorUserId (never Orderer's sponsor)");

    // -------------------------------------------------------------
    // TEST 11: NOT_CONFIGURED rate produces ZERO commissions
    // -------------------------------------------------------------
    console.log("\n--- TEST 11: NOT_CONFIGURED rate produces ZERO commissions ---");
    // userChildOfDir (Ambassador) self-buys.
    // Parent is userDirectorParent (Director).
    // DIRECTOR_F1 is NOT_CONFIGURED.
    const custDirChild = await prisma.customer.create({ data: { expiresAt: new Date(Date.now() + 30 * 86400000), 
        fullName: "Cust Dir Child",
        phone: userChildOfDir.phone,
        sourceCtvId: userDirectorParent.userId,
        sponsorUserId: userDirectorParent.id,
        linkedUserId: userChildOfDir.id,
      }
    });
    createdCustomerIds.push(custDirChild.id);

    const order11 = await prisma.order.create({
      data: {
        customerId: custDirChild.id,
        ordererUserId: userChildOfDir.id,
        purchaseType: "SELF_PURCHASE",
        isSelfBuy: true,
        totalAmount: svc1000.price,
        status: "COMPLETED",
        items: {
          create: [{
            serviceId: svc1000.id,
            amount: svc1000.price,
            qty: 1,
            unitCommissionPts: 1000,
            lineCommissionPts: 1000,
          }]
        }
      }
    });
    createdOrderIds.push(order11.id);

    await executeOrderSettlement(order11.id);
    const comms11 = await prisma.commission.findMany({ where: { orderId: order11.id } });

    // Buyer gets SELF
    const dirChildSelf = comms11.find(c => c.role === "SELF");
    assert(dirChildSelf, "Buyer receives SELF");

    // Parent Director receives NOTHING because DIRECTOR_F1 is NOT_CONFIGURED
    const dirParentComm = comms11.find(c => c.receiverId === userDirectorParent.userId);
    assert(!dirParentComm, "Director parent D1 received 0 commission (DIRECTOR_F1 is NOT_CONFIGURED)");
    assert(comms11.filter(c => c.receiverId === userDirectorParent.userId).length === 0, "Director has exactly 0 commission records");
    pass("DIRECTOR Upstream D1/D2 receives ZERO commission when policy is NOT_CONFIGURED");

    // -------------------------------------------------------------
    // TEST 12: Product/Service points alteration does not alter order snapshot
    // -------------------------------------------------------------
    console.log("\n--- TEST 12: Historical OrderItem snapshot immutability ---");
    await prisma.service.update({
      where: { id: svc1000.id },
      data: { commissionPoints: 99999 }
    });

    const itemCheck = await prisma.orderItem.findFirst({
      where: { orderId: order11.id }
    });
    assert(itemCheck.unitCommissionPts === 1000, "OrderItem unitCommissionPts preserved as 1000");
    assert(itemCheck.lineCommissionPts === 1000, "OrderItem lineCommissionPts preserved as 1000");

    const commCheck = await prisma.commission.findFirst({
      where: { orderId: order11.id, role: "SELF" }
    });
    assert(commCheck.basePoints === 1000, "Commission basePoints preserved as 1000");
    pass("Modifying Service points does NOT alter historical OrderItem / Commission snapshot");

    // -------------------------------------------------------------
    // TEST 13: 100% Full Transaction Rollback on Failure
    // -------------------------------------------------------------
    console.log("\n--- TEST 13: 100% Full Transaction Rollback on Failure ---");
    const userRollback = await prisma.user.create({
      data: {
        userId: `TEST_RB_${timestamp}`,
        fullName: "User Rollback Test",
        phone: `0979${Math.floor(100000 + Math.random() * 900000)}`,
        role: "customer",
        isSystemParticipant: true,
        qualifyingPoints: 0,
      }
    });
    createdUserIds.push(userRollback.id);
    createdUsers.push({ id: userRollback.id, userId: userRollback.userId });

    const custRollback = await prisma.customer.create({ data: { expiresAt: new Date(Date.now() + 30 * 86400000), 
        fullName: "Cust Rollback Test",
        phone: userRollback.phone,
        sourceCtvId: sponsorAmb.userId,
        sponsorUserId: sponsorAmb.id,
        linkedUserId: userRollback.id,
      }
    });
    createdCustomerIds.push(custRollback.id);

    const orderRollback = await prisma.order.create({
      data: {
        customerId: custRollback.id,
        ordererUserId: userRollback.id,
        purchaseType: "SELF_PURCHASE",
        isSelfBuy: true,
        totalAmount: svc5000.price,
        status: "COMPLETED",
        items: {
          create: [{
            serviceId: svc5000.id,
            amount: svc5000.price,
            qty: 1,
            unitCommissionPts: 5000,
            lineCommissionPts: 5000,
          }]
        }
      }
    });
    createdOrderIds.push(orderRollback.id);

    let rollbackErrorCaught = false;
    try {
      await executeOrderSettlement(orderRollback.id, {
        commissionHandler: async () => {
          throw new Error("SIMULATED_COMMISSION_FAILURE");
        }
      });
    } catch (e) {
      if (e.message === "SIMULATED_COMMISSION_FAILURE") rollbackErrorCaught = true;
    }
    assert(rollbackErrorCaught, "Simulated error successfully thrown");

    // Verify 100% rollback
    const checkProc = await prisma.commissionProcessing.findUnique({ where: { orderId: orderRollback.id } });
    assert(!checkProc, "CommissionProcessing rolled back");

    const checkSp = await prisma.sPointTransaction.findMany({ where: { orderId: orderRollback.id } });
    assert(checkSp.length === 0, "SPointTransaction rolled back");

    const checkUserRb = await prisma.user.findUnique({ where: { id: userRollback.id } });
    assert(checkUserRb.qualifyingPoints === 0, "User qualifyingPoints rolled back to 0");
    assert(checkUserRb.businessId === null, "User businessId rolled back to null");

    const checkCommsRb = await prisma.commission.findMany({ where: { orderId: orderRollback.id } });
    assert(checkCommsRb.length === 0, "All commissions rolled back");

    pass("Transaction Rollback: 100% rollback across all entities when commission fails");

    console.log("\n=================================================");
    console.log(`   ALL ${passedTests} PHASE 2C-6 TESTS PASSED SUCCESSFULLY!`);
    console.log("=================================================\n");

  } finally {
    // CLEANUP TEST ARTIFACTS
    console.log("[CLEANUP] Cleaning test artifacts from DB...");
    for (const oid of createdOrderIds) {
      await prisma.commission.deleteMany({ where: { orderId: oid } });
      await prisma.sPointTransaction.deleteMany({ where: { orderId: oid } });
      await prisma.commissionProcessing.deleteMany({ where: { orderId: oid } });
      await prisma.orderItem.deleteMany({ where: { orderId: oid } });
      await prisma.order.delete({ where: { id: oid } }).catch(() => {});
    }
    for (const cid of createdCustomerIds) {
      await prisma.customer.delete({ where: { id: cid } }).catch(() => {});
    }
    for (const sid of createdServiceIds) {
      await prisma.service.delete({ where: { id: sid } }).catch(() => {});
    }
    await prisma.user.updateMany({ where: { id: { in: createdUserIds } }, data: { parentId: null } });
    for (const u of createdUsers) {
      await prisma.rankHistory.deleteMany({ where: { userId: u.userId } });
      await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
    }

    // Restore BusinessIdSequence
    await prisma.businessIdSequence.update({
      where: { id: 1 },
      data: { nextVal: initialNextVal }
    });
    console.log(`[CLEANUP] Restored BusinessIdSequence nextVal to ${initialNextVal}`);

    // POST-CHECK PRESERVATION
    const postUsers = await prisma.user.count();
    const postCustomers = await prisma.customer.count();
    const postOrders = await prisma.order.count();
    const postCommissions = await prisma.commission.count();
    const postProcessing = await prisma.commissionProcessing.count();

    console.log(`[POST-CHECK] Users: ${postUsers} (exp ${baseUsers}), Customers: ${postCustomers} (exp ${baseCustomers}), Orders: ${postOrders} (exp ${baseOrders}), Commissions: ${postCommissions} (exp ${baseCommissions}), Processing: ${postProcessing} (exp ${baseProcessing})`);

    if (postUsers !== baseUsers || postCustomers !== baseCustomers || postOrders !== baseOrders || postCommissions !== baseCommissions || postProcessing !== baseProcessing) {
      throw new Error("Data preservation violated after tests!");
    }
    console.log("✅ DATA PRESERVATION 100% VERIFIED!");
  }
}

runPhase2C6Tests()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌ TEST RUN FAILED:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
