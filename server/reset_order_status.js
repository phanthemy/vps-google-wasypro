// Run settlement script directly using the server module or Prisma
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orderId = 'cmuu0c4c20005k597cilo36am';
  
  // Set status back to CONFIRMED first then COMPLETED so the lifecycle trigger fires cleanly
  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'CONFIRMED' }
  });
  console.log('Order reset to CONFIRMED');
}

main().catch(console.error).finally(() => prisma.$disconnect());
