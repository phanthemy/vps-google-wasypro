const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function count() {
  const users = await prisma.user.count();
  const customers = await prisma.customer.count();
  const orders = await prisma.order.count();
  const orderItems = await prisma.orderItem.count();
  const services = await prisma.service.count();
  const products = await prisma.product.count();
  const commissions = await prisma.commission.count();
  const processing = await prisma.commissionProcessing.count();
  const seq = await prisma.businessIdSequence.findUnique({ where: { id: 1 } });
  const configs = await prisma.systemPolicyConfig.count();
  console.log('PRESERVATION COUNTS:');
  console.log(JSON.stringify({ users, customers, orders, orderItems, services, products, commissions, processing, nextVal: seq ? seq.nextVal : null, configs }, null, 2));
}
count().finally(() => prisma.$disconnect());