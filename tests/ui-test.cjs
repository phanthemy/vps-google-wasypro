// /var/www/wasypro/tests/ui-test.js
// Playwright UI Test Suite cho WasyPro
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:5005';
const SCREENSHOT_DIR = '/home/ubuntu/test-screenshots';
const RESULTS = [];

async function screenshot(page, name) {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const fp = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: fp, fullPage: false });
  console.log(`  📸 ${name}.png`);
  return fp;
}

function pass(name) { RESULTS.push({ name, status: 'PASS' }); console.log(`  ✅ PASS: ${name}`); }
function fail(name, reason) { RESULTS.push({ name, status: 'FAIL', reason }); console.log(`  ❌ FAIL: ${name} — ${reason}`); }

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  
  // === TEST 1: Trang chủ load OK ===
  console.log('\n🧪 TEST 1: Trang chủ');
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const title = await page.title();
  if (title) pass('Trang chủ load'); else fail('Trang chủ load', 'No title');
  await screenshot(page, '01-homepage');

  // === TEST 2: Nút Đăng Nhập hiện, KHÔNG có Đăng Ký ===
  console.log('\n🧪 TEST 2: Nút Đăng Nhập (không Đăng Ký)');
  const loginBtn = await page.$('button:has-text("Đăng Nhập")');
  if (loginBtn) pass('Nút Đăng Nhập hiện'); else fail('Nút Đăng Nhập hiện', 'Không tìm thấy');
  
  const regBtn = await page.$('button:has-text("Đăng Ký"):visible');
  if (!regBtn) pass('Ẩn nút Đăng Ký trên trang chủ'); else fail('Ẩn nút Đăng Ký', 'Vẫn hiện');

  // === TEST 3: Click Đăng Nhập → Modal mở, CHỈ tab Đăng Nhập ===
  console.log('\n🧪 TEST 3: Modal Đăng Nhập');
  if (loginBtn) await loginBtn.click();
  await page.waitForTimeout(1000);
  await screenshot(page, '02-login-modal');
  
  const regTab = await page.$('button:has-text("ĐĂNG KÝ"):visible');
  if (!regTab) pass('Modal chỉ có tab Đăng Nhập'); else fail('Modal chỉ có tab Đăng Nhập', 'Tab ĐĂNG KÝ hiện');
  
  // Close modal
  const closeBtn = await page.$('button:has(svg.lucide-x)');
  if (closeBtn) await closeBtn.click();
  await page.waitForTimeout(500);

  // === TEST 4: Link ref → Modal Đăng Ký với header xanh ===
  console.log('\n🧪 TEST 4: Ref link → Form Đăng Ký');
  await page.goto(`${BASE}/?ref=U1001`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const regTabRef = await page.$('button:has-text("ĐĂNG KÝ"):visible');
  if (regTabRef) pass('Tab ĐĂNG KÝ hiện khi có ref'); else fail('Tab ĐĂNG KÝ hiện khi có ref', 'Không thấy');
  
  // Click ĐĂNG KÝ tab
  if (regTabRef) await regTabRef.click();
  await page.waitForTimeout(1000);
  await screenshot(page, '03-register-form');
  
  // Check header gradient (bg-gradient-to-b)
  const headerEl = await page.$('.bg-gradient-to-b');
  if (headerEl) {
    const bg = await headerEl.evaluate(el => window.getComputedStyle(el).backgroundImage);
    if (bg && bg !== 'none') pass('Header gradient xanh'); 
    else fail('Header gradient xanh', `backgroundImage = ${bg}`);
  } else {
    // Check for bg-primary-dark as fallback
    const headerAlt = await page.$('.bg-primary-dark');
    if (headerAlt) pass('Header bg-primary-dark'); else fail('Header gradient', 'Không tìm thấy header xanh');
  }

  // === TEST 5: Banner slides ===
  console.log('\n🧪 TEST 5: Banner slides');
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const bannerImg = await page.$('img[src*="banner"]');
  if (bannerImg) pass('Banner mới hiện'); else {
    const anySlide = await page.$('img[src*="slide"], video[src*="hero"]');
    if (anySlide) pass('Slide/video hiện'); else fail('Banner slides', 'Không thấy banner/slide');
  }
  await screenshot(page, '04-banner');

  // === TEST 6: Admin login ===
  console.log('\n🧪 TEST 6: Admin Dashboard');
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  await screenshot(page, '05-admin');
  
  const adminTitle = await page.$('text=Admin Dashboard');
  const loginForm = await page.$('input[type="password"]');
  if (adminTitle) pass('Admin Dashboard load'); 
  else if (loginForm) pass('Admin login form hiện');
  else fail('Admin Dashboard', 'Không load được');

  // === SUMMARY ===
  console.log('\n' + '='.repeat(50));
  console.log('📋 KẾT QUẢ TEST');
  console.log('='.repeat(50));
  const passed = RESULTS.filter(r => r.status === 'PASS').length;
  const failed = RESULTS.filter(r => r.status === 'FAIL').length;
  RESULTS.forEach(r => console.log(`  ${r.status === 'PASS' ? '✅' : '❌'} ${r.name}${r.reason ? ' — ' + r.reason : ''}`));
  console.log(`\n  TỔNG: ${passed} PASS / ${failed} FAIL / ${RESULTS.length} tests`);
  console.log(`  ${failed === 0 ? '🎉 ALL PASS' : '⚠️  CÓ LỖI CẦN FIX'}`);
  
  // Save results
  fs.writeFileSync(path.join(SCREENSHOT_DIR, 'results.json'), JSON.stringify(RESULTS, null, 2));
  
  await browser.close();
})();
