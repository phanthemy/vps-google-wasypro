const fs = require('fs');
try {
  const content = fs.readFileSync('C:/Users/Administrator/.gemini/antigravity/scratch/myspa/src/App.jsx.bak', 'utf8');
  // the file has utf-8 chars representing windows-1252 interpreted bytes
  const buf = Buffer.alloc(content.length);
  for(let i=0; i<content.length; i++){
    buf[i] = content.charCodeAt(i) & 0xFF;
  }
  const restoredStr = new TextDecoder('utf-8').decode(buf);
  if (restoredStr.includes('Tổng quan')) {
     fs.writeFileSync('C:/Users/Administrator/.gemini/antigravity/scratch/myspa/src/App.jsx', restoredStr, 'utf8');
     console.log('SUCCESS');
  } else {
     console.log('FAILED');
  }
} catch (e) {
  console.log(e);
}

