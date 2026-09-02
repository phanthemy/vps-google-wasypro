const Database = require('better-sqlite3');
const path = require('path');

const backupPath = path.join(__dirname, 'backups', 'dev.db.backup_20260902_105230');
const currentPath = path.join(__dirname, 'dev.db');

const dbBackup = new Database(backupPath);
const dbCurrent = new Database(currentPath);

const tables = ['User', 'Customer', 'Order', 'OrderItem', 'Commission', 'Service', 'ServiceCategory', 'Product', 'ProductCategory', 'CustomerAuditLog'];

console.log('=== DATA AUDIT & RECONCILIATION ===');
console.log('Table'.padEnd(20) + 'Backup Before'.padEnd(16) + 'Current In DB');
console.log('-'.repeat(52));

for (const t of tables) {
  let cntBackup = 0;
  let cntCurrent = 0;
  try {
    const r = dbBackup.prepare('SELECT count(*) as cnt FROM [' + t + ']').get();
    cntBackup = r.cnt;
  } catch(e) { cntBackup = 'N/A'; }

  try {
    const r = dbCurrent.prepare('SELECT count(*) as cnt FROM [' + t + ']').get();
    cntCurrent = r.cnt;
  } catch(e) { cntCurrent = 'N/A'; }

  console.log(t.padEnd(20) + String(cntBackup).padEnd(16) + String(cntCurrent));
}

console.log('\n--- BACKUP USERS ---');
const backupUsers = dbBackup.prepare('SELECT id, userId, fullName, phone, role, tier, status FROM User').all();
console.table(backupUsers);

console.log('\n--- CURRENT USERS ---');
const currentUsers = dbCurrent.prepare('SELECT id, userId, fullName, phone, role, tier, status FROM User').all();
console.table(currentUsers);
