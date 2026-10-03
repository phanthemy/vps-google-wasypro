const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'dev.db');
console.log('Connecting to database:', dbPath);
const db = new Database(dbPath);

// Check existing columns in User
const columns = db.prepare("PRAGMA table_info(User);").all().map(c => c.name);
console.log('Existing User columns count:', columns.length);

const addColumnIfNotExists = (colName, colDef) => {
  if (!columns.includes(colName)) {
    console.log(`Adding column ${colName}...`);
    db.prepare(`ALTER TABLE User ADD COLUMN ${colName} ${colDef};`).run();
    console.log(`Column ${colName} added successfully.`);
  } else {
    console.log(`Column ${colName} already exists.`);
  }
};

addColumnIfNotExists('email', 'TEXT');
addColumnIfNotExists('address', 'TEXT');
addColumnIfNotExists('bankAccount', 'TEXT');
addColumnIfNotExists('bankName', 'TEXT');
addColumnIfNotExists('bankBranch', 'TEXT');
addColumnIfNotExists('isBankLocked', 'BOOLEAN NOT NULL DEFAULT 0');

// Create CompanyDocument table if not exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS CompanyDocument (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'TERMS',
    fileUrl TEXT NOT NULL,
    description TEXT,
    version TEXT DEFAULT '1.0',
    isActive BOOLEAN NOT NULL DEFAULT 1,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`).run();
console.log('CompanyDocument table ready.');

// Insert default terms document if empty
const count = db.prepare("SELECT COUNT(*) as cnt FROM CompanyDocument WHERE id = 'doc-terms-01';").get().cnt;
if (count === 0) {
  db.prepare(`
    INSERT INTO CompanyDocument (id, title, category, fileUrl, description, version, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
  `).run(
    'doc-terms-01',
    'Quy chế hoạt động & Chính sách đối tác kinh doanh WasyPro',
    'TERMS',
    '/docs/quy-che-doi-tac-wasypro.pdf',
    'Văn bản quy định quyền lợi, hoa hồng và trách nhiệm đối tác kinh doanh WasyPro ban hành cập nhật mới nhất.',
    '2026.1'
  );
  console.log('Default company terms document inserted.');
}

db.close();
console.log('Database migration completed successfully!');
