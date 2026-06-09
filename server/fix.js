const Database = require('better-sqlite3');
const db = new Database('dev.db');
db.prepare(`UPDATE ServiceCategory SET name = 'Máy Lọc Nước' WHERE name LIKE '%NỘI KHOA%'`).run();
db.prepare(`UPDATE ServiceCategory SET name = 'Lõi Lọc' WHERE name LIKE '%Chăm sóc%'`).run();
db.prepare(`UPDATE ServiceCategory SET name = 'Phụ Kiện' WHERE name LIKE '%Phẫu thuật%'`).run();
console.log('Categories Updated');
