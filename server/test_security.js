const fs = require('fs');
const path = require('path');
const http = require('http');

// Setup isolated test database before loading Prisma / App
const devDbPath = path.join(__dirname, 'dev.db');
const testDbPath = path.join(__dirname, 'test.db');
fs.copyFileSync(devDbPath, testDbPath);

process.env.DATABASE_URL = 'file:../test.db';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'wasypro_secure_test_secret_key_1234567890';
process.env.JWT_EXPIRES_IN = '24h';
process.env.NODE_ENV = 'development';

const app = require('./index.js');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { encryptFileGCM, verifyAndDecryptGCM, testTamperDetection } = require('./encrypt_backup.js');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:../test.db'
    }
  }
});

let server;
const testPort = 3998;

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch (e) { json = body; }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

function extractCookie(setCookieHeaders, cookieName) {
  if (!setCookieHeaders) return null;
  for (const c of setCookieHeaders) {
    const match = c.match(new RegExp(`^${cookieName}=([^;]+)`));
    if (match) return match[1];
  }
  return null;
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING COMPREHENSIVE PHASE 1A VERIFICATION SUITE');
  console.log('⚡ Target Database: server/test.db (Isolated & Clean)');
  console.log('====================================================\n');

  server = app.listen(testPort);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Unauthenticated request protection (401)
    // -------------------------------------------------------------
    console.log('[TEST 1] Unauthenticated Request Protection (401)');
    const res1 = await request({ hostname: 'localhost', port: testPort, path: '/api/users', method: 'GET' });
    assert(res1.status === 401, 'GET /api/users without auth returns 401');

    const res1b = await request({ hostname: 'localhost', port: testPort, path: '/api/orders', method: 'GET' });
    assert(res1b.status === 401, 'GET /api/orders without auth returns 401');

    const res1c = await request({ hostname: 'localhost', port: testPort, path: '/api/commissions', method: 'GET' });
    assert(res1c.status === 401, 'GET /api/commissions without auth returns 401');

    // -------------------------------------------------------------
    // TEST 2: HttpOnly Cookie Auth, CSRF Token & Zero Token in Body
    // -------------------------------------------------------------
    console.log('\n[TEST 2] HttpOnly Cookie Auth, CSRF Token & Zero Token in Body');
    const tempAdminPwd = 'AdminTemp@2026!';
    const hashedTempAdmin = await bcrypt.hash(tempAdminPwd, 10);
    await prisma.user.update({
      where: { userId: 'ADMIN01' },
      data: { password: hashedTempAdmin, mustChangePassword: true }
    });

    const adminLoginRes = await request({
      hostname: 'localhost', port: testPort, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { phone: '0999999999', password: tempAdminPwd });

    assert(adminLoginRes.status === 200, 'Admin login with valid password returns 200');
    assert(adminLoginRes.body.requirePasswordChange === true, 'Admin login returns requirePasswordChange: true');
    assert(!adminLoginRes.body.token, 'Token string is NOT leaked in JSON response body');
    assert(!adminLoginRes.body.data.password, 'Password is NOT exposed in response');

    const setCookie = adminLoginRes.headers['set-cookie'];
    assert(setCookie && setCookie.some(c => c.includes('auth_token') && c.includes('HttpOnly')), 'Set-Cookie issues HttpOnly auth_token');
    assert(setCookie && setCookie.some(c => c.includes('csrf_token')), 'Set-Cookie issues csrf_token');

    const authTokenCookie = extractCookie(setCookie, 'auth_token');
    const csrfTokenCookie = extractCookie(setCookie, 'csrf_token');
    const adminCookieHeader = `auth_token=${authTokenCookie}; csrf_token=${csrfTokenCookie}`;

    // -------------------------------------------------------------
    // TEST 3: Strict Blockade of Business APIs when mustChangePassword = true
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Strict Blockade of Business APIs (mustChangePassword = true)');
    const blockedCust = await request({
      hostname: 'localhost', port: testPort, path: '/api/customers', method: 'GET',
      headers: { 'Cookie': adminCookieHeader }
    });
    assert(blockedCust.status === 403 && blockedCust.body.code === 'PASSWORD_CHANGE_REQUIRED', 'GET /api/customers BLOCKED (403 PASSWORD_CHANGE_REQUIRED)');

    const blockedOrders = await request({
      hostname: 'localhost', port: testPort, path: '/api/orders', method: 'GET',
      headers: { 'Cookie': adminCookieHeader }
    });
    assert(blockedOrders.status === 403 && blockedOrders.body.code === 'PASSWORD_CHANGE_REQUIRED', 'GET /api/orders BLOCKED (403 PASSWORD_CHANGE_REQUIRED)');

    const blockedDashboard = await request({
      hostname: 'localhost', port: testPort, path: '/api/dashboard', method: 'GET',
      headers: { 'Cookie': adminCookieHeader }
    });
    assert(blockedDashboard.status === 403 && blockedDashboard.body.code === 'PASSWORD_CHANGE_REQUIRED', 'GET /api/dashboard BLOCKED (403 PASSWORD_CHANGE_REQUIRED)');

    const allowedSessionCheck = await request({
      hostname: 'localhost', port: testPort, path: '/api/auth/me', method: 'GET',
      headers: { 'Cookie': adminCookieHeader }
    });
    assert(allowedSessionCheck.status === 200, 'GET /api/auth/me ALLOWED for session inspection (200)');

    // -------------------------------------------------------------
    // TEST 4: Password Change Self-Only & Policy Enforcement
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Password Change Self-Only & Strong Policy Enforcement');
    // Attempting to change someone else's password by modifying :id
    const tamperOtherPass = await request({
      hostname: 'localhost', port: testPort, path: '/api/users/ACC01/password', method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookieHeader, 'X-CSRF-Token': csrfTokenCookie }
    }, { oldPassword: tempAdminPwd, newPassword: 'NewSecureAdminPass@2026!' });
    assert(tamperOtherPass.status === 403, 'Attempting to change another user\'s password by altering :id returns 403 Forbidden');

    // Attempting weak password
    const weakPassRes = await request({
      hostname: 'localhost', port: testPort, path: '/api/users/ADMIN01/password', method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookieHeader, 'X-CSRF-Token': csrfTokenCookie }
    }, { oldPassword: tempAdminPwd, newPassword: '123' });
    assert(weakPassRes.status === 400, 'Weak password rejected by strict password policy (400)');

    // Successful self password change with strong password
    const strongNewAdminPass = 'AdminMaster#2026!Secure';
    const successfulPassChange = await request({
      hostname: 'localhost', port: testPort, path: '/api/users/ADMIN01/password', method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookieHeader, 'X-CSRF-Token': csrfTokenCookie }
    }, { oldPassword: tempAdminPwd, newPassword: strongNewAdminPass });
    assert(successfulPassChange.status === 200, 'Self password change with strong password succeeds (200)');

    // Business API access unlocked after password change
    const unlockedDashboard = await request({
      hostname: 'localhost', port: testPort, path: '/api/dashboard', method: 'GET',
      headers: { 'Cookie': adminCookieHeader }
    });
    assert(unlockedDashboard.status === 200, 'Business API access unlocked after mustChangePassword set to false (200)');

    // -------------------------------------------------------------
    // TEST 5: CSRF Double-Submit Protection on State-Changing Requests
    // -------------------------------------------------------------
    console.log('\n[TEST 5] CSRF Double-Submit Protection on State-Changing Requests');
    // POST /api/customers with cookie auth but MISSING X-CSRF-Token header
    const csrfMissing = await request({
      hostname: 'localhost', port: testPort, path: '/api/customers', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookieHeader }
    }, { fullName: 'CSRF Attack Test', phone: '0901112233' });
    assert(csrfMissing.status === 403 && csrfMissing.body.code === 'CSRF_VALIDATION_FAILED', 'Mutating request without X-CSRF-Token header returns 403 CSRF_VALIDATION_FAILED');

    // POST /api/customers with INVALID X-CSRF-Token header
    const csrfInvalid = await request({
      hostname: 'localhost', port: testPort, path: '/api/customers', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookieHeader, 'X-CSRF-Token': 'fraudulent_csrf_token' }
    }, { fullName: 'CSRF Attack Test', phone: '0901112233' });
    assert(csrfInvalid.status === 403 && csrfInvalid.body.code === 'CSRF_VALIDATION_FAILED', 'Mutating request with invalid X-CSRF-Token returns 403 CSRF_VALIDATION_FAILED');

    // POST /api/customers with VALID matching X-CSRF-Token header
    const validCustPhone = '0901' + Math.floor(100000 + Math.random() * 900000);
    const csrfValid = await request({
      hostname: 'localhost', port: testPort, path: '/api/customers', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookieHeader, 'X-CSRF-Token': csrfTokenCookie }
    }, { fullName: 'Khách hàng Hợp lệ', phone: validCustPhone, sourceCtvId: 'S249' });
    assert(csrfValid.status === 200, 'Mutating request with valid X-CSRF-Token succeeds (200)');
    const createdCustomerId = csrfValid.body.data.id;

    // -------------------------------------------------------------
    // TEST 6: Dedicated Admin Password Reset Endpoint
    // -------------------------------------------------------------
    console.log('\n[TEST 6] Dedicated Admin Password Reset Endpoint');
    const adminResetRes = await request({
      hostname: 'localhost', port: testPort, path: '/api/admin/users/S249/reset-password', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookieHeader, 'X-CSRF-Token': csrfTokenCookie }
    });
    assert(adminResetRes.status === 200, 'Admin can reset password for CTV S249 (200)');
    assert(!!adminResetRes.body.tempPassword, 'Admin receives temporary generated password');

    const targetCtv = await prisma.user.findUnique({ where: { userId: 'S249' } });
    assert(targetCtv.mustChangePassword === true, 'Target user mustChangePassword set to true');

    // -------------------------------------------------------------
    // TEST 7: Paid Commission Cancellation REVERSAL Audit Protocol
    // -------------------------------------------------------------
    console.log('\n[TEST 7] Paid Commission Cancellation REVERSAL Audit Protocol');
    let service = await prisma.service.findFirst({ where: { commissionPoints: { gt: 0 } } });
    if (!service) {
      let cat = await prisma.serviceCategory.findFirst();
      if (!cat) cat = await prisma.serviceCategory.create({ data: { name: 'Máy lọc nước' } });
      service = await prisma.service.create({
        data: { name: 'Máy Water King WS-03', price: 10000000, commissionPoints: 2000, categoryId: cat.id }
      });
    }

    // Create Order
    const orderCreateRes = await request({
      hostname: 'localhost', port: testPort, path: '/api/orders', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookieHeader, 'X-CSRF-Token': csrfTokenCookie }
    }, {
      customerId: createdCustomerId,
      items: [{ serviceId: service.id, amount: 10000000, qty: 1 }]
    });

    assert(orderCreateRes.status === 200, 'Order created successfully (200)');
    const orderId = orderCreateRes.body.data.id;

    // Simulate marking commission as PAID (e.g. accounting disbursement)
    const comms = await prisma.commission.findMany({ where: { orderId } });
    assert(comms.length > 0, `Order generated ${comms.length} commission record(s)`);
    const originalPaidAmount = comms[0].amount;

    await prisma.commission.update({
      where: { id: comms[0].id },
      data: { status: 'PAID' }
    });

    // Cancel Order
    const cancelRes = await request({
      hostname: 'localhost', port: testPort, path: `/api/orders/${orderId}`, method: 'DELETE',
      headers: { 'Cookie': adminCookieHeader, 'X-CSRF-Token': csrfTokenCookie }
    });
    assert(cancelRes.status === 200, 'Cancel order returns 200');

    // Verify REVERSAL record creation
    const allCommsAfterCancel = await prisma.commission.findMany({ where: { orderId } });
    const reversalRecord = allCommsAfterCancel.find(c => c.type === 'REVERSAL');
    assert(reversalRecord !== undefined, 'Exact REVERSAL commission record created for PAID commission');
    assert(reversalRecord && reversalRecord.amount === -originalPaidAmount, `REVERSAL record amount matches negative paid amount (${reversalRecord ? reversalRecord.amount : 0})`);
    assert(reversalRecord && reversalRecord.status === 'COMPLETED', 'REVERSAL record marked as COMPLETED');

    // -------------------------------------------------------------
    // TEST 8: Real-Time Account Lock & Role Demotion Check
    // -------------------------------------------------------------
    console.log('\n[TEST 8] Real-Time Account Lock & Role Demotion Check');
    // Lock Admin
    await prisma.user.update({
      where: { userId: 'ADMIN01' },
      data: { status: 'INACTIVE' }
    });
    const lockedAdminReq = await request({
      hostname: 'localhost', port: testPort, path: '/api/dashboard', method: 'GET',
      headers: { 'Cookie': adminCookieHeader }
    });
    assert(lockedAdminReq.status === 403, 'Request with unexpired session from LOCKED account returns 403 immediately');

    // Unlock Admin
    await prisma.user.update({
      where: { userId: 'ADMIN01' },
      data: { status: 'ACTIVE' }
    });

    // Demote Admin to CTV in DB
    await prisma.user.update({
      where: { userId: 'ADMIN01' },
      data: { role: 'ctv' }
    });
    const demotedAdminReq = await request({
      hostname: 'localhost', port: testPort, path: '/api/internal-users', method: 'GET',
      headers: { 'Cookie': adminCookieHeader }
    });
    assert(demotedAdminReq.status === 403, 'Request with admin cookie fails when DB role demoted to ctv (403)');

    // Restore Admin role
    await prisma.user.update({
      where: { userId: 'ADMIN01' },
      data: { role: 'admin' }
    });

    // -------------------------------------------------------------
    // TEST 9: AES-256-GCM Backup Encryption & Tamper Detection
    // -------------------------------------------------------------
    console.log('\n[TEST 9] AES-256-GCM Backup Encryption & Tamper Detection');
    const testVaultFile = path.join(__dirname, 'test_vault.enc');
    encryptFileGCM(testDbPath, testVaultFile);
    const decryptedBytes = verifyAndDecryptGCM(testVaultFile);
    assert(decryptedBytes.length > 0, 'AES-256-GCM encrypted backup decrypted and verified successfully');

    const tamperCaught = testTamperDetection(testVaultFile);
    assert(tamperCaught === true, 'AES-256-GCM authentication tag successfully caught and rejected tampered byte');
    if (fs.existsSync(testVaultFile)) fs.unlinkSync(testVaultFile);

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test runner error:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
    await prisma.$disconnect();
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch (e) {}
    }
  }
}

runTests();
