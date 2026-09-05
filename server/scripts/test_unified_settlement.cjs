const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Mirror the exact executeOrderSettlement orchestrator logic
async function executeOrderSettlement(orderId, options = {}) {
  const existingProcessing = await prisma.commissionProcessing.findUnique({
    where: { orderId }
  });
  if (existingProcessing) {
    return {
      success: true,
      alreadyProcessed: true,
      message: "Order settlement already completed (idempotent guard)",
      processing: existingProcessing,
    };
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Idempotency marker
    const processing = await tx.commissionProcessing.create({
      data: {
        orderId,
        status: "COMPLETED",
        policyVersion: "1.0.0",
      }
    });

    // 2. Load Order & Attributions
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        customer: { include: { sponsorUser: true, linkedUser: true } },
        orderer: true,
      }
    });

    if (!order) throw new Error(`Order ${orderId} not found`);

    const orderer = order.orderer || (order.ordererUserId ? await tx.user.findUnique({ where: { id: order.ordererUserId } }) : null);
    const customer = order.customer;
    const qualifyingMember = customer.linkedUser || null;
    const isSelf = !!(qualifyingMember && orderer && qualifyingMember.id === orderer.id);

    let directSponsor = customer.sponsorUser || null;
    if (!directSponsor && customer.sponsorUserId) {
      directSponsor = await tx.user.findUnique({ where: { id: customer.sponsorUserId } });
    }

    // 3. S-Points & Qualifying Points
    const orderTotalCP = order.items.reduce((sum, item) => sum + Math.round(item.lineCommissionPts || 0), 0);
    let pointsAwarded = 0;
    let activated = false;
    let allocatedBusinessId = null;

    if (orderTotalCP > 0 && qualifyingMember) {
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
      pointsAwarded = orderTotalCP;

      // 4. Ambassador Activation
      const thresholdCfg = await tx.systemPolicyConfig.findUnique({ where: { key: "AMBASSADOR_THRESHOLD" } });
      const threshold = thresholdCfg ? parseInt(thresholdCfg.value, 10) : 5000;

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

      await tx.user.update({
        where: { id: currentUser.id },
        data: userUpdateData,
      });
    }

    // 5. Commission Handler inside the SAME transaction boundary
    let createdCommissions = [];
    if (typeof options.commissionHandler === "function") {
      createdCommissions = await options.commissionHandler(tx, {
        order,
        orderTotalCP,
        orderer,
        customer,
        qualifyingMember,
        directSponsor,
        isSelf,
      });
    }

    return {
      success: true,
      orderId: order.id,
      pointsAwarded,
      activated,
      allocatedBusinessId,
      createdCommissions,
      processingId: processing.id,
    };
  });
}

