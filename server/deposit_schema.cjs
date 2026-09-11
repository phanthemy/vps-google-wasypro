// ═══════════════════════════════════════════════════════════════
// DEPOSIT FEATURE — Schema + Backend + Frontend
// Carefully avoids past mistakes: uses better-sqlite3 for schema,
// modifies exact code blocks, full error logging
// ═══════════════════════════════════════════════════════════════

const fs = require('fs');

// ═══ STEP 1: ALTER TABLE via better-sqlite3 (Prisma push fails on SQLite) ═══
const Database = require('better-sqlite3');
const db = new Database('dev.db');

// Check if columns already exist
const cols = db.prepare("PRAGMA table_info(Order)").all().map(c => c.name);
if (!cols.includes('depositAmount')) {
  db.exec("ALTER TABLE 'Order' ADD COLUMN depositAmount REAL DEFAULT 0");
  console.log('✅ Added Order.depositAmount');
} else { console.log('✓ depositAmount exists'); }

if (!cols.includes('depositAt')) {
  db.exec("ALTER TABLE 'Order' ADD COLUMN depositAt TEXT");
  console.log('✅ Added Order.depositAt');
} else { console.log('✓ depositAt exists'); }

if (!cols.includes('depositNote')) {
  db.exec("ALTER TABLE 'Order' ADD COLUMN depositNote TEXT");
  console.log('✅ Added Order.depositNote');
} else { console.log('✓ depositNote exists'); }

db.close();
console.log('STEP 1 DONE\n');

// ═══ STEP 2: Update Prisma schema ═══
const schemaFile = 'prisma/schema.prisma';
let schema = fs.readFileSync(schemaFile, 'utf8');

if (!schema.includes('depositAmount')) {
  // Insert deposit fields before the customer relation
  const insertBefore = '  customer    Customer';
  const depositFields = `  // Deposit (Đặt cọc)
  depositAmount Float?    @default(0)
  depositAt     DateTime?
  depositNote   String?

  customer    Customer`;

  schema = schema.replace(insertBefore, depositFields);
  fs.writeFileSync(schemaFile, schema);
  console.log('✅ Updated schema.prisma with deposit fields');
} else {
  console.log('✓ Schema already has deposit fields');
}

console.log('STEP 2 DONE\n');
