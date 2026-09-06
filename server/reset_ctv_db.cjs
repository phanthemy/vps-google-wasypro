// reset_ctv_db.cjs — xoa data CTV cu, giu wasypro.com data
const Database = require('better-sqlite3');
const db = new Database('./dev.db');

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = OFF');

const run = db.transaction(() => {
  // 1. Xoa data CTV cu (FK order quan trong)
  db.prepare('DELETE FROM "WholesaleOrderItem"').run();
  db.prepare('DELETE FROM "WholesaleOrder"').run();
  db.prepare('DELETE FROM "CommissionProcessing"').run();
  db.prepare('DELETE FROM "Commission"').run();
  db.prepare('DELETE FROM "OrderItem"').run();
  db.prepare('DELETE FROM "Order"').run();
  db.prepare('DELETE FROM "SPointTransaction"').run();
  db.prepare('DELETE FROM "CommissionPointAuditLog"').run();
  db.prepare('DELETE FROM "RankHistory"').run();
  db.prepare('DELETE FROM "PeriodCloseAudit"').run();
  db.prepare('DELETE FROM "PeriodPolicyAuditLog"').run();
  db.prepare('DELETE FROM "PeriodPolicyConfig"').run();
  db.prepare('DELETE FROM "CommissionPeriod"').run();
  db.prepare('DELETE FROM "SystemPolicyAuditLog"').run();
  db.prepare('DELETE FROM "SystemPolicyConfig"').run();
  db.prepare('DELETE FROM "CommissionPriceRule"').run();
  db.prepare('DELETE FROM "Service"').run();
  db.prepare('DELETE FROM "ServiceCategory"').run();
  db.prepare('DELETE FROM "Appointment"').run();
  db.prepare('DELETE FROM "CustomerAuditLog"').run();
  db.prepare('DELETE FROM "AdminUser"').run();

  // 2. Reset BusinessIdSequence ve 1000
  db.prepare('DELETE FROM "BusinessIdSequence"').run();
  db.prepare('INSERT INTO "BusinessIdSequence" (id, nextVal) VALUES (1, 1000)').run();

  // 3. Reset User CTV fields (giu fullName, phone, password, role, parentId, userId)
  db.prepare(`
    UPDATE "User" SET
      sPoints = 0,
      totalSales = 0,
      totalCommission = 0,
      rank = NULL,
      rankStatus = NULL,
      qualifyingPoints = 0,
      isSystemParticipant = 0,
      participantAt = NULL,
      businessId = NULL
  `).run();

  console.log('Done resetting all CTV data.');
  console.log('User count (kept):', db.prepare('SELECT COUNT(*) as c FROM "User"').get().c);
  console.log('Customer count (kept):', db.prepare('SELECT COUNT(*) as c FROM "Customer"').get().c);
  console.log('Product count (kept):', db.prepare('SELECT COUNT(*) as c FROM "Product"').get().c);
  console.log('WebsiteOrder count (kept):', db.prepare('SELECT COUNT(*) as c FROM "WebsiteOrder"').get().c);
});

try {
  run();
} catch(e) {
  console.error('ERROR:', e.message);
  process.exit(1);
} finally {
  db.pragma('foreign_keys = ON');
  db.close();
}
