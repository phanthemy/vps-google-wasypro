const bcrypt = require('bcryptjs');
const { execSync } = require('child_process');

bcrypt.hash('123456', 10).then(hash => {
  execSync(`sqlite3 /var/www/wasypro/server/dev.db "UPDATE User SET password='${hash}' WHERE phone='0937353535';"`, {shell:'/bin/bash'});
  console.log('Password reset OK for 0937353535');
  
  // Verify
  const result = execSync(`sqlite3 /var/www/wasypro/server/dev.db "SELECT phone,role FROM User WHERE phone='0937353535';"`, {shell:'/bin/bash'});
  console.log('User:', result.toString().trim());
}).catch(e => console.error('ERR:', e.message));
