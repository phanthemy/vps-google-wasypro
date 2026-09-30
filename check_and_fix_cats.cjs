const { PrismaClient } = require('./server/node_modules/@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'file:/var/www/wasypro/server/dev.db' } } });

async function main() {
  console.log('--- CATEGORIES ---');
  const cats = await prisma.productCategory.findMany();
  console.log(cats.map(c => ({ id: c.id, name: c.name, slug: c.slug })));

  console.log('\n--- PRODUCTS ---');
  const prods = await prisma.product.findMany({
    select: { id: true, title: true, categoryId: true, price: true }
  });
  console.log(prods);

  // Fix: Move 'Bộ điện phân kiểm tra tạp chất' from cat-01 to cat-05 (Thiết bị kiểm tra)
  const dienPhan = prods.find(p => p.title.includes('Bộ điện phân'));
  if (dienPhan && dienPhan.categoryId === 'cat-01') {
    await prisma.product.update({
      where: { id: dienPhan.id },
      data: { categoryId: 'cat-05' }
    });
    console.log(`Updated "${dienPhan.title}" to category cat-05!`);
  }
}

main().finally(() => prisma.$disconnect());
