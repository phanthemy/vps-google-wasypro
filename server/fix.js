import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
const db = new sqlite3.Database('/var/www/wasypro/server/dev.db');
const hash = await bcrypt.hash('123456', 10);
db.run("UPDATE User SET password = ?, mustChangePassword = 1 WHERE businessId = 'U1009'", [hash], () => {
    console.log('DONE');
});
