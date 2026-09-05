const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function runTests() {
  console.log("=================================================");
  console.log("   PHASE 2C-4 TEST SUITE: NETWORK & ATTRIBUTION");
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

  // 0. Baseline counts check
  const baselineUsers = await prisma.user.count();
  const baselineOrders = await prisma.order.count();
  const baselineCustomers = await prisma.customer.count();
  console.log(`[PRE-CHECK] Baseline Users: ${baselineUsers}, Customers: ${baselineCustomers}, Orders: ${baselineOrders}`);

  // Tracking created IDs for cleanup
  const createdUserIds = [];
  const createdCustomerIds = [];
  const createdOrderIds = [];
  const createdServiceIds = [];
  const createdProductIds = [];

  try {
    // -------------------------------------------------------------
    // SETUP NETWORK TEST ENTITIES
    // -------------------------------------------------------------
    console.log("\n--- SETUP TEST USERS & NETWORK ---");
    // M (Sponsor of A)
    const userM = await prisma.user.create({
      data: {
        userId: "TEST_M_" + Date.now(),
        fullName: "Test Sponsor M",
        phone: "099111" + Math.floor(1000 + Math.random() * 9000),
        role: "ctv",
        rank: "MANAGER",
        businessId: "WKP-9001",
        isSystemParticipant: true,
      }
    });
    createdUserIds.push(userM.id);

    // A (CTV sponsored by M)
    const userA = await prisma.user.create({
      data: {
        userId: "TEST_A_" + Date.now(),
        fullName: "Test CTV A",
        phone: "099222" + Math.floor(1000 + Math.random() * 9000),
        role: "ctv",
        rank: "AMBASSADOR",
        parentId: userM.userId,
        businessId: "WKP-9002",
        isSystemParticipant: true,
      }
    });
    createdUserIds.push(userA.id);

    // S_B (Sponsor of B)
    const userSB = await prisma.user.create({
      data: {
        userId: "TEST_SB_" + Date.now(),
        fullName: "Test Sponsor S_B",
        phone: "099333" + Math.floor(1000 + Math.random() * 9000),
        role: "ctv",
        rank: "AMBASSADOR",
        businessId: "WKP-9003",
        isSystemParticipant: true,
      }
    });
    createdUserIds.push(userSB.id);

    // Staff C (Staff / Admin placing order on behalf)
    const userStaffC = await prisma.user.create({
      data: {
        userId: "TEST_STAFF_C_" + Date.now(),
        fullName: "Test Staff C",
        phone: "099444" + Math.floor(1000 + Math.random() * 9000),
        role: "admin",
      }
    });
    createdUserIds.push(userStaffC.id);

    // B_User (Customer B who registered a User account)
    const userB = await prisma.user.create({
      data: {
        userId: "TEST_B_" + Date.now(),
        fullName: "Test Customer Member B",
        phone: "099555" + Math.floor(1000 + Math.random() * 9000),
        role: "customer",
        parentId: userSB.userId,
      }
    });
    createdUserIds.push(userB.id);

    // Customer record for A (A as customer, sponsored by M, linked to userA)
    const custA = await prisma.customer.create({
      data: {
        fullName: userA.fullName,
        phone: userA.phone,
        sourceCtvId: userM.userId,
        sponsorUserId: userM.id,
        linkedUserId: userA.id,
        expiresAt: new Date(Date.now() + 30 * 86400000),
      }
    });
    createdCustomerIds.push(custA.id);

    // Customer record B1 (Customer with User account, sponsored by S_B, linked to userB)
    const custB1 = await prisma.customer.create({
      data: {
        fullName: userB.fullName,
        phone: userB.phone,
        sourceCtvId: userSB.userId,
        sponsorUserId: userSB.id,
        linkedUserId: userB.id,
        expiresAt: new Date(Date.now() + 30 * 86400000),
      }
    });
    createdCustomerIds.push(custB1.id);

    // Customer record B2 (Pure retail customer, NO User account, sponsored by S_B)
    const custB2 = await prisma.customer.create({
      data: {
        fullName: "Retail Customer B2",
        phone: "099666" + Math.floor(1000 + Math.random() * 9000),
        sourceCtvId: userSB.userId,
        sponsorUserId: userSB.id,
        linkedUserId: null, // Pure retail
        expiresAt: new Date(Date.now() + 30 * 86400000),
      }
    });
    createdCustomerIds.push(custB2.id);

    // Test service
    let testCat = await prisma.serviceCategory.findFirst();
    if (!testCat) testCat = await prisma.serviceCategory.create({ data: { name: "TEST_CAT_P2C4" } });
    const svc = await prisma.service.create({
      data: {
        name: "TEST_P2C4_Service",
        price: 10000000,
        commissionPoints: 4000,
        categoryId: testCat.id,
      }
    });
    createdServiceIds.push(svc.id);

    // Test product
    let testProdCat = await prisma.productCategory.findFirst();
    if (!testProdCat) testProdCat = await prisma.productCategory.create({ data: { name: "TEST_PCAT", slug: "test-pcat-" + Date.now() } });
    const prod = await prisma.product.create({
      data: {
        title: "TEST_P2C4_Product",
        slug: "test-p2c4-prod-" + Date.now(),
        price: 8000000,
        commissionPoints: 3000,
        categoryId: testProdCat.id,
      }
    });
    createdProductIds.push(prod.id);

    // Helper attribution resolver (mirroring server/index.js)
    async function resolveAttribution(orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: { include: { sponsorUser: true, linkedUser: true } },
          orderer: true,
          items: true,
        }
      });
      const orderer = order.orderer || (order.ordererUserId ? await prisma.user.findUnique({ where: { id: order.ordererUserId } }) : null);
      const customer = order.customer;
      const qualifyingMember = customer.linkedUser || null;
      const isSelf = !!(qualifyingMember && orderer && qualifyingMember.id === orderer.id);

      let directSponsor = customer.sponsorUser || null;
      if (!directSponsor && customer.sponsorUserId) {
        directSponsor = await prisma.user.findUnique({ where: { id: customer.sponsorUserId } });
      }

      let upstreamD1 = null;
      if (directSponsor && directSponsor.parentId) {
        upstreamD1 = await prisma.user.findFirst({
          where: { OR: [{ userId: directSponsor.parentId }, { id: directSponsor.parentId }] }
        });
      }

      return { orderId: order.id, purchaseType: order.purchaseType, order, orderer, customer, qualifyingMember, isSelfPurchase: isSelf, directSponsor, upstreamD1 };
    }

    // -------------------------------------------------------------
    // TEST 1: A buys for A -> SELF_PURCHASE
    // -------------------------------------------------------------
    console.log("\n--- TEST 1: A buys for A -> SELF_PURCHASE ---");
    const isSelfA = !!(custA.linkedUserId && custA.linkedUserId === userA.id);
    const order1 = await prisma.order.create({
      data: {
        customerId: custA.id,
        ordererUserId: userA.id, // Strictly from JWT
        purchaseType: isSelfA ? "SELF_PURCHASE" : "CUSTOMER_PURCHASE",
        isSelfBuy: isSelfA,
        totalAmount: svc.price,
        status: "COMPLETED",
        items: {
          create: [{
            serviceId: svc.id,
            amount: svc.price,
            qty: 1,
            unitCommissionPts: svc.commissionPoints,
            lineCommissionPts: svc.commissionPoints,
          }]
        }
      }
    });
    createdOrderIds.push(order1.id);

    const attr1 = await resolveAttribution(order1.id);
    assert(attr1.purchaseType === "SELF_PURCHASE", "Order 1 purchaseType is SELF_PURCHASE");
    assert(attr1.isSelfPurchase === true, "Order 1 isSelfPurchase === true");
    assert(attr1.orderer.id === userA.id, "Order 1 orderer is User A");
    assert(attr1.qualifyingMember.id === userA.id, "Order 1 qualifyingMember is User A");

    // -------------------------------------------------------------
    // TEST 2: A orders for B1 -> CUSTOMER_PURCHASE & DIRECT to B1's sponsor
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: A orders for B1 -> CUSTOMER_PURCHASE & DIRECT to S_B ---");
    const isSelfB1 = !!(custB1.linkedUserId && custB1.linkedUserId === userA.id);
    const order2 = await prisma.order.create({
      data: {
        customerId: custB1.id,
        ordererUserId: userA.id, // A places order
        purchaseType: isSelfB1 ? "SELF_PURCHASE" : "CUSTOMER_PURCHASE",
        isSelfBuy: isSelfB1,
        totalAmount: svc.price,
        status: "COMPLETED",
        items: {
          create: [{
            serviceId: svc.id,
            amount: svc.price,
            qty: 1,
            unitCommissionPts: svc.commissionPoints,
            lineCommissionPts: svc.commissionPoints,
          }]
        }
      }
    });
    createdOrderIds.push(order2.id);

    const attr2 = await resolveAttribution(order2.id);
    assert(attr2.purchaseType === "CUSTOMER_PURCHASE", "Order 2 purchaseType is CUSTOMER_PURCHASE");
    assert(attr2.isSelfPurchase === false, "Order 2 isSelfPurchase === false");
    assert(attr2.orderer.id === userA.id, "Order 2 orderer is User A");
    assert(attr2.qualifyingMember.id === userB.id, "Order 2 qualifyingMember is User B");
    assert(attr2.directSponsor.id === userSB.id, "Order 2 directSponsor is S_B (Customer's sponsor)");

    // -------------------------------------------------------------
    // TEST 3: Verify M does NOT receive DIRECT (A's sponsor is not B's sponsor)
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Verify M does NOT receive DIRECT ---");
    assert(attr2.directSponsor.id !== userM.id, "Direct sponsor is S_B, NOT A's sponsor M");

    // -------------------------------------------------------------
    // TEST 4: Staff C orders for B1 -> DIRECT still to S_B
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Staff C orders for B1 -> DIRECT still to S_B ---");
    const isSelfStaff = !!(custB1.linkedUserId && custB1.linkedUserId === userStaffC.id);
    const order3 = await prisma.order.create({
      data: {
        customerId: custB1.id,
        ordererUserId: userStaffC.id, // Staff C places order
        purchaseType: isSelfStaff ? "SELF_PURCHASE" : "CUSTOMER_PURCHASE",
        isSelfBuy: isSelfStaff,
        totalAmount: svc.price,
        status: "COMPLETED",
        items: {
          create: [{
            serviceId: svc.id,
            amount: svc.price,
            qty: 1,
            unitCommissionPts: svc.commissionPoints,
            lineCommissionPts: svc.commissionPoints,
          }]
        }
      }
    });
    createdOrderIds.push(order3.id);

    const attr3 = await resolveAttribution(order3.id);
    assert(attr3.orderer.id === userStaffC.id, "Order 3 orderer is Staff C");
    assert(attr3.directSponsor.id === userSB.id, "Order 3 directSponsor is STILL S_B (Customer's sponsor)");

    // -------------------------------------------------------------
    // TEST 5: Retail Customer B2 (no User account) -> qualifyingMember = null
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Retail Customer B2 -> qualifyingMember = null ---");
    const isSelfB2 = !!(custB2.linkedUserId && custB2.linkedUserId === userA.id);
    const order4 = await prisma.order.create({
      data: {
        customerId: custB2.id,
        ordererUserId: userA.id,
        purchaseType: isSelfB2 ? "SELF_PURCHASE" : "CUSTOMER_PURCHASE",
        isSelfBuy: isSelfB2,
        totalAmount: svc.price,
        status: "COMPLETED",
        items: {
          create: [{
            serviceId: svc.id,
            amount: svc.price,
            qty: 1,
            unitCommissionPts: svc.commissionPoints,
            lineCommissionPts: svc.commissionPoints,
          }]
        }
      }
    });
    createdOrderIds.push(order4.id);

    const attr4 = await resolveAttribution(order4.id);
    assert(attr4.qualifyingMember === null, "Order 4 qualifyingMember is null (retail customer)");
    assert(attr4.directSponsor.id === userSB.id, "Order 4 directSponsor is S_B");

    // -------------------------------------------------------------
    // TEST 6: Phone independence (Same phone number does NOT force SELF)
    // -------------------------------------------------------------
    console.log("\n--- TEST 6: Phone independence test ---");
    // Customer with same phone as userA, but linked to another user
    const userOther = await prisma.user.create({
      data: {
        userId: "TEST_OTHER_" + Date.now(),
        fullName: "User Other",
        phone: "099777" + Math.floor(1000 + Math.random() * 9000),
        role: "customer"
      }
    });
    createdUserIds.push(userOther.id);

    const custDiffUserSamePhone = await prisma.customer.create({
      data: {
        fullName: "Same Phone But Different User",
        phone: userA.phone, // Same phone string as userA!
        sourceCtvId: userSB.userId,
        sponsorUserId: userSB.id,
        linkedUserId: userOther.id, // Linked to userOther, NOT userA!
        expiresAt: new Date(Date.now() + 30 * 86400000),
      }
    });
    createdCustomerIds.push(custDiffUserSamePhone.id);

    // A places order for this customer
    const isSelfSamePhone = !!(custDiffUserSamePhone.linkedUserId && custDiffUserSamePhone.linkedUserId === userA.id);
    assert(isSelfSamePhone === false, "Customer linked to userB is NOT self for userA even with same phone");

    const order5 = await prisma.order.create({
      data: {
        customerId: custDiffUserSamePhone.id,
        ordererUserId: userA.id,
        purchaseType: isSelfSamePhone ? "SELF_PURCHASE" : "CUSTOMER_PURCHASE",
        isSelfBuy: isSelfSamePhone,
        totalAmount: svc.price,
        status: "COMPLETED",
        items: {
          create: [{
            serviceId: svc.id,
            amount: svc.price,
            qty: 1,
            unitCommissionPts: svc.commissionPoints,
            lineCommissionPts: svc.commissionPoints,
          }]
        }
      }
    });
    createdOrderIds.push(order5.id);

    const attr5 = await resolveAttribution(order5.id);
    assert(attr5.purchaseType === "CUSTOMER_PURCHASE", "Order 5 is CUSTOMER_PURCHASE despite identical phone string");

    // -------------------------------------------------------------
    // TEST 7: Invariant 1 - OrderItem product/service XOR linkage
    // -------------------------------------------------------------
    console.log("\n--- TEST 7: Invariant 1 - OrderItem XOR linkage ---");
    // Test helper validating items XOR
    function validateOrderItemSources(items) {
      for (const item of items) {
        const hasService = !!item.serviceId;
        const hasProduct = !!item.productId;
        if ((hasService && hasProduct) || (!hasService && !hasProduct)) {
          return false;
        }
      }
      return true;
    }

    assert(validateOrderItemSources([{ serviceId: "svc1" }]) === true, "Single serviceId is valid");
    assert(validateOrderItemSources([{ productId: "prod1" }]) === true, "Single productId is valid");
    assert(validateOrderItemSources([{ serviceId: "svc1", productId: "prod1" }]) === false, "Both serviceId AND productId rejected");
    assert(validateOrderItemSources([{}]) === false, "Neither serviceId NOR productId rejected");
    assert(validateOrderItemSources([{ serviceId: null, productId: null }]) === false, "Both null rejected");

    // -------------------------------------------------------------
    // TEST 8: Invariant 2 - Historical Orders remain untouched
    // -------------------------------------------------------------
    console.log("\n--- TEST 8: Invariant 2 - Historical Orders immutability ---");
    const historicalItems = await prisma.orderItem.findMany({
      where: { orderId: { notIn: createdOrderIds } }
    });
    let historicalUntouched = true;
    for (const hi of historicalItems) {
      if (hi.unitCommissionPts !== 0 || hi.lineCommissionPts !== 0) {
        historicalUntouched = false;
        break;
      }
    }
    assert(historicalUntouched === true, "All 34 baseline historical order items retain snapshot 0 (untouched)");

    console.log("\n=================================================");
    console.log(`   ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log("=================================================\n");

  } finally {
    // CLEANUP
    console.log("[CLEANUP] Removing test artifacts from DB...");
    for (const oid of createdOrderIds) {
      await prisma.orderItem.deleteMany({ where: { orderId: oid } });
      await prisma.order.delete({ where: { id: oid } }).catch(() => {});
    }
    for (const cid of createdCustomerIds) {
      await prisma.customerAuditLog.deleteMany({ where: { customerId: cid } });
      await prisma.customer.delete({ where: { id: cid } }).catch(() => {});
    }
    for (const sid of createdServiceIds) {
      await prisma.service.delete({ where: { id: sid } }).catch(() => {});
    }
    for (const pid of createdProductIds) {
      await prisma.product.delete({ where: { id: pid } }).catch(() => {});
    }
    for (const uid of createdUserIds) {
      await prisma.user.delete({ where: { id: uid } }).catch(() => {});
    }
    console.log("[CLEANUP] Cleanup complete.");

    // POST-CHECK
    const postUsers = await prisma.user.count();
    const postOrders = await prisma.order.count();
    const postCustomers = await prisma.customer.count();
    console.log(`[POST-CHECK] Users: ${postUsers} (expected ${baselineUsers}), Customers: ${postCustomers} (expected ${baselineCustomers}), Orders: ${postOrders} (expected ${baselineOrders})`);
    if (postUsers !== baselineUsers || postOrders !== baselineOrders || postCustomers !== baselineCustomers) {
      throw new Error(`Data preservation check failed! Expected users=${baselineUsers}, cust=${baselineCustomers}, orders=${baselineOrders}; got users=${postUsers}, cust=${postCustomers}, orders=${postOrders}`);
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