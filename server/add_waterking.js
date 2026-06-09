const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  let cat = await prisma.serviceCategory.findUnique({ where: { name: 'Sản Phẩm' }});
  if (!cat) {
     cat = await prisma.serviceCategory.create({
        data: { name: 'Sản Phẩm' }
     });
  }

  await prisma.service.create({
     data: {
        name: 'Máy lọc nước ion kiềm WATER KING',
        group: 'Máy Lọc Nước',
        price: 15000000,
        description: 'Thân An - Trí Sáng',
        categoryId: cat.id,
        imageUrl: '/images/34e3a635d755560b0f441.jpg'
     }
  });

  console.log('Successfully added Water King product to DB.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