async function runTests() {
  console.log("=================================================");
  console.log("   PHASE 2C-5 ATOMIC ORCHESTRATION & SEMANTICS TEST");
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

  try {
    let testSponsor = await prisma.user.findFirst({ where: { role: "ctv" } });
    if (!testSponsor) testSponsor = await prisma.user.findFirst();

    // -------------------------------------------------------------
    // TEST 1: Business ID Sequence Semantics (Initial -> Generated -> After Allocation)
    // -------------------------------------------------------------
    console.log("\n--- TEST 1: Business ID Sequence Semantics ---");
    assert(initialSeqVal === 10001, "Initial nextVal in DB is exactly 10001");

    // Perform atomic increment
    const allocatedId1 = await prisma.$transaction(async (tx) => {
      const seq = await tx.businessIdSequence.findUnique({ where: { id: 1 } });
      const currentVal = seq.nextVal;
      const bid = `WK-${currentVal}`;
      await tx.businessIdSequence.update({ where: { id: 1 }, data: { nextVal: currentVal + 1 } });
      return bid;
    });

    assert(allocatedId1 === "WK-10001", "Allocated ID is WK-10001");
    const seqAfter1 = await prisma.businessIdSequence.findUnique({ where: { id: 1 } });
    assert(seqAfter1.nextVal === 10002, "DB nextVal after allocation is exactly 10002 (nextVal = next ID to allocate)");

    // Rollback sequence increment to test isolation
    await prisma.businessIdSequence.update({ where: { id: 1 }, data: { nextVal: initialSeqVal } });
    assert((await prisma.businessIdSequence.findUnique({ where: { id: 1 } })).nextVal === 10001, "Restored nextVal to 10001 for main tests");

    // -------------------------------------------------------------
    // SETUP TEST ENTITIES FOR ATOMIC TRANSACTION TESTS
    // -------------------------------------------------------------
    console.log("\n--- SETUP TEST USER & ORDER ---");
    const userA = await prisma.user.create({
      data: {
        userId: "TEST_ATOMIC_A_" + Date.now(),
        fullName: "Atomic User A",
        phone: "097111" + Math.floor(1000 + Math.random() * 9000),
        isSystemParticipant: true,
        businessId: null,
        rank: "CUSTOMER",
        qualifyingPoints: 0,
      }
    });
    createdUserIds.push(userA.id);

    const custA = await prisma.customer.create({
      data: {
        fullName: userA.fullName,
        phone: userA.phone,
        sourceCtvId: testSponsor.userId,
        sponsorUserId: testSponsor.id,
        linkedUserId: userA.id,
        expiresAt: new Date(Date.now() + 30 * 86400000),
      }
    });
    createdCustomerIds.push(custA.id);

    // Order with 5000 commission points (will cross threshold)
    const orderFail = await prisma.order.create({
      data: {
        customerId: custA.id,
        ordererUserId: userA.id,
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
    createdOrderIds.push(orderFail.id);

    // -------------------------------------------------------------
    // TEST 2: ATOMIC ROLLBACK - Commission Failure rolls back Points, ID, and Rank
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Commission failure triggers 100% full rollback ---");
    let errorThrown = false;
    try {
      await executeOrderSettlement(orderFail.id, {
        commissionHandler: async (tx, context) => {
          console.log("   [Simulation] Commission calculation triggered...");
          throw new Error("SIMULATED_COMMISSION_ENGINE_CALCULATION_FAILURE");
        }
      });
    } catch (err) {
      errorThrown = true;
      assert(err.message === "SIMULATED_COMMISSION_ENGINE_CALCULATION_FAILURE", "Caught simulated commission engine failure");
    }
    assert(errorThrown === true, "executeOrderSettlement threw error on commission failure");

    // Verify EVERYTHING rolled back:
    const checkProcFail = await prisma.commissionProcessing.findUnique({ where: { orderId: orderFail.id } });
    assert(checkProcFail === null, "CommissionProcessing rolled back (NOT created)");

    const checkSPointFail = await prisma.sPointTransaction.findMany({ where: { orderId: orderFail.id } });
    assert(checkSPointFail.length === 0, "SPointTransaction rolled back (0 records)");

    const checkUserFail = await prisma.user.findUnique({ where: { id: userA.id } });
    assert(checkUserFail.qualifyingPoints === 0, "User qualifyingPoints rolled back to 0");
    assert(checkUserFail.businessId === null, "User businessId rolled back to null (NOT allocated)");
    assert(checkUserFail.rank === "CUSTOMER", "User rank rolled back to CUSTOMER");

    const checkHistFail = await prisma.rankHistory.findMany({ where: { userId: userA.userId } });
    assert(checkHistFail.length === 0, "RankHistory rolled back (0 records)");

    const checkSeqFail = await prisma.businessIdSequence.findUnique({ where: { id: 1 } });
    assert(checkSeqFail.nextVal === 10001, "BusinessIdSequence nextVal rolled back to 10001 (NOT leaked)");

    // -------------------------------------------------------------
    // TEST 3: SUCCESSFUL UNIFIED ATOMIC SETTLEMENT (All Commit Together)
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Successful unified atomic settlement ---");
    const resSuccess = await executeOrderSettlement(orderFail.id, {
      commissionHandler: async (tx, context) => {
        // Create 1 mock Commission record inside same tx to verify unified commit
        const comm = await tx.commission.create({
          data: {
            orderId: context.order.id,
            receiverId: userA.userId,
            amount: 1000000,
            type: "SELF",
            status: "PENDING",
            rateSnapshot: 0.20,
            rankSnapshot: "AMBASSADOR",
            baseAmount: 5000000,
            policyRef: "AMBASSADOR_SELF_BUY",
            ruleKey: "AMBASSADOR_SELF_BUY",
            policyVersion: "1.0.0",
            role: "SELF",
            basePoints: 5000,
            earnedPoints: 1000,
            earnedMoney: 1000000,
          }
        });
        return [comm];
      }
    });

    assert(resSuccess.success === true, "Settlement executed successfully");
    assert(resSuccess.activated === true, "User activated successfully");
    assert(resSuccess.allocatedBusinessId === "WK-10001", "Allocated Business ID is WK-10001");
    assert(resSuccess.createdCommissions.length === 1, "Commission record created inside same transaction");

    // Verify ALL entities committed together:
    const checkProcSuccess = await prisma.commissionProcessing.findUnique({ where: { orderId: orderFail.id } });
    assert(checkProcSuccess !== null, "CommissionProcessing committed successfully");

    const checkSPointSuccess = await prisma.sPointTransaction.findMany({ where: { orderId: orderFail.id } });
    assert(checkSPointSuccess.length === 1, "SPointTransaction committed successfully");

    const checkUserSuccess = await prisma.user.findUnique({ where: { id: userA.id } });
    assert(checkUserSuccess.qualifyingPoints === 5000, "User qualifyingPoints committed as 5000");
    assert(checkUserSuccess.businessId === "WK-10001", "User businessId committed as WK-10001");
    assert(checkUserSuccess.rank === "AMBASSADOR", "User rank committed as AMBASSADOR");

    const checkHistSuccess = await prisma.rankHistory.findMany({ where: { userId: userA.userId } });
    assert(checkHistSuccess.length === 1, "RankHistory committed successfully");

    const checkSeqSuccess = await prisma.businessIdSequence.findUnique({ where: { id: 1 } });
    assert(checkSeqSuccess.nextVal === 10002, "BusinessIdSequence nextVal committed as 10002");

    // -------------------------------------------------------------
    // TEST 4: IDEMPOTENCY - Retry Same Order
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Idempotency - Retry Same Order ---");
    const retryRes = await executeOrderSettlement(orderFail.id);
    assert(retryRes.alreadyProcessed === true, "Retry detected alreadyProcessed = true via CommissionProcessing");

    // Verify counts did not increase
    const checkCommsRetry = await prisma.commission.findMany({ where: { orderId: orderFail.id } });
    assert(checkCommsRetry.length === 1, "Commission count still exactly 1 (no double commission)");

    const checkSPointsRetry = await prisma.sPointTransaction.findMany({ where: { orderId: orderFail.id } });
    assert(checkSPointsRetry.length === 1, "SPointTransaction count still exactly 1 (no double points)");

    const checkHistRetry = await prisma.rankHistory.findMany({ where: { userId: userA.userId } });
    assert(checkHistRetry.length === 1, "RankHistory count still exactly 1 (no duplicate rank change)");

    const checkSeqRetry = await prisma.businessIdSequence.findUnique({ where: { id: 1 } });
    assert(checkSeqRetry.nextVal === 10002, "BusinessIdSequence nextVal still exactly 10002 (no leaked sequence)");

    console.log("\n=================================================");
    console.log(`   ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log("=================================================\n");

  } finally {
    console.log("[CLEANUP] Removing test artifacts from DB...");
    for (const oid of createdOrderIds) {
      await prisma.commission.deleteMany({ where: { orderId: oid } });
      await prisma.commissionProcessing.deleteMany({ where: { orderId: oid } });
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
    await prisma.businessIdSequence.update({
      where: { id: 1 },
      data: { nextVal: initialSeqVal }
    });
    console.log(`[CLEANUP] Restored BusinessIdSequence nextVal to ${initialSeqVal}.`);

    const postUsers = await prisma.user.count();
    const postOrders = await prisma.order.count();
    const postCustomers = await prisma.customer.count();
    const postCommissions = await prisma.commission.count();
    const postProcessing = await prisma.commissionProcessing.count();
    console.log(`[POST-CHECK] Users: ${postUsers} (exp ${baselineUsers}), Customers: ${postCustomers} (exp ${baselineCustomers}), Orders: ${postOrders} (exp ${baselineOrders}), Commissions: ${postCommissions}, Processing: ${postProcessing}`);
    if (postUsers !== baselineUsers || postOrders !== baselineOrders || postCustomers !== baselineCustomers) {
      throw new Error("Data preservation failed!");
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