const fs = require('fs');
const path = require('path');

function replaceFileContent(filePath, rules) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;
  
  for (const rule of rules) {
    content = content.replace(rule.regex, rule.replacement);
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
}

const appJsxPath = path.join(__dirname, 'src', 'App.jsx');
const indexHtmlPath = path.join(__dirname, 'index.html');
const seedJsxPath = path.join(__dirname, 'server', 'seed.js');
const indexCssPath = path.join(__dirname, 'src', 'index.css');

// Rules
const appRules = [
  { regex: /Jinshang/g, replacement: 'HappyLife' },
  { regex: /JINSHANG/g, replacement: 'HAPPYLIFE' },
  { regex: /Medical Aesthetics/g, replacement: 'Water' },
  { regex: /MySpa/g, replacement: 'HappyLife' },
  { regex: /Dịch vụ/g, replacement: 'Sản Phẩm' },
  { regex: /dịch vụ/g, replacement: 'sản phẩm' },
  { regex: /bác sĩ/gi, replacement: 'kỹ thuật viên' },
  { regex: /khám/g, replacement: 'lắp đặt' },
  { regex: /liệu trình/gi, replacement: 'gói sản phẩm' },
  { regex: /điều trị/gi, replacement: 'bảo hành' },
  { regex: /phòng khám/gi, replacement: 'chi nhánh' },
  { regex: /MEDICAL AESTHETICS/g, replacement: 'WATER PURIFIER' }
];

if (fs.existsSync(appJsxPath)) replaceFileContent(appJsxPath, appRules);
if (fs.existsSync(indexHtmlPath)) replaceFileContent(indexHtmlPath, appRules);

// Replace seeding logic to Water Purifier
const seedRules = [
  { regex: /Dịch vụ/g, replacement: 'Sản Phẩm' },
  { regex: /Jinshang/g, replacement: 'HappyLife' },
  { regex: /căng bóng da/gi, replacement: 'máy lọc không khí' },
  { regex: /trị mụn/gi, replacement: 'lõi lọc thô' },
  { regex: /tiêm meso/gi, replacement: 'máy lóc nước R.O' },
  { regex: /trẻ hóa/gi, replacement: 'máy lóc nước Ion Kiềm' },
  { regex: /nâng cơ/gi, replacement: 'bộ tiền lọc' },
  { regex: /triệt lông/gi, replacement: 'vòi nước' }
];
if (fs.existsSync(seedJsxPath)) replaceFileContent(seedJsxPath, seedRules);

// Update colors in index.css to be watery blue
const cssRules = [
  { regex: /--grad-primary: linear-gradient.*/, replacement: '--grad-primary: linear-gradient(135deg, #0284C7, #06B6D4);' },
  { regex: /--accent-purple: #6366F1;/, replacement: '--accent-purple: #0284C7;' }
];
if (fs.existsSync(indexCssPath)) replaceFileContent(indexCssPath, cssRules);

console.log('Brand replacement complete!');
