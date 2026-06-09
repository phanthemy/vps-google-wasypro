const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const Database = require('better-sqlite3');

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');
  
  // Clean up
  await prisma.commission.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.service.deleteMany();
  await prisma.serviceCategory.deleteMany();

  // Create Categories
  const catNoiKhoa = await prisma.serviceCategory.create({ data: { name: 'Nội khoa' } });
  const catPhauThuat = await prisma.serviceCategory.create({ data: { name: 'Phẫu thuật' } });
  const catChamSoc = await prisma.serviceCategory.create({ data: { name: 'Chăm sóc' } });

  // Create Services
  const svcMeso = await prisma.service.create({ data: { name: 'máy lóc nước R.O Rejuran', categoryId: catNoiKhoa.id, price: 5000000 } });
  const svcNangMui = await prisma.service.create({ data: { name: 'Nâng Mũi Cấu Trúc', categoryId: catPhauThuat.id, price: 30000000 } });
  const svcChamSocDa = await prisma.service.create({ data: { name: 'Chăm sóc da chuyên sâu', categoryId: catChamSoc.id, price: 500000 } });

  // Create Users
  const pDiamond = await prisma.user.create({
    data: {
      userId: 'D01',
      fullName: 'Nguyễn Văn Đ.',
      phone: '0901xxx111',
      tier: 'DIAMOND',
    }
  });

  const pGold = await prisma.user.create({
    data: {
      userId: 'G12',
      fullName: 'Lê Thị T.',
      phone: '0982xxx222',
      tier: 'GOLD',
      parentId: pDiamond.userId
    }
  });

  const pSilver = await prisma.user.create({
    data: {
      userId: 'S81',
      fullName: 'Phạm H.',
      phone: '0913xxx333',
      tier: 'SILVER',
      parentId: pGold.userId
    }
  });

  // Create Customers
  const customer1 = await prisma.customer.create({
    data: {
      fullName: 'Khách của Silver S81',
      phone: '0933123456',
      sourceCtvId: pSilver.userId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  const customer2 = await prisma.customer.create({
    data: {
      fullName: 'Khách của Diamond D01',
      phone: '0944123456',
      sourceCtvId: pDiamond.userId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  console.log('Database seeded successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
