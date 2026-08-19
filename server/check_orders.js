const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  const orderCount = await prisma.order.count();
  console.log(orderCount + ' orders in DB');
  
  if (orderCount > 0) {
    const orders = await prisma.order.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { items: true, customer: true } });
    orders.forEach(o => {
      console.log(`  #${o.id.slice(0,8)} - ${o.customer?.fullName || 'N/A'} - ${o.totalAmount.toLocaleString()}d - ${o.status} - ${o.createdAt}`);
    });
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
