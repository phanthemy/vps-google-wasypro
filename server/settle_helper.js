const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { executeOrderSettlement } = require('./index.js');

async function settle(phone) {
  const u = await prisma.user.findFirst({ where: { phone } });
  if (!u) {
    console.log('USER_NOT_FOUND');
    return;
  }
  const o = await prisma.order.findFirst({
    where: { ordererUserId: u.id },
    orderBy: { createdAt: 'desc' }
  });
  if (!o) {
    console.log('ORDER_NOT_FOUND');
    return;
  }
  await prisma.order.update({
    where: { id: o.id },
    data: { status: 'COMPLETED' }
  });
  const res = await executeOrderSettlement(o.id);
  console.log('SETTLED_ORDER_FOR:', phone, 'USER:', u.userId, 'ORDER:', o.id);
  await prisma.$disconnect();
}

const phone = process.argv[2];
if (phone) {
  settle(phone).catch(e => { console.error(e); process.exit(1); });
}