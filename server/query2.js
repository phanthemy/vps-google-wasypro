const Database = require('better-sqlite3');
const db = new Database('dev.db');
console.log(db.prepare(`SELECT fullName FROM Customer LIMIT 5`).all());
