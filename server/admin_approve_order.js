// Node 20 has native fetch
async function main() {
  const orderId = 'cmuu0c4c20005k597cilo36am';
  const baseUrl = 'http://localhost:3011';

  // 1. Login Admin (phone: 0999999999 / 123456)
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '0999999999', password: 'password123' })
  });
  const loginData = await loginRes.json();
  const cookies = loginRes.headers.get('set-cookie') || '';
  console.log('Admin Login attempt 1:', loginData.success);

  let activeCookie = cookies;
  if (!loginData.success) {
    const loginRes2 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '0999999999', password: '123' })
    });
    const d2 = await loginRes2.json();
    console.log('Admin Login attempt 2:', d2.success);
    activeCookie = loginRes2.headers.get('set-cookie') || '';
    if (!d2.success) {
      // Try 123456
      const loginRes3 = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '0999999999', password: '123456' })
      });
      const d3 = await loginRes3.json();
      console.log('Admin Login attempt 3:', d3.success);
      activeCookie = loginRes3.headers.get('set-cookie') || '';
    }
  }

  // Extract CSRF token from cookie
  const csrfMatch = activeCookie.match(/csrf_token=([^;]+)/);
  const csrfToken = csrfMatch ? decodeURIComponent(csrfMatch[1]) : '';

  // 2. Call PUT /api/admin/orders/:id/status -> COMPLETED
  const res = await fetch(`${baseUrl}/api/admin/orders/${orderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': activeCookie,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({ status: 'COMPLETED' })
  });

  const resData = await res.json();
  console.log('Order Status Update Result:', resData);
}

main().catch(console.error);
