const fs = require('fs');

let appCode = fs.readFileSync('src/App.jsx', 'utf-8');

// Sidebar logo replacement
const sidebarLogoRegex = /<div className="p-2 rounded-xl" style=\{\{ background: 'var\(--grad-primary\)', color: 'white' \}\}>\s*<Layers size=\{24\} \/>\s*<\/div>\s*<span className="logo-text text-gradient">MySpa ☁️<\/span>/g;
const newSidebarLogo = `<img src="/logo.jpg" alt="Jinshang Logo" style={{ maxHeight: '42px', objectFit: 'contain' }} />`;
appCode = appCode.replace(sidebarLogoRegex, newSidebarLogo);

// Text replacements
appCode = appCode.replace(/Giới thiệu Myspa/g, 'Giới thiệu Jinshang');
appCode = appCode.replace(/Thông Tin Hợp Tác Myspa/g, 'Thông Tin Hợp Tác Jinshang');
appCode = appCode.replace(/cài đặt ứng dụng MySpa/g, 'cài đặt ứng dụng Jinshang');
appCode = appCode.replace(/<h2 className="text-primary" style=\{\{ margin: 0 \}\}>MySpa<\/h2>/g, '<h2 className="text-primary" style={{ margin: 0 }}>Jinshang</h2>');
appCode = appCode.replace(/MYSPA PREMIUM CLINIC/g, 'JINSHANG MEDICAL AESTHETICS');
appCode = appCode.replace(/Cơ sở Myspa/g, 'Cơ sở Jinshang');
appCode = appCode.replace(/bác sĩ tại Myspa/g, 'bác sĩ tại Jinshang');
appCode = appCode.replace(/"Myspa không chỉ là/g, '"Jinshang không chỉ là');

// Let's also ensure Document Title in index.html is changed
let indexCode = fs.readFileSync('index.html', 'utf-8');
indexCode = indexCode.replace(/<title>Vite \+ React<\/title>/g, '<title>Jinshang Medical Aesthetics</title>');
indexCode = indexCode.replace(/<title>MySpa<\/title>/g, '<title>Jinshang Medical Aesthetics</title>');
fs.writeFileSync('index.html', indexCode, 'utf-8');

fs.writeFileSync('src/App.jsx', appCode, 'utf-8');
console.log('Brand updated to Jinshang!');
