const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const Database = require('better-sqlite3');

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

const servicesData = [
  // Nhóm Máy lọc nước R.O
  { group: 'Máy Lọc Nước Tinh Khiết R.O', category: 'Nội khoa', items: [
    { name: 'Máy lọc nước HappyLife RO 7 lõi', price: 4500000 },
    { name: 'Máy lọc nước HappyLife RO 9 lõi', price: 5500000 },
    { name: 'Máy lọc nước HappyLife RO Tủ Kính Mới Nhất', price: 6500000 },
    { name: 'Máy lọc nước RO Nóng Lạnh 2 Vòi', price: 8000000 },
  ]},
  // Nhóm Ion Kiềm
  { group: 'Máy Lọc Nước Ion Kiềm', category: 'Phẫu thuật', items: [
    { name: 'Máy lọc nước Ion Kiềm HappyLife 5 Tấm Điện Cực', price: 25000000 },
    { name: 'Máy lọc nước Ion Kiềm HappyLife 7 Tấm Điện Cực', price: 45000000 },
    { name: 'Máy lọc nước Ion Kiềm nhập khẩu Nhật Bản', price: 65000000 },
  ]},
  // Nhóm Linh kiện thay thế
  { group: 'Linh Kiện & Vật Tư Thay Thế', category: 'Chăm sóc', items: [
    { name: 'Bộ 3 lõi lọc thô 1-2-3 HappyLife', price: 250000 },
    { name: 'Màng lọc RO HappyLife chính hãng', price: 550000 },
    { name: 'Bộ đèn UV diệt khuẩn', price: 450000 },
    { name: 'Bình áp nhựa 10 Lít', price: 450000 },
  ]}
];

async function seed() {
  console.log('Clearing old products...');
  await prisma.orderItem.deleteMany({});
  await prisma.service.deleteMany({});
  
  // Ensure categories exist
  await prisma.serviceCategory.upsert({ where: { name: 'Nội khoa' }, update: {}, create: { name: 'Nội khoa' } });
  await prisma.serviceCategory.upsert({ where: { name: 'Phẫu thuật' }, update: {}, create: { name: 'Phẫu thuật' } });
  await prisma.serviceCategory.upsert({ where: { name: 'Chăm sóc' }, update: {}, create: { name: 'Chăm sóc' } });

  const categories = await prisma.serviceCategory.findMany();
  const categoryMap = {};
  categories.forEach(c => categoryMap[c.name] = c.id);

  console.log('Seeding new products...');
  for (const groupData of servicesData) {
    const categoryId = categoryMap[groupData.category];
    if (!categoryId) continue;
    for (const item of groupData.items) {
      await prisma.service.create({
        data: {
          name: item.name,
          price: item.price,
          categoryId: categoryId,
          group: groupData.group
        }
      });
    }
  }

  console.log('Done!');
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
