const fs = require('fs');

let appCode = fs.readFileSync('src/App.jsx', 'utf-8');

const h1Regex = /<h1 className="text-primary mt-2" style=\{\{ fontSize: '2rem', fontWeight: '800', lineHeight: 1\.2 \}\}>\{service\.name\}<\/h1>/g;
appCode = appCode.replace(h1Regex, <h1 className="mt-2" style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1.2, letterSpacing: '-1px', background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', width: 'fit-content', fontFamily: '\"Plus Jakarta Sans\", \"Outfit\", sans-serif' }}>{service.name}</h1>);

const imgInputRegex = /<input className="input-field" value=\{editForm\.imageUrl\} onChange=\{e => setEditForm\(\{\.\.\.editForm, imageUrl: e\.target\.value\}\)\} placeholder="\/Bang Gia Dich Vu\/Artboard x\.jpg ho?c chèn URL b?t k?\.\.\." \/>/;

const imgInputReplacement = \<div className=\"flex gap-2\">
  <input className=\"input-field\" style={{ flex: 1 }} value={editForm.imageUrl} onChange={e => setEditForm({...editForm, imageUrl: e.target.value})} placeholder=\"/Bang Gia Dich Vu/Artboard x.jpg ho?c chèn URL b?t k?...\" />
  <input type=\"file\" accept=\"image/*\" onChange={(e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
         setEditForm({...editForm, imageFileBase64: ev.target.result, imageUrl: file.name});
      };
      reader.readAsDataURL(file);
    }
  }} className=\"input-field p-1\" style={{ width: '200px', fontSize: '12px' }} />
</div>\;

appCode = appCode.replace(imgInputRegex, imgInputReplacement);
fs.writeFileSync('src/App.jsx', appCode, 'utf-8');

let htmlCode = fs.readFileSync('index.html', 'utf-8');
if (!htmlCode.includes('Plus Jakarta Sans')) {
  const fontLinks = \
    <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">
    <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>
    <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap\" rel=\"stylesheet\">
  \;
  htmlCode = htmlCode.replace('</head>', fontLinks + '</head>');
  fs.writeFileSync('index.html', htmlCode, 'utf-8');
}

let cssCode = fs.readFileSync('src/index.css', 'utf-8');
cssCode = cssCode.replace(/font-family: 'Outfit'/g, \ont-family: 'Plus Jakarta Sans', 'Outfit'\);
fs.writeFileSync('src/index.css', cssCode, 'utf-8');
console.log('Fix applied!');
