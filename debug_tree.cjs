const { PrismaClient } = require('./server/prisma/generated/client');
const p = new PrismaClient();
(async () => {
  const users = await p.user.findMany({ where: { role: 'ctv' }, select: { id: true, userId: true, fullName: true, rank: true, businessId: true } });
  console.log('=== USERS ===');
  users.forEach(u => console.log(u.userId, u.fullName, 'dbId:', u.id));
  
  const custs = await p.customer.findMany({ select: { id: true, fullName: true, linkedUserId: true, sourceCtvId: true } });
  console.log('\n=== CUSTOMERS ===');
  custs.forEach(c => console.log('cust:', c.fullName, 'linkedUser:', c.linkedUserId, 'sourceCtv:', c.sourceCtvId));
  
  const orders = await p.order.findMany({ where: { status: 'COMPLETED' }, select: { id: true, totalAmount: true, customerId: true, ordererUserId: true, customer: { select: { fullName: true, linkedUserId: true } } } });
  console.log('\n=== COMPLETED ORDERS ===');
  orders.forEach(o => console.log('order:', o.id.slice(0,8), 'amount:', o.totalAmount, 'custName:', o.customer?.fullName, 'custLinked:', o.customer?.linkedUserId, 'orderer:', o.ordererUserId));
  
  // Simulate tree logic
  console.log('\n=== TREE LOGIC ===');
  for (const u of users) {
    const selfCust = custs.find(c => c.linkedUserId === u.id);
    const selfOrders = selfCust ? orders.filter(o => o.customerId === selfCust.id) : [];
    const selfSales = selfOrders.reduce((s, o) => s + o.totalAmount, 0);
    const allCusts = custs.filter(c => c.sourceCtvId === u.id);
    const allOrders = orders.filter(o => allCusts.some(c => c.id === o.customerId));
    const allSales = allOrders.reduce((s, o) => s + o.totalAmount, 0);
    console.log(u.fullName, '- selfSales:', selfSales, '- allSales:', allSales);
  }
  
  await p.$disconnect();
})();
