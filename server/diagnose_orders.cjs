const { PrismaClient } = require('./node_modules/@prisma/client');
const p = new PrismaClient();

(async () => {
  // 1. Check order CMTW9H53
  const o = await p.order.findFirst({ 
    where: { id: { startsWith: 'cmtw9h53' } }, 
    include: { commissions: true, commissionProcessing: true } 
  });
  console.log('=== ORDER CMTW9H53 ===');
  console.log('ID:', o?.id, 'Status:', o?.status, 'Amount:', o?.totalAmount);
  console.log('Commissions:', o?.commissions?.length || 0);
  if (o?.commissions) o.commissions.forEach(c => console.log('  ', c.type, c.earnedPoints, 'pts', c.status));
  console.log('Processing:', o?.commissionProcessing?.status || 'NONE');

  // 2. Check U452 points  
  const u = await p.user.findFirst({ where: { userId: 'U452' } });
  console.log('\n=== U452 ===');
  console.log('QP:', u?.qualifyingPoints, 'SP:', u?.sPoints, 'rank:', u?.rank);

  // 3. All orders
  console.log('\n=== ALL ORDERS ===');
  const orders = await p.order.findMany({ select: { id: true, status: true, totalAmount: true, depositAmount: true } });
  orders.forEach(o => console.log(' ', o.id.slice(0,10), o.status, o.totalAmount + 'd', 'deposit:', o.depositAmount || 0));

  // 4. CommissionProcessing records (show which orders had settlement run)
  console.log('\n=== SETTLEMENT RECORDS ===');
  const procs = await p.commissionProcessing.findMany();
  procs.forEach(p => console.log(' ', p.orderId.slice(0,10), p.status));

  // 5. QP/SP logs
  const qpLogs = await p.qualifyingPointLog.findMany({ where: { userId: u?.id } });
  console.log('\n=== QP LOGS for U452 ===');
  qpLogs.forEach(l => console.log(' ', l.orderId?.slice(0,10), 'amount:', l.amount, 'type:', l.type));

  await p.$disconnect();
})();
