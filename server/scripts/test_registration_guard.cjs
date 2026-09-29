const http = require('http');

function post(data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request('http://localhost:3011/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('=== TEST 1: Guest tries joinSystem:true without refCode ===');
  const t1 = await post({
    fullName: 'Khach Test 1',
    phone: '0999000111',
    joinSystem: true
  });
  console.log('Result 1 (expected 400):', t1.status, t1.data?.message);
  if (t1.status !== 400) throw new Error('Test 1 failed');

  console.log('=== TEST 2: Guest tries registerNpp:true without refCode ===');
  const t2 = await post({
    fullName: 'Khach Test 2',
    phone: '0999000222',
    registerNpp: true
  });
  console.log('Result 2 (expected 400):', t2.status, t2.data?.message);
  if (t2.status !== 400) throw new Error('Test 2 failed');

  console.log('=== TEST 3: Invalid refCode with joinSystem:true ===');
  const t3 = await post({
    fullName: 'Khach Test 3',
    phone: '0999000333',
    refCode: 'U999999_NON_EXISTENT',
    joinSystem: true
  });
  console.log('Result 3 (expected 400):', t3.status, t3.data?.message);
  if (t3.status !== 400) throw new Error('Test 3 failed');

  console.log('ALL REGISTRATION TESTS PASSED 100%!');
}

run().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
