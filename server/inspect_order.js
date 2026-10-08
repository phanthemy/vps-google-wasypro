const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const latestOrder = await prisma.order.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      items: { include: { service: true } },
      customer: true
    }
  });

  console.log('Order Details:', {
    id: latestOrder.id,
    status: latestOrder.status,
    totalAmount: latestOrder.totalAmount,
    ordererUserId: latestOrder.ordererUserId,
    customerName: latestOrder.customer?.fullName,
    customerPhone: latestOrder.customer?.phone,
    itemCount: latestOrder.items?.length,
    items: latestOrder.items?.map(it => ({
      name: it.service?.name,
      price: it.price,
      points: it.service?.commissionPoints
    }))
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
