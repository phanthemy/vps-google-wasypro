const {PrismaClient} = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('Matkhau@123', 10);
  const result = await p.user.updateMany({
    where: { phone: '0937353535' },
    data: { password: hash }
  });
  console.log('Updated password for 0937353535:', result.count, 'records');
  await p.$disconnect();
}
main().catch(e=>{console.error(e.message);process.exit(1)});
