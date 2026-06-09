const fs = require('fs');
let content = fs.readFileSync('C:/Users/Administrator/.gemini/antigravity/scratch/myspa/src/App.jsx', 'utf8');

// -------- UsersView Update --------
// Inject state & computed array
content = content.replace(
  /const \[currentPage, setCurrentPage\] = useState\(1\);/,
  `const [currentPage, setCurrentPage] = useState(1);\n  const [searchQuery, setSearchQuery] = useState('');\n\n  const computedUsers = users.filter(u => {\n    if (!searchQuery) return true;\n    const q = searchQuery.toLowerCase();\n    return (u.name?.toLowerCase() || '').includes(q) || (u.phone || '').includes(q);\n  });`
);

// Replace users usages with computedUsers
content = content.replace(
  /const totalSalesAll = users\.reduce/g,
  'const totalSalesAll = computedUsers.reduce'
);
content = content.replace(
  /const totalCommissionAll = users\.reduce/g,
  'const totalCommissionAll = computedUsers.reduce'
);
content = content.replace(
  /const rows = users\.map\(user => \[/g,
  'const rows = computedUsers.map(user => ['
);
content = content.replace(
  /<th>Cộng Tác Viên<\/th>\s*<th>Cấp Bậc<\/th>/,
  '<th>Cộng Tác Viên</th>\n                <th>Cấp Bậc</th>' // No change, just anchor
);
content = content.replace(
  /<tr>\s*<th>Cộng Tác Viên<\/th>/,
  '<tr>\n                <th>Cộng Tác Viên</th>' // No change
);
content = content.replace(
  /\{users\.slice\(\(currentPage - 1\) \* 20, currentPage \* 20\)\.map/g,
  '{computedUsers.slice((currentPage - 1) * 20, currentPage * 20).map'
);
content = content.replace(
  /\{users\.length\} <span className="text-sm font-normal text-muted">người<\/span>/g,
  '{computedUsers.length} <span className="text-sm font-normal text-muted">người</span>'
);

// Add search input in UsersView UI
content = content.replace(
  /<button className="btn btn-primary" onClick=\{onAddUser\}>\+ Thêm CTV Mới<\/button>/,
  `<input type="text" className="input-field" placeholder="🔎 Tìm Tên, SĐT CTV..." value={searchQuery} onChange={e => {setSearchQuery(e.target.value); setCurrentPage(1);}} style={{ padding: '6px', minWidth: '200px' }} />\n            <button className="btn btn-primary" onClick={onAddUser}>+ Thêm CTV Mới</button>`
);

// -------- CustomersView Update --------
// Inject state & computed array
content = content.replace(
  /const \[currentPage, setCurrentPage\] = useState\(1\);\n  const \[auditCustomer, setAuditCustomer\] = useState\(null\);/,
  `const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [auditCustomer, setAuditCustomer] = useState(null);

  const computedCustomers = customers.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const cName = (c.fullName || '').toLowerCase();
    const phone = c.phone || '';
    const ctvName = (c.sourceCtv?.fullName || '').toLowerCase();
    return cName.includes(q) || phone.includes(q) || ctvName.includes(q);
  });`
);

// Map customers arrays
content = content.replace(
  /\{customers\.slice\(\(currentPage - 1\) \* 20, currentPage \* 20\)\.map/g,
  '{computedCustomers.slice((currentPage - 1) * 20, currentPage * 20).map'
);

// Add search input in CustomersView UI
content = content.replace(
  /<button className="btn btn-action" onClick=\{onAddCustomer\}>\+ Pre-check Khách Mới<\/button>/,
  `<div className="flex gap-2 w-full justify-center">
            <input type="text" className="input-field" placeholder="🔎 Tìm Tên, SĐT Khách, Tên CTV..." value={searchQuery} onChange={e => {setSearchQuery(e.target.value); setCurrentPage(1);}} style={{ maxWidth: '400px' }} />
            <button className="btn btn-action" onClick={onAddCustomer}>+ Pre-check Khách Mới</button>
         </div>`
);

fs.writeFileSync('C:/Users/Administrator/.gemini/antigravity/scratch/myspa/src/App.jsx', content, 'utf8');
