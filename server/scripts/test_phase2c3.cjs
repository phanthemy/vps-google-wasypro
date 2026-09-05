const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function runTests() {
  console.log("=================================================");
  console.log("   PHASE 2C-3 TEST SUITE: COMM-POINTS & SNAPSHOTS");
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
  console.log(`[PRE-CHECK] Baseline Users: ${baselineUsers}, Orders: ${baselineOrders}`);

  // Get a test customer and category
  const testCustomer = await prisma.customer.findFirst();
  assert(!!testCustomer, "Test customer exists");
  let testCat = await prisma.serviceCategory.findFirst();
  if (!testCat) testCat = await prisma.serviceCategory.create({ data: { name: "TEST_CAT" } });

  let testProductCat = await prisma.productCategory.findFirst();
  if (!testProductCat) {
    testProductCat = await prisma.productCategory.create({
      data: { name: "TEST_PROD_CAT", slug: "test-prod-cat" }
    });
  }

  // Tracking created IDs for cleanup
  const createdOrderIds = [];
  const createdServiceIds = [];
  const createdProductIds = [];
  const createdAuditIds = [];

  try {
    // -------------------------------------------------------------
    // TEST 1: Service commissionPoints creation & audit log
    // -------------------------------------------------------------
    console.log("\n--- TEST 1: Service commissionPoints creation & audit log ---");
    const svc1 = await prisma.service.create({
      data: {
        name: "TEST_P2C3_Máy lọc nước RO Pro",
        price: 15000000,
        commissionPoints: 5000,
        categoryId: testCat.id,
      }
    });
    createdServiceIds.push(svc1.id);
    assert(svc1.commissionPoints === 5000, "Service 1 created with commissionPoints = 5000 (Integer)");

    const log1 = await prisma.commissionPointAuditLog.create({
      data: {
        itemType: "SERVICE",
        itemId: svc1.id,
        itemName: svc1.name,
        oldValue: null,
        newValue: 5000,
        actor: "ADMIN_TESTER",
        reason: "INITIAL_SERVICE_CREATION"
      }
    });
    createdAuditIds.push(log1.id);
    assert(log1.oldValue === null && log1.newValue === 5000 && log1.reason === "INITIAL_SERVICE_CREATION", "Audit log 1 recorded correctly");

    // -------------------------------------------------------------
    // TEST 2: OrderItem snapshot on Service with quantity > 1
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: OrderItem snapshot with qty > 1 ---");
    const qty2 = 2;
    const unitCP1 = svc1.commissionPoints;
    const lineCP1 = unitCP1 * qty2;

    const order1 = await prisma.order.create({
      data: {
        customerId: testCustomer.id,
        totalAmount: svc1.price * qty2,
        status: "COMPLETED",
        items: {
          create: [{
            serviceId: svc1.id,
            amount: svc1.price * qty2,
            qty: qty2,
            unitCommissionPts: unitCP1,
            lineCommissionPts: lineCP1,
          }]
        }
      },
      include: { items: true }
    });
    createdOrderIds.push(order1.id);
    assert(order1.items.length === 1, "Order 1 created with 1 item");
    assert(order1.items[0].unitCommissionPts === 5000, "Order 1 item unitCommissionPts = 5000");
    assert(order1.items[0].lineCommissionPts === 10000, "Order 1 item lineCommissionPts = 10000 (qty=2)");

    // -------------------------------------------------------------
    // TEST 3: Update Service commissionPoints & verify audit log
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Update Service commissionPoints & verify audit log ---");
    const updatedSvc1 = await prisma.service.update({
      where: { id: svc1.id },
      data: { commissionPoints: 6000 }
    });
    assert(updatedSvc1.commissionPoints === 6000, "Service 1 updated to commissionPoints = 6000");

    const log2 = await prisma.commissionPointAuditLog.create({
      data: {
        itemType: "SERVICE",
        itemId: svc1.id,
        itemName: svc1.name,
        oldValue: 5000,
        newValue: 6000,
        actor: "ADMIN_TESTER",
        reason: "PRICE_INDEX_ADJUSTMENT"
      }
    });
    createdAuditIds.push(log2.id);
    assert(log2.oldValue === 5000 && log2.newValue === 6000 && log2.reason === "PRICE_INDEX_ADJUSTMENT", "Audit log 2 records old=5000, new=6000, reason correctly");

    // -------------------------------------------------------------
    // TEST 4: IMMUTABILITY: Old Order STILL keeps snapshot 5000 & 10000
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: IMMUTABILITY - Old Order STILL keeps snapshot ---");
    const reloadedOrder1 = await prisma.order.findUnique({
      where: { id: order1.id },
      include: { items: true }
    });
    assert(reloadedOrder1.items[0].unitCommissionPts === 5000, "Old Order 1 item unitCommissionPts STILL = 5000 (NOT 6000)");
    assert(reloadedOrder1.items[0].lineCommissionPts === 10000, "Old Order 1 item lineCommissionPts STILL = 10000");

    // -------------------------------------------------------------
    // TEST 5: New Order after change gets NEW snapshot 6000
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: New Order after change gets new snapshot 6000 ---");
    const qty3 = 3;
    const unitCP2 = updatedSvc1.commissionPoints;
    const lineCP2 = unitCP2 * qty3;

    const order2 = await prisma.order.create({
      data: {
        customerId: testCustomer.id,
        totalAmount: updatedSvc1.price * qty3,
        status: "COMPLETED",
        items: {
          create: [{
            serviceId: updatedSvc1.id,
            amount: updatedSvc1.price * qty3,
            qty: qty3,
            unitCommissionPts: unitCP2,
            lineCommissionPts: lineCP2,
          }]
        }
      },
      include: { items: true }
    });
    createdOrderIds.push(order2.id);
    assert(order2.items[0].unitCommissionPts === 6000, "New Order 2 item unitCommissionPts = 6000");
    assert(order2.items[0].lineCommissionPts === 18000, "New Order 2 item lineCommissionPts = 18000 (qty=3)");

    // -------------------------------------------------------------
    // TEST 6: Product commissionPoints creation, update & Order snapshot
    // -------------------------------------------------------------
    console.log("\n--- TEST 6: Product commissionPoints creation, update & Order snapshot ---");
    const prod1 = await prisma.product.create({
      data: {
        title: "TEST_P2C3_Máy tạo kiềm Hydrogen",
        slug: "test-p2c3-may-tao-kiem-" + Date.now(),
        categoryId: testProductCat.id,
        price: 22000000,
        commissionPoints: 3000,
      }
    });
    createdProductIds.push(prod1.id);
    assert(prod1.commissionPoints === 3000, "Product created with commissionPoints = 3000");

    const log3 = await prisma.commissionPointAuditLog.create({
      data: {
        itemType: "PRODUCT",
        itemId: prod1.id,
        itemName: prod1.title,
        oldValue: null,
        newValue: 3000,
        actor: "ADMIN_TESTER",
        reason: "INITIAL_PRODUCT_CREATION"
      }
    });
    createdAuditIds.push(log3.id);
    assert(log3.newValue === 3000 && log3.itemType === "PRODUCT", "Audit log 3 for Product recorded");

    // Order with Product
    const order3 = await prisma.order.create({
      data: {
        customerId: testCustomer.id,
        totalAmount: prod1.price,
        status: "COMPLETED",
        items: {
          create: [{
            productId: prod1.id,
            amount: prod1.price,
            qty: 1,
            unitCommissionPts: 3000,
            lineCommissionPts: 3000,
          }]
        }
      },
      include: { items: true }
    });
    createdOrderIds.push(order3.id);
    assert(order3.items[0].productId === prod1.id, "Order 3 created with productId");
    assert(order3.items[0].unitCommissionPts === 3000, "Order 3 item unitCommissionPts = 3000");
    assert(order3.items[0].lineCommissionPts === 3000, "Order 3 item lineCommissionPts = 3000");

    // Update Product commissionPoints
    const updatedProd1 = await prisma.product.update({
      where: { id: prod1.id },
      data: { commissionPoints: 4500 }
    });
    assert(updatedProd1.commissionPoints === 4500, "Product updated to commissionPoints = 4500");

    // Verify Order 3 STILL keeps 3000
    const reloadedOrder3 = await prisma.order.findUnique({
      where: { id: order3.id },
      include: { items: true }
    });
    assert(reloadedOrder3.items[0].unitCommissionPts === 3000, "Order 3 with Product STILL keeps snapshot 3000 (NOT 4500)");

    // -------------------------------------------------------------
    // TEST 7: Zero commission points test
    // -------------------------------------------------------------
    console.log("\n--- TEST 7: Zero commission points test ---");
    const svcZero = await prisma.service.create({
      data: {
        name: "TEST_P2C3_Dịch vụ vệ sinh lọc miễn phí",
        price: 0,
        commissionPoints: 0,
        categoryId: testCat.id,
      }
    });
    createdServiceIds.push(svcZero.id);

    const orderZero = await prisma.order.create({
      data: {
        customerId: testCustomer.id,
        totalAmount: 0,
        status: "COMPLETED",
        items: {
          create: [{
            serviceId: svcZero.id,
            amount: 0,
            qty: 5,
            unitCommissionPts: 0,
            lineCommissionPts: 0,
          }]
        }
      },
      include: { items: true }
    });
    createdOrderIds.push(orderZero.id);
    assert(orderZero.items[0].unitCommissionPts === 0, "Zero CP Service item unitCommissionPts = 0");
    assert(orderZero.items[0].lineCommissionPts === 0, "Zero CP Service item lineCommissionPts = 0 with qty=5");

    console.log("\n=================================================");
    console.log(`   ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log("=================================================\n");

  } finally {
    // CLEANUP TEST DATA SAFELY
    console.log("[CLEANUP] Removing test artifacts from DB...");
    for (const oid of createdOrderIds) {
      await prisma.orderItem.deleteMany({ where: { orderId: oid } });
      await prisma.order.delete({ where: { id: oid } }).catch(() => {});
    }
    for (const sid of createdServiceIds) {
      await prisma.service.delete({ where: { id: sid } }).catch(() => {});
    }
    for (const pid of createdProductIds) {
      await prisma.product.delete({ where: { id: pid } }).catch(() => {});
    }
    for (const aid of createdAuditIds) {
      await prisma.commissionPointAuditLog.delete({ where: { id: aid } }).catch(() => {});
    }
    console.log("[CLEANUP] Cleanup complete.");

    // Post-check counts
    const postUsers = await prisma.user.count();
    const postOrders = await prisma.order.count();
    console.log(`[POST-CHECK] Final Users: ${postUsers} (expected ${baselineUsers}), Orders: ${postOrders} (expected ${baselineOrders})`);
    if (postUsers !== baselineUsers || postOrders !== baselineOrders) {
      throw new Error(`Data preservation check failed! Baseline was users=${baselineUsers}, orders=${baselineOrders}; got users=${postUsers}, orders=${postOrders}`);
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