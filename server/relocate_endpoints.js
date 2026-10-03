const fs = require('fs');
const path = require('path');

const serverIndexPath = path.join(__dirname, 'index.js');
let code = fs.readFileSync(serverIndexPath, 'utf8');

// Cut the block if it exists
const startMarker = '// === ENDPOINT_CTV_PROFILE_NETWORK_TERMS ===';
const endMarker = 'console.error(\'Network summary error:\', err);\n       res.status(500).json({ success: false, message: \'Lỗi tải dữ liệu mạng lưới: \' + err.message });\n     }\n   });';

if (code.includes(startMarker)) {
  const startIdx = code.indexOf(startMarker);
  const endIdx = code.indexOf(endMarker) + endMarker.length;
  const block = code.substring(startIdx, endIdx);
  code = code.substring(0, startIdx) + code.substring(endIdx);
  
  // Now place block right before "// START SERVER"
  const startServerMarker = '// START SERVER';
  if (code.includes(startServerMarker)) {
    code = code.replace(startServerMarker, block + '\n\n' + startServerMarker);
  } else {
    code += '\n\n' + block;
  }
}

fs.writeFileSync(serverIndexPath, code, 'utf8');
console.log('Moved endpoints after authenticateToken and before server start successfully!');
