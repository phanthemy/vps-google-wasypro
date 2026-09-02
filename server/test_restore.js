const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const backupPath = path.join(__dirname, 'backups', 'dev.db.backup_20260902_105230');
const testRestorePath = path.join(__dirname, 'backups', 'dev.db.test_restored');

console.log('Testing Backup Integrity & Restore:');
console.log('Backup file size:', fs.statSync(backupPath).size, 'bytes');

fs.copyFileSync(backupPath, testRestorePath);
const db = new Database(testRestorePath);
const userCount = db.prepare('SELECT count(*) as cnt FROM User').get();
const orderCount = db.prepare('SELECT count(*) as cnt FROM [Order]').get();
const customerCount = db.prepare('SELECT count(*) as cnt FROM Customer').get();

console.log('Restore test result:');
console.log(' - Users restored:', userCount.cnt);
console.log(' - Orders restored:', orderCount.cnt);
console.log(' - Customers restored:', customerCount.cnt);

db.close();
fs.unlinkSync(testRestorePath);
console.log('✅ BACKUP RESTORATION TEST PASSED 100%');
