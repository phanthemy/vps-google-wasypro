const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const users = await p.user.findMany({ where: { role: 'ctv' }, select: { id: true, userId: true, fullName: true, rank: true, businessId: true } });
  console.log('=== USERS ===');
  for (const u of users) {
    console.log(u.userId + ' ' + u.fullName + ' dbId:' + u.id);
  }
  
  const custs = await p.customer.findMany({ select: { id: true, fullName: true, linkedUserId: true, sourceCtvId: true } });
  console.log('\n=== CUSTOMERS ===');
  for (const c of custs) {
    console.log('cust: ' + c.fullName + ' linkedUser: ' + c.linkedUserId + ' sourceCtv: ' + c.sourceCtvId);
  }
  
  const orders = await p.order.findMany({ where: { status: 'COMPLETED' }, include: { customer: { select: { id: true, fullName: true, linkedUserId: true } } } });
  console.log('\n=== COMPLETED ORDERS ===');
  for (const o of orders) {
    console.log('order: ' + o.id.slice(0,8) + ' amount: ' + o.totalAmount + ' custName: ' + (o.customer ? o.customer.fullName : 'N/A') + ' custLinked: ' + (o.customer ? o.customer.linkedUserId : 'N/A') + ' orderer: ' + o.ordererUserId);
  }
  
  console.log('\n=== TREE LOGIC ===');
  for (const u of users) {
    const selfCust = custs.find(c => c.linkedUserId === u.id);
    console.log(u.fullName + ' selfCust: ' + (selfCust ? selfCust.fullName + ' id:' + selfCust.id : 'NONE'));
    const selfOrders = selfCust ? orders.filter(o => o.customer && o.customer.id === selfCust.id) : [];
    const selfSales = selfOrders.reduce((s, o) => s + o.totalAmount, 0);
    console.log('  -> selfSales: ' + selfSales);
  }
  
  await p.$disconnect();
})();
