require('dotenv').config();
const http = require('http');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;

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
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

function assert(condition, message) {
  if (condition) console.log('  ✅ PASS: ' + message);
  else { console.error('  ❌ FAIL: ' + message); process.exit(1); }
}

async function run() {
  console.log('=================================================');
  console.log('   PHASE 2A & 2B REGRESSION TEST SUITE');
  console.log('=================================================');

  const app = require('../index.js');
  const server = app.listen(3997);

  try {
    const adminUser = await prisma.user.findUnique({ where: { userId: 'ADMIN01' } });
    const ctvUser = await prisma.user.findUnique({ where: { userId: 'S249' } });

    // Ensure mustChangePassword is false for testing
    await prisma.user.update({ where: { userId: 'S249' }, data: { mustChangePassword: false } });
    await prisma.user.update({ where: { userId: 'ADMIN01' }, data: { mustChangePassword: false } });

    const adminToken = jwt.sign({ userId: adminUser.userId, role: adminUser.role }, JWT_SECRET, { expiresIn: '1h' });
    const ctvToken = jwt.sign({ userId: ctvUser.userId, role: ctvUser.role }, JWT_SECRET, { expiresIn: '1h' });

    // 1. Wholesale price preview
    const wholesalePreview = await request({
      hostname: 'localhost', port: 3997, path: '/api/wholesale/price-preview?qty=5',
      method: 'GET',
      headers: { 'Cookie': `auth_token=${ctvToken}` }
    });
    assert(wholesalePreview.status === 200, 'GET /api/wholesale/price-preview returns 200');
    assert(wholesalePreview.body.data.discountRate === 0.35, '5 machines discount rate is 35%');

    const wholesalePreview10 = await request({
      hostname: 'localhost', port: 3997, path: '/api/wholesale/price-preview?qty=10',
      method: 'GET',
      headers: { 'Cookie': `auth_token=${ctvToken}` }
    });
    assert(wholesalePreview10.body.data.discountRate === 0.40, '10 machines discount rate is 40%');

    const wholesalePreview20 = await request({
      hostname: 'localhost', port: 3997, path: '/api/wholesale/price-preview?qty=20',
      method: 'GET',
      headers: { 'Cookie': `auth_token=${ctvToken}` }
    });
    assert(wholesalePreview20.body.data.discountRate === 0.45, '20 machines discount rate is 45%');

    // 2. Ambassador eligibility check
    const ambCheck = await request({
      hostname: 'localhost', port: 3997, path: '/api/rank/ambassador/check/S249',
      method: 'GET',
      headers: { 'Cookie': `auth_token=${ctvToken}` }
    });
    assert(ambCheck.status === 200, 'GET /api/rank/ambassador/check/:userId returns 200');
    assert(ambCheck.body.data.userId === 'S249', 'Ambassador check returns target user');

    // 3. S-Points inspection
    const sPointsRes = await request({
      hostname: 'localhost', port: 3997, path: '/api/s-points/S249',
      method: 'GET',
      headers: { 'Cookie': `auth_token=${ctvToken}` }
    });
    assert(sPointsRes.status === 200, 'GET /api/s-points/:userId returns 200');

    // 4. Product Types inspection
    const prodTypesRes = await request({
      hostname: 'localhost', port: 3997, path: '/api/services/product-types',
      method: 'GET',
      headers: { 'Cookie': `auth_token=${adminToken}` }
    });
    assert(prodTypesRes.status === 200, 'GET /api/services/product-types returns 200');

    // 5. Commission rules inspection
    const commRulesRes = await request({
      hostname: 'localhost', port: 3997, path: '/api/commission-rules',
      method: 'GET',
      headers: { 'Cookie': `auth_token=${adminToken}` }
    });
    assert(commRulesRes.status === 200, 'GET /api/commission-rules returns 200');

    console.log('=================================================');
    console.log('   ALL PHASE 2A & 2B REGRESSION TESTS PASSED!   ');
    console.log('=================================================');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

run().catch(err => {
  console.error('P2A/P2B test failed:', err);
  process.exit(1);
});