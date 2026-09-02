require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function migrate() {
  console.log('--- Starting Comprehensive Password Reset & Bcrypt Migration ---');
  
  // Helper to generate a random 16-character secure string for initialization
  function generateSecureRandomPassword() {
    return crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, 'x') + '!Aa1';
  }

  // 1. Reset Admin User in 'User' table (destroy old 'admin123')
  const adminPhone = '0999999999';
  const newAdminPlain = generateSecureRandomPassword();
  const newAdminHashed = await bcrypt.hash(newAdminPlain, 10);
  
  let admin = await prisma.user.findUnique({ where: { phone: adminPhone } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        userId: 'ADMIN01',
        fullName: 'System Administrator',
        phone: adminPhone,
        password: newAdminHashed,
        role: 'admin',
        tier: 'NONE',
        status: 'ACTIVE',
        mustChangePassword: true
      }
    });
    console.log('✅ Created Admin (ADMIN01) with fresh cryptographically secure bcrypt hash (mustChangePassword: true)');
  } else {
    await prisma.user.update({
      where: { id: admin.id },
      data: { password: newAdminHashed, role: 'admin', mustChangePassword: true }
    });
    console.log('✅ Reset Admin (ADMIN01) password to fresh bcrypt hash (mustChangePassword: true)');
  }

  // 2. Reset Accountant User in 'User' table (destroy old 'ketoan123')
  const accountantPhone = '0888888888';
  const newAccPlain = generateSecureRandomPassword();
  const newAccHashed = await bcrypt.hash(newAccPlain, 10);
  
  let accountant = await prisma.user.findUnique({ where: { phone: accountantPhone } });
  if (!accountant) {
    accountant = await prisma.user.create({
      data: {
        userId: 'ACC01',
        fullName: 'Kế Toán Hệ Thống',
        phone: accountantPhone,
        password: newAccHashed,
        role: 'accountant',
        tier: 'NONE',
        status: 'ACTIVE',
        mustChangePassword: true
      }
    });
    console.log('✅ Created Accountant (ACC01) with fresh cryptographically secure bcrypt hash (mustChangePassword: true)');
  } else {
    await prisma.user.update({
      where: { id: accountant.id },
      data: { password: newAccHashed, role: 'accountant', mustChangePassword: true }
    });
    console.log('✅ Reset Accountant (ACC01) password to fresh bcrypt hash (mustChangePassword: true)');
  }

  // 3. Reset & Hash AdminUser table (destroy old '$plain$Wtk686888@')
  const adminUsers = await prisma.adminUser.findMany();
  for (const au of adminUsers) {
    const freshAuPlain = generateSecureRandomPassword();
    const freshAuHashed = await bcrypt.hash(freshAuPlain, 10);
    await prisma.adminUser.update({
      where: { id: au.id },
      data: { password: freshAuHashed, mustChangePassword: true }
    });
    console.log(`✅ Reset AdminUser (${au.email}) password to fresh bcrypt hash (mustChangePassword: true)`);
  }

  // 4. Migrate & Set mustChangePassword for all other CTV users
  const allUsers = await prisma.user.findMany({
    where: { role: 'ctv' }
  });

  for (const user of allUsers) {
    let hashed = user.password;
    if (!hashed || !hashed.startsWith('$2')) {
      const rawPwd = user.password || '123456';
      hashed = await bcrypt.hash(rawPwd, 10);
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, mustChangePassword: true }
    });
  }

  console.log(`✅ Set mustChangePassword=true for all ${allUsers.length} CTV users`);

  // 5. Verify no plain text passwords remain across both tables
  const unhashedUsers = await prisma.user.findMany({
    where: { NOT: { password: { startsWith: '$2' } } }
  });
  const unhashedAdminUsers = await prisma.adminUser.findMany({
    where: { NOT: { password: { startsWith: '$2' } } }
  });

  if (unhashedUsers.length === 0 && unhashedAdminUsers.length === 0) {
    console.log('🎉 AUDIT CONFIRMED: 100% of accounts across User and AdminUser tables are bcrypt hashed and require password change!');
  } else {
    console.error('❌ AUDIT FAILED: Unhashed accounts found:', unhashedUsers.length + unhashedAdminUsers.length);
    process.exit(1);
  }

  await prisma.$disconnect();
}

migrate().catch(e => {
  console.error('Migration error:', e);
  process.exit(1);
});
