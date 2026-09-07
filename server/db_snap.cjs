const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.groupBy({ by: ['role', 'isSystemParticipant'], _count: true });
  const customers = await prisma.customer.count();
  const orders = await prisma.order.groupBy({ by: ['status'], _count: true });
  const products = await prisma.product.count();
  const periods = await prisma.commissionPeriod.count();
  const allAdmins = await prisma.user.findMany({ where: { role: { in: ['admin','accountant'] } }, select: { userId: true, phone: true, fullName: true, role: true } });
  console.log('DB SNAPSHOT:');
  console.log('  Users by role+participant:', JSON.stringify(users));
  console.log('  Total customers:', customers);
  console.log('  Orders by status:', JSON.stringify(orders));
  console.log('  Total products:', products);
  console.log('  Commission periods:', periods);
  console.log('  Admin accounts:', JSON.stringify(allAdmins));
}
main().catch(console.error).finally(() => prisma.\());
