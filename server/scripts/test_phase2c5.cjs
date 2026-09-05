const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Import or copy processOrderPointsAndActivation logic
async function processOrderPointsAndActivation(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      customer: { include: { linkedUser: true } },
      orderer: true,
    }
  });

  if (!order) return { success: false, message: "Order not found" };

  const orderTotalCP = order.items.reduce((sum, item) => sum + Math.round(item.lineCommissionPts || 0), 0);
  if (orderTotalCP <= 0) {
    return { success: true, pointsAwarded: 0, activated: false, reason: "Zero commission points" };
  }

  const qualifyingMember = (order.purchaseType === "SELF_PURCHASE")
    ? (order.orderer || (order.ordererUserId ? await prisma.user.findUnique({ where: { id: order.ordererUserId } }) : null))
    : (order.customer.linkedUser || (order.customer.linkedUserId ? await prisma.user.findUnique({ where: { id: order.customer.linkedUserId } }) : null));

  if (!qualifyingMember) {
    return { success: true, pointsAwarded: 0, activated: false, reason: "No qualifying member (retail customer)" };
  }

  const existingTx = await prisma.sPointTransaction.findFirst({
    where: { orderId: order.id, userId: qualifyingMember.userId, type: "EARN" }
  });
  if (existingTx) {
    return { success: true, pointsAwarded: existingTx.points, activated: false, reason: "Already processed (idempotent)" };
  }

  return await prisma.$transaction(async (tx) => {
    const doubleCheckTx = await tx.sPointTransaction.findFirst({
      where: { orderId: order.id, userId: qualifyingMember.userId, type: "EARN" }
    });
    if (doubleCheckTx) {
      return { success: true, pointsAwarded: doubleCheckTx.points, activated: false, reason: "Already processed" };
    }

    const currentUser = await tx.user.findUnique({ where: { id: qualifyingMember.id } });
    const isQualifying = !!currentUser.isSystemParticipant;
    const newQualifyingPoints = isQualifying
      ? Math.round((currentUser.qualifyingPoints || 0) + orderTotalCP)
      : Math.round(currentUser.qualifyingPoints || 0);
    const newSPoints = Math.round((currentUser.sPoints || 0) + orderTotalCP);

    await tx.sPointTransaction.create({
      data: {
        userId: currentUser.userId,
        orderId: order.id,
        points: orderTotalCP,
        type: "EARN",
        isQualifying,
        snapshotBalance: newSPoints,
        policyVersion: "1.0.0",
        description: `Tích lũy điểm xét Ambassador từ đơn hàng #${order.id}`,
      }
    });

    const thresholdCfg = await tx.systemPolicyConfig.findUnique({ where: { key: "AMBASSADOR_THRESHOLD" } });
    const threshold = thresholdCfg ? parseInt(thresholdCfg.value, 10) : 5000;

    let activated = false;
    let allocatedBusinessId = null;

    const userUpdateData = {
      sPoints: newSPoints,
      qualifyingPoints: newQualifyingPoints,
    };

    if (currentUser.isSystemParticipant && !currentUser.businessId && newQualifyingPoints >= threshold) {
      const seq = await tx.businessIdSequence.findUnique({ where: { id: 1 } });
      const currentSeqVal = seq ? seq.nextVal : 10001;
      allocatedBusinessId = `WK-${currentSeqVal}`;

      await tx.businessIdSequence.update({
        where: { id: 1 },
        data: { nextVal: currentSeqVal + 1 },
      });

      userUpdateData.businessId = allocatedBusinessId;
      userUpdateData.rank = "AMBASSADOR";
      userUpdateData.rankStatus = "ACTIVE_RANK";
      userUpdateData.rankAchievedAt = new Date();
      userUpdateData.rankActivationMethod = "AUTO_SPOINT_THRESHOLD";
      userUpdateData.rankActivatedBy = "SYSTEM";

      await tx.rankHistory.create({
        data: {
          userId: currentUser.userId,
          fromRank: currentUser.rank || "CUSTOMER",
          toRank: "AMBASSADOR",
          fromStatus: currentUser.rankStatus || "NOT_QUALIFIED",
          toStatus: "ACTIVE_RANK",
          reason: "AUTO_SPOINT_THRESHOLD",
          triggeredBy: "SYSTEM",
          metadata: JSON.stringify({
            orderId: order.id,
            qualifyingPoints: newQualifyingPoints,
            threshold,
            allocatedBusinessId,
            activatedAt: new Date().toISOString(),
          }),
        }
      });
      activated = true;
    }

    const updatedUser = await tx.user.update({
      where: { id: currentUser.id },
      data: userUpdateData,
    });

    return {
      success: true,
      pointsAwarded: orderTotalCP,
      newQualifyingPoints,
      activated,
      businessId: userUpdateData.businessId || currentUser.businessId,
      user: updatedUser,
    };
  });
}

