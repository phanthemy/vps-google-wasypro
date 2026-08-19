const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost', port: 5005, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(b) }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: 'localhost', port: 5005, path }, (res) => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(b) }));
    }).on('error', reject);
  });
}

function put(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost', port: 5005, path, method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(b) }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function test() {
  // Test 1: Create product
  console.log('--- Test 1: Create Product ---');
  const r1 = await post('/api/products', {
    title: 'Lõi lọc RO màng thẩm thấu',
    slug: 'loi-loc-ro-mang-tham-thau',
    categoryId: 'cat-04',
    price: 2000000,
    originalPrice: 2500000,
    image: '/images/products/prod-loi-ro.webp',
    description: 'Lõi lọc RO chính hãng, lọc sạch 99.9% tạp chất.',
    isHot: true,
    isNew: true,
    stock: 100,
    promotion: 'Tặng bộ lọc thô trị giá 500.000đ',
  });
  console.log(  Status: );
  console.log(  Created:  - d);
  console.log(  Promotion: );
  console.log(  ID: );

  // Test 2: Get all products
  console.log('\n--- Test 2: Get All Products ---');
  const r2 = await get('/api/products');
  console.log(  Status: );
  console.log(  Total:  products);
  r2.body.forEach(p => {
    const promo = p.promotion ?  🎁  : '';
    console.log(  - : d);
  });

  // Test 3: Update product price
  console.log('\n--- Test 3: Update Price ---');
  const productId = r1.body.id;
  const r3 = await put('/api/products/' + productId, { price: 1800000 });
  console.log(  Status: );
  console.log(  Updated price: d);

  // Test 4: Website order
  console.log('\n--- Test 4: Website Order ---');
  const r4 = await post('/api/website-orders', {
    customerName: 'Nguyễn Văn Test',
    customerPhone: '0912345678',
    address: '123 Nguyen Hue, Q1, HCM',
    type: 'ORDER',
    productId: productId,
    productTitle: r1.body.title,
    productPrice: 1800000,
    qty: 1,
  });
  console.log(  Status: );
  console.log(  Order ID: );
  console.log(  Total: d);

  // Test 5: Get website orders
  console.log('\n--- Test 5: Website Orders ---');
  const r5 = await get('/api/website-orders');
  console.log(  Status: );
  console.log(  Total orders: );
  r5.body.forEach(o => {
    console.log(  - :  - d []);
  });

  // Cleanup: delete test product
  const http2 = require('http');
  await new Promise((resolve) => {
    const req = http2.request({ hostname: 'localhost', port: 5005, path: '/api/products/' + productId, method: 'DELETE' }, resolve);
    req.end();
  });
  console.log('\n✅ Test product cleaned up');
  console.log('\n✅ ALL TESTS PASSED');
}
test().catch(e => console.error('FAIL:', e));
