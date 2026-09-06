const {PrismaClient}=require('./server/node_modules/@prisma/client');
const p=new PrismaClient();
async function run() {
  const [ctv_users,customers,orders,orderItems,commissions,websiteOrders,services,products] = await Promise.all([
    p.user.count({where:{role:'ctv'}}),
    p.customer.count(),
    p.order.count(),
    p.orderItem.count(),
    p.commission.count(),
    p.websiteOrder.count(),
    p.service.count(),
    p.product.count()
  ]);
  // Sample order to see structure
  const sampleOrder = await p.order.findFirst({
    include: {
      customer: { include: { sourceCtv: {select:{userId:true,fullName:true}} } },
      orderer: { select:{userId:true,fullName:true,role:true} },
      items: { include: {service:true, product:true} },
      commissions: { select:{type:true,receiverId:true,earnedMoney:true,earnedPoints:true} }
    }
  });
  // OrderItems with productId vs serviceId
  const withProductId = await p.orderItem.count({where:{productId:{not:null}}});
  const withServiceId = await p.orderItem.count({where:{serviceId:{not:null}}});
  // Orders with ordererUserId
  const withOrderer = await p.order.count({where:{ordererUserId:{not:null}}});
  const withPeriod = await p.order.count({where:{periodId:{not:null}}});
  
  console.log(JSON.stringify({
    counts:{ctv_users,customers,orders,orderItems,commissions,websiteOrders,services,products},
    orderItemSources:{withProductId,withServiceId},
    orderLinks:{withOrderer,withPeriod},
    sampleOrder: sampleOrder ? {
      id: sampleOrder.id,
      purchaseType: sampleOrder.purchaseType,
      isSelfBuy: sampleOrder.isSelfBuy,
      ordererUserId: sampleOrder.ordererUserId,
      orderer: sampleOrder.orderer,
      customer: {
        fullName: sampleOrder.customer?.fullName,
        phone: sampleOrder.customer?.phone,
        sourceCtvId: sampleOrder.customer?.sourceCtvId,
        sponsorUserId: sampleOrder.customer?.sponsorUserId,
        sourceCtv: sampleOrder.customer?.sourceCtv
      },
      itemCount: sampleOrder.items?.length,
      firstItem: sampleOrder.items?.[0] ? {
        serviceId: sampleOrder.items[0].serviceId,
        productId: sampleOrder.items[0].productId,
        unitCommissionPts: sampleOrder.items[0].unitCommissionPts,
        service: sampleOrder.items[0].service?.name,
        product: sampleOrder.items[0].product?.title
      } : null,
      commissions: sampleOrder.commissions
    } : null
  }, null, 2));
}
run().catch(console.error).finally(()=>p.$disconnect());