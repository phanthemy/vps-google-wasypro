const fs = require('fs');
const iconv = require('iconv-lite');
const content = fs.readFileSync('C:/Users/Administrator/.gemini/antigravity/scratch/myspa/src/App.jsx.bak', 'utf8');
const buf = iconv.encode(content, 'win1252');
const restoredStr = iconv.decode(buf, 'utf8');
fs.writeFileSync('C:/Users/Administrator/.gemini/antigravity/scratch/myspa/src/App.jsx', restoredStr, 'utf8');
console.log('Restored!');

