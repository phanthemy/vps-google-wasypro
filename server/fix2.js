const Database = require('better-sqlite3');
const db = new Database('dev.db');

// Rename old customers
db.prepare(`UPDATE Customer SET fullName = REPLACE(fullName, 'Silver', 'Đại sứ KD')`).run();
db.prepare(`UPDATE Customer SET fullName = REPLACE(fullName, 'Diamond', 'Giám đốc PT')`).run();
db.prepare(`UPDATE Customer SET fullName = REPLACE(fullName, 'Gold', 'Quản lý PT')`).run();

// Fix the ID / userId issue for creating the test users
// Just do it directly with better-sqlite3 to bypass prisma validation complexity
try {
  db.prepare(`INSERT OR IGNORE INTO User (id, phone, name, password, role, tier) VALUES ('GD01', '0990000001', 'Giám Đốc C', '1', 'ctv', 'DIAMOND')`).run();
  db.prepare(`INSERT OR IGNORE INTO User (id, phone, name, password, role, tier, parentId) VALUES ('QL02', '0990000002', 'Quản Lý B', '1', 'ctv', 'GOLD', 'GD01')`).run();
  db.prepare(`INSERT OR IGNORE INTO User (id, phone, name, password, role, tier, parentId) VALUES ('DS03', '0990000003', 'Đại Sứ A', '1', 'ctv', 'SILVER', 'QL02')`).run();

  // Ensure Customer for Đại Sứ A
  db.prepare(`INSERT OR IGNORE INTO Customer (id, fullName, phone, sourceCtvId) VALUES ('CUS03', 'Đại Sứ A (Tự Mua)', '0990000003', 'DS03')`).run();

  console.log("Fix ran successfully");
} catch(e) {
  console.log(e);
}