async function runTests() {
  console.log("=================================================");
  console.log("   PHASE 2C-5 TEST SUITE: BUSINESS ID & ACTIVATION");
  console.log("=================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  const baselineUsers = await prisma.user.count();
  const baselineOrders = await prisma.order.count();
  const baselineCustomers = await prisma.customer.count();
  const initialSeq = await prisma.businessIdSequence.findUnique({ where: { id: 1 } });
  const initialSeqVal = initialSeq.nextVal;
  console.log(`[PRE-CHECK] Users: ${baselineUsers}, Orders: ${baselineOrders}, Initial nextVal: ${initialSeqVal}`);

  const createdUserIds = [];
  const createdCustomerIds = [];
  const createdOrderIds = [];
  const createdServiceIds = [];

  try {
    let testSponsor = await prisma.user.findFirst({ where: { role: 'ctv' } });
   if (!testSponsor) testSponsor = await prisma.user.findFirst();
   let testCat = await prisma.serviceCategory.findFirst();
    if (!testCat) testCat = await prisma.serviceCategory.create({ data: { name: "TEST_CAT_P2C5" } });

    // -------------------------------------------------------------
    // TEST 1: NOT System Participant -> NO Activation
    // -------------------------------------------------------------
    console.log("\n--- TEST 1: Not System Participant -> NO Activation ---");
    const user1 = await prisma.user.create({
      data: {
        userId: "P2C5_U1_" + Date.now(),
        fullName: "Retail User 1",
        phone: "098111" + Math.floor(1000 + Math.random() * 9000),
        isSystemParticipant: false, // NOT participant
        businessId: null,
        rank: "CUSTOMER",
      }
    });
    createdUserIds.push(user1.id);

    const cust1 = await prisma.customer.create({
      data: {
        fullName: user1.fullName,
        phone: user1.phone,
        sourceCtvId: testSponsor.userId,
        linkedUserId: user1.id,
        expiresAt: new Date(Date.now() + 30 * 86400000),
      }
    });
    createdCustomerIds.push(cust1.id);

    const order1 = await prisma.order.create({
      data: {
        customerId: cust1.id,
        ordererUserId: user1.id,
        purchaseType: "SELF_PURCHASE",
        totalAmount: 20000000,
        status: "COMPLETED",
        items: {
          create: [{
            amount: 20000000,
            qty: 1,
            unitCommissionPts: 5000,
            lineCommissionPts: 5000,
          }]
        }
      }
    });
    createdOrderIds.push(order1.id);

    const res1 = await processOrderPointsAndActivation(order1.id);
    assert(res1.activated === false, "User 1 NOT activated because isSystemParticipant = false");
    const checkU1 = await prisma.user.findUnique({ where: { id: user1.id } });
    assert(checkU1.businessId === null, "User 1 businessId remains null");
    assert(checkU1.rank === "CUSTOMER", "User 1 rank remains CUSTOMER");
    assert(checkU1.qualifyingPoints === 0, "User 1 qualifyingPoints remains 0");

    // -------------------------------------------------------------
    // TEST 2: Participant under threshold (4000 CP) -> NO Activation
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Participant under threshold (4000 CP) -> NO Activation ---");
    const user2 = await prisma.user.create({
      data: {
        userId: "P2C5_U2_" + Date.now(),
        fullName: "Participant User 2",
        phone: "098222" + Math.floor(1000 + Math.random() * 9000),
        isSystemParticipant: true,
        businessId: null,
        rank: "CUSTOMER",
      }
    });
    createdUserIds.push(user2.id);

    const cust2 = await prisma.customer.create({
      data: {
        fullName: user2.fullName,
        phone: user2.phone,
        sourceCtvId: testSponsor.userId,
        linkedUserId: user2.id,
        expiresAt: new Date(Date.now() + 30 * 86400000),
      }
    });
    createdCustomerIds.push(cust2.id);

    const order2 = await prisma.order.create({
      data: {
        customerId: cust2.id,
        ordererUserId: user2.id,
        purchaseType: "SELF_PURCHASE",
        totalAmount: 16000000,
        status: "COMPLETED",
        items: {
          create: [{
            amount: 16000000,
            qty: 1,
            unitCommissionPts: 4000,
            lineCommissionPts: 4000,
          }]
        }
      }
    });
    createdOrderIds.push(order2.id);

    const res2 = await processOrderPointsAndActivation(order2.id);
    assert(res2.activated === false, "User 2 NOT activated (4000 < 5000 threshold)");
    const checkU2 = await prisma.user.findUnique({ where: { id: user2.id } });
    assert(checkU2.qualifyingPoints === 4000, "User 2 qualifyingPoints = 4000");
    assert(checkU2.businessId === null, "User 2 businessId is null");

    // -------------------------------------------------------------
    // TEST 3: Participant exactly at threshold (5000 CP) -> ACTIVATION
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Participant exactly at threshold (5000 CP) -> ACTIVATION ---");
    const user3 = await prisma.user.create({
      data: {
        userId: "P2C5_U3_" + Date.now(),
        fullName: "Participant User 3",
        phone: "098333" + Math.floor(1000 + Math.random() * 9000),
        isSystemParticipant: true,
        businessId: null,
        rank: "CUSTOMER",
      }
    });
    createdUserIds.push(user3.id);

    const cust3 = await prisma.customer.create({
      data: {
        fullName: user3.fullName,
        phone: user3.phone,
        sourceCtvId: testSponsor.userId,
        linkedUserId: user3.id,
        expiresAt: new Date(Date.now() + 30 * 86400000),
      }
    });
    createdCustomerIds.push(cust3.id);

    const order3 = await prisma.order.create({
      data: {
        customerId: cust3.id,
        ordererUserId: user3.id,
        purchaseType: "SELF_PURCHASE",
        totalAmount: 20000000,
        status: "COMPLETED",
        items: {
          create: [{
            amount: 20000000,
            qty: 1,
            unitCommissionPts: 5000,
            lineCommissionPts: 5000,
          }]
        }
      }
    });
    createdOrderIds.push(order3.id);

    const res3 = await processOrderPointsAndActivation(order3.id);
    assert(res3.activated === true, "User 3 ACTIVATED (5000 >= 5000)");
    assert(res3.businessId.startsWith("WK-"), "User 3 allocated Business ID with WK- prefix");
    const checkU3 = await prisma.user.findUnique({ where: { id: user3.id } });
    assert(checkU3.rank === "AMBASSADOR", "User 3 rank updated to AMBASSADOR");
    assert(checkU3.rankStatus === "ACTIVE_RANK", "User 3 rankStatus is ACTIVE_RANK");

    const hist3 = await prisma.rankHistory.findMany({ where: { userId: user3.userId } });
    assert(hist3.length === 1, "Exactly 1 RankHistory record created for User 3");
    assert(hist3[0].toRank === "AMBASSADOR" && hist3[0].reason === "AUTO_SPOINT_THRESHOLD", "RankHistory details correct");

    // -------------------------------------------------------------
    // TEST 4: Participant exceeding threshold (8000 CP) -> ACTIVATION
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Participant exceeding threshold (8000 CP) -> ACTIVATION ---");
    const user4 = await prisma.user.create({
      data: {
        userId: "P2C5_U4_" + Date.now(),
        fullName: "Participant User 4",
        phone: "098444" + Math.floor(1000 + Math.random() * 9000),
        isSystemParticipant: true,
        businessId: null,
        rank: "CUSTOMER",
      }
    });
    createdUserIds.push(user4.id);

    const cust4 = await prisma.customer.create({
      data: {
        fullName: user4.fullName,
        phone: user4.phone,
        sourceCtvId: testSponsor.userId,
        linkedUserId: user4.id,
        expiresAt: new Date(Date.now() + 30 * 86400000),
      }
    });
    createdCustomerIds.push(cust4.id);

    const order4 = await prisma.order.create({
      data: {
        customerId: cust4.id,
        ordererUserId: user4.id,
        purchaseType: "SELF_PURCHASE",
        totalAmount: 32000000,
        status: "COMPLETED",
        items: {
          create: [{
            amount: 32000000,
            qty: 2,
            unitCommissionPts: 4000,
            lineCommissionPts: 8000,
          }]
        }
      }
    });
    createdOrderIds.push(order4.id);

    const res4 = await processOrderPointsAndActivation(order4.id);
    assert(res4.activated === true, "User 4 ACTIVATED with 8000 CP");
    const checkU4 = await prisma.user.findUnique({ where: { id: user4.id } });
    assert(checkU4.qualifyingPoints === 8000, "User 4 qualifyingPoints = 8000");
    assert(checkU4.rank === "AMBASSADOR", "User 4 rank is AMBASSADOR");

    // -------------------------------------------------------------
    // TEST 5: Concurrency - 2 simultaneous orders crossing threshold
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Concurrency - 2 simultaneous orders crossing threshold ---");
    const user5 = await prisma.user.create({
      data: {
        userId: "P2C5_U5_" + Date.now(),
        fullName: "Concurrent User 5",
        phone: "098555" + Math.floor(1000 + Math.random() * 9000),
        isSystemParticipant: true,
        businessId: null,
        rank: "CUSTOMER",
        qualifyingPoints: 3000, // Starts with 3000, needs 2000 more
      }
    });
    createdUserIds.push(user5.id);

    const cust5 = await prisma.customer.create({
      data: {
        fullName: user5.fullName,
        phone: user5.phone,
        sourceCtvId: testSponsor.userId,
        linkedUserId: user5.id,
        expiresAt: new Date(Date.now() + 30 * 86400000),
      }
    });
    createdCustomerIds.push(cust5.id);

    // Order 5A: 3000 CP
    const order5A = await prisma.order.create({
      data: {
        customerId: cust5.id,
        ordererUserId: user5.id,
        purchaseType: "SELF_PURCHASE",
        totalAmount: 12000000,
        status: "COMPLETED",
        items: {
          create: [{
            amount: 12000000,
            qty: 1,
            unitCommissionPts: 3000,
            lineCommissionPts: 3000,
          }]
        }
      }
    });
    createdOrderIds.push(order5A.id);

    // Order 5B: 3000 CP
    const order5B = await prisma.order.create({
      data: {
        customerId: cust5.id,
        ordererUserId: user5.id,
        purchaseType: "SELF_PURCHASE",
        totalAmount: 12000000,
        status: "COMPLETED",
        items: {
          create: [{
            amount: 12000000,
            qty: 1,
            unitCommissionPts: 3000,
            lineCommissionPts: 3000,
          }]
        }
      }
    });
    createdOrderIds.push(order5B.id);

    // Process both concurrently!
    const [cResA, cResB] = await Promise.all([
      processOrderPointsAndActivation(order5A.id),
      processOrderPointsAndActivation(order5B.id),
    ]);

    const checkU5 = await prisma.user.findUnique({ where: { id: user5.id } });
    assert(checkU5.qualifyingPoints === 9000, "Final qualifyingPoints is 9000 (3000+3000+3000)");
    assert(checkU5.rank === "AMBASSADOR", "User 5 rank is AMBASSADOR");
    assert(!!checkU5.businessId, "User 5 has businessId");

    const hist5 = await prisma.rankHistory.findMany({ where: { userId: user5.userId } });
    assert(hist5.length === 1, "EXACTLY 1 RankHistory created despite concurrent orders");
    const activatedCount = (cResA.activated ? 1 : 0) + (cResB.activated ? 1 : 0);
    assert(activatedCount === 1, "Exactly 1 order returned activated=true in concurrency");

    // -------------------------------------------------------------
    // TEST 6: Idempotency (Retry same order)
    // -------------------------------------------------------------
    console.log("\n--- TEST 6: Idempotency (Retry same order) ---");
    const retryRes = await processOrderPointsAndActivation(order5A.id);
    assert(retryRes.activated === false, "Retry returned activated=false");
    assert(retryRes.reason.includes("idempotent") || retryRes.reason.includes("Already processed"), "Retry recognized as already processed");
    const checkU5AfterRetry = await prisma.user.findUnique({ where: { id: user5.id } });
    assert(checkU5AfterRetry.qualifyingPoints === 9000, "qualifyingPoints NOT incremented on retry");

    // -------------------------------------------------------------
    // TEST 7: User already has Business ID -> NO new ID allocated
    // -------------------------------------------------------------
    console.log("\n--- TEST 7: User already has Business ID -> NO new ID ---");
    const user7 = await prisma.user.create({
      data: {
        userId: "P2C5_U7_" + Date.now(),
        fullName: "Existing Ambassador 7",
        phone: "098777" + Math.floor(1000 + Math.random() * 9000),
        isSystemParticipant: true,
        businessId: "WK-EXISTING-01",
        rank: "AMBASSADOR",
        rankStatus: "ACTIVE_RANK",
      }
    });
    createdUserIds.push(user7.id);

    const cust7 = await prisma.customer.create({
      data: {
        fullName: user7.fullName,
        phone: user7.phone,
        sourceCtvId: testSponsor.userId,
        linkedUserId: user7.id,
        expiresAt: new Date(Date.now() + 30 * 86400000),
      }
    });
    createdCustomerIds.push(cust7.id);

    const order7 = await prisma.order.create({
      data: {
        customerId: cust7.id,
        ordererUserId: user7.id,
        purchaseType: "SELF_PURCHASE",
        totalAmount: 20000000,
        status: "COMPLETED",
        items: {
          create: [{
            amount: 20000000,
            qty: 1,
            unitCommissionPts: 5000,
            lineCommissionPts: 5000,
          }]
        }
      }
    });
    createdOrderIds.push(order7.id);

    const res7 = await processOrderPointsAndActivation(order7.id);
    assert(res7.activated === false, "Already an Ambassador -> activated is false");
    const checkU7 = await prisma.user.findUnique({ where: { id: user7.id } });
    assert(checkU7.businessId === "WK-EXISTING-01", "Existing businessId preserved unchanged");

    console.log("\n=================================================");
    console.log(`   ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log("=================================================\n");

  } finally {
    console.log("[CLEANUP] Removing test artifacts from DB...");
    for (const oid of createdOrderIds) {
      await prisma.sPointTransaction.deleteMany({ where: { orderId: oid } });
      await prisma.orderItem.deleteMany({ where: { orderId: oid } });
      await prisma.order.delete({ where: { id: oid } }).catch(() => {});
    }
    for (const cid of createdCustomerIds) {
      await prisma.customer.delete({ where: { id: cid } }).catch(() => {});
    }
    for (const uid of createdUserIds) {
      const u = await prisma.user.findUnique({ where: { id: uid } });
      if (u) {
        await prisma.rankHistory.deleteMany({ where: { userId: u.userId } });
        await prisma.sPointTransaction.deleteMany({ where: { userId: u.userId } });
        await prisma.user.delete({ where: { id: uid } }).catch(() => {});
      }
    }
    // Restore sequence nextVal to initial state so test didn't leak IDs
    await prisma.businessIdSequence.update({
      where: { id: 1 },
      data: { nextVal: initialSeqVal }
    });
    console.log(`[CLEANUP] Restored BusinessIdSequence nextVal to ${initialSeqVal}.`);

    const postUsers = await prisma.user.count();
    const postOrders = await prisma.order.count();
    const postCustomers = await prisma.customer.count();
    console.log(`[POST-CHECK] Users: ${postUsers} (expected ${baselineUsers}), Customers: ${postCustomers} (expected ${baselineCustomers}), Orders: ${postOrders} (expected ${baselineOrders})`);
    if (postUsers !== baselineUsers || postOrders !== baselineOrders || postCustomers !== baselineCustomers) {
      throw new Error(`Data preservation failed!`);
    }
  }
}

runTests()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("\n❌ TEST SUITE FAILED:", e.message);
    await prisma.$disconnect();
    process.exit(1);
  });