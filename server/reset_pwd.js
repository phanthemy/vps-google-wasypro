const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('/var/www/wasypro/server/dev.db');
bcrypt.hash('123456', 10, function(err, hash) {
  if (err) throw err;
  db.run("UPDATE User SET password = ?, mustChangePassword = 1 WHERE businessId = 'U1009'", [hash], function(err) {
    if (err) throw err;
    console.log('SUCCESS');
  });
});
