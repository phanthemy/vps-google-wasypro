const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const u = await p.user.findFirst({where:{phone:'0937353535'}});
  if (u) {
    console.log('Found user:', u.phone, u.role, u.userId);
    console.log('Password hash prefix:', u.passwordHash ? u.passwordHash.substring(0,15) : 'null');
  } else {
    console.log('User 0937353535 NOT FOUND');
    const all = await p.user.findMany({take:5, select:{phone:true, role:true}});
    console.log('First 5 users:', JSON.stringify(all));
  }
  await p.$disconnect();
}
main().catch(e=>{console.error(e.message);process.exit(1)});
