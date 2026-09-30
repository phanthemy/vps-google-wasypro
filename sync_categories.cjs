const { PrismaClient } = require('./server/node_modules/@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'file:/var/www/wasypro/server/dev.db' } } });

async function syncCategories() {
  console.log('=== SYNCING CATEGORIES ===');

  // 1. Cập nhật cat-01 thành "Máy Lọc Nước"
  try {
    await prisma.productCategory.upsert({
      where: { id: 'cat-01' },
      update: { name: 'Máy Lọc Nước', slug: 'may-loc-nuoc', description: 'Máy lọc nước ion kiềm & hydrogen' },
      create: { id: 'cat-01', name: 'Máy Lọc Nước', slug: 'may-loc-nuoc', description: 'Máy lọc nước ion kiềm & hydrogen' }
    });
    console.log('OK: cat-01 -> Máy Lọc Nước');
  } catch (e) {
    console.error('Error updating cat-01:', e.message);
  }

  // 2. Cập nhật cat-03 thành "Bình Ly Hydrogen"
  try {
    await prisma.productCategory.upsert({
      where: { id: 'cat-03' },
      update: { name: 'Bình Ly Hydrogen', slug: 'binh-ly-hydrogen', description: 'Bình & ly tạo nước Hydrogen di động' },
      create: { id: 'cat-03', name: 'Bình Ly Hydrogen', slug: 'binh-ly-hydrogen', description: 'Bình & ly tạo nước Hydrogen di động' }
    });
    console.log('OK: cat-03 -> Bình Ly Hydrogen');
  } catch (e) {
    console.error('Error updating cat-03:', e.message);
  }

  // 3. Cập nhật cat-04 thành "Phụ Kiện Máy Lọc Nước"
  try {
    await prisma.productCategory.upsert({
      where: { id: 'cat-04' },
      update: { name: 'Phụ Kiện Máy Lọc Nước', slug: 'phu-kien-may-loc-nuoc', description: 'Lõi lọc, linh kiện và thiết bị kiểm tra' },
      create: { id: 'cat-04', name: 'Phụ Kiện Máy Lọc Nước', slug: 'phu-kien-may-loc-nuoc', description: 'Lõi lọc, linh kiện và thiết bị kiểm tra' }
    });
    console.log('OK: cat-04 -> Phụ Kiện Máy Lọc Nước');
  } catch (e) {
    console.error('Error updating cat-04:', e.message);
  }

  // 4. Chuyển các sản phẩm phụ kiện về cat-04
  const accessories = await prisma.product.findMany({
    where: {
      OR: [
        { categoryId: 'cat-05' },
        { title: { contains: 'Lõi' } },
        { title: { contains: 'Bút đo' } },
        { title: { contains: 'Bộ điện phân' } },
        { title: { contains: 'Màn chống' } }
      ]
    }
  });

  for (const acc of accessories) {
    await prisma.product.update({
      where: { id: acc.id },
      data: { categoryId: 'cat-04' }
    });
    console.log(`Moved "${acc.title}" to cat-04 (Phụ Kiện Máy Lọc Nước)`);
  }

  // 5. Chuyển các máy lọc nước về cat-01 ("Máy Lọc Nước")
  const machines = await prisma.product.findMany({
    where: {
      title: { contains: 'Máy' }
    }
  });

  for (const m of machines) {
    await prisma.product.update({
      where: { id: m.id },
      data: { categoryId: 'cat-01' }
    });
    console.log(`Moved "${m.title}" to cat-01 (Máy Lọc Nước)`);
  }

  console.log('\n=== CURRENT CATEGORIES & PRODUCTS COUNT ===');
  const cats = await prisma.productCategory.findMany({
    include: { _count: { select: { products: true } } }
  });
  console.log(cats);
}

syncCategories().finally(() => prisma.$disconnect());
