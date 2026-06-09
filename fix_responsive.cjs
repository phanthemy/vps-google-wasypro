const fs = require('fs');

let appCode = fs.readFileSync('src/App.jsx', 'utf-8');

// 1. Service Detail View Title
const detailTitleRegex = /<h1 className="mt-2" style=\{\{ fontSize: '2\.5rem'/g;
appCode = appCode.replace(detailTitleRegex, `<h1 className="mt-2 mb-2" style={{ wordBreak: 'break-word', fontSize: 'clamp(1.75rem, 6vw, 2.5rem)'`);

// 2. File Upload flex layout
const fileUploadRegex = /<input className="input-field" style=\{\{ flex: 1 \}\} value=\{editForm\.imageUrl\}/;
if (fileUploadRegex.test(appCode)) {
    // the wrapper was: <div className="flex gap-2"> -> let's make it flex-wrap
    const wrappedStr = /<div className="flex gap-2">\s*<input className="input-field" style=\{\{ flex: 1 \}\} value=\{editForm\.imageUrl\}/;
    appCode = appCode.replace(wrappedStr, `<div className="flex flex-wrap gap-2">\n                                     <input className="input-field" style={{ flex: 1, minWidth: '200px' }} value={editForm.imageUrl}`);
}

const imgInputFileRegex = /width: '200px'/;
appCode = appCode.replace(imgInputFileRegex, `width: '100%', maxWidth: '250px'`);

// 3. Edit input price responsive
const editPriceRegex = /<input type="number" className="input-field" value=\{editForm\.price\} onChange=\{e => setEditForm\(\{\.\.\.editForm, price: e\.target\.value\}\)\} style=\{\{ padding: '6px', width: '120px' \}\} autoFocus \/>/;
appCode = appCode.replace(editPriceRegex, `<input type="number" className="input-field" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} style={{ padding: '6px', width: '100px', minWidth: '80px' }} autoFocus />`);

fs.writeFileSync('src/App.jsx', appCode, 'utf-8');

console.log('Responsive Fix applied!');
