const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  console.log('1. Mở trang chủ...');
  await page.goto('http://localhost:5005', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  console.log('2. Click Đăng Nhập...');
  // Desktop view: click trên header
  await page.click('text=Đăng Nhập', { timeout: 5000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/home/ubuntu/test-screenshots/login-01-modal.png' });
  
  console.log('3. Nhập SĐT...');
  // Find input inside modal
  const phoneInput = page.locator('.fixed input[type="tel"]').first();
  await phoneInput.fill('0999999999');
  
  console.log('4. Nhập mật khẩu...');
  const pwInput = page.locator('.fixed input[type="password"]').first();
  await pwInput.fill('123456');
  await page.screenshot({ path: '/home/ubuntu/test-screenshots/login-02-filled.png' });
  
  console.log('5. Submit...');
  // Use locator inside modal, force click to bypass overlay
  const submitBtn = page.locator('.fixed button[type="submit"]').first();
  await submitBtn.click({ force: true, timeout: 5000 });
  
  console.log('6. Chờ response...');
  await page.waitForTimeout(4000);
  await page.screenshot({ path: '/home/ubuntu/test-screenshots/login-03-result.png' });
  
  // Check for error message
  const errorMsg = await page.locator('.fixed .bg-rose-50, .fixed .text-rose-700').first().textContent().catch(() => null);
  if (errorMsg) {
    console.log('❌ LOGIN FAIL:', errorMsg.trim());
  } else {
    // Check if modal is gone
    const modalCount = await page.locator('.fixed.inset-0.z-\\[9999\\]').count();
    if (modalCount === 0) {
      console.log('✅ LOGIN OK — Modal đã đóng');
      const url = page.url();
      console.log('   URL:', url);
      await page.screenshot({ path: '/home/ubuntu/test-screenshots/login-04-dashboard.png' });
    } else {
      // Check for success message inside modal
      const content = await page.locator('.fixed').first().textContent().catch(() => '');
      if (content.includes('thành công') || content.includes('success')) {
        console.log('✅ LOGIN OK (thông báo thành công)');
      } else {
        console.log('⚠️ Kết quả không rõ');
        console.log('   Modal still open, page URL:', page.url());
      }
    }
  }
  
  await browser.close();
  console.log('\n📸 Screenshots saved to /home/ubuntu/test-screenshots/');
})();
