const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });
const fs = require('fs');

const categories = [
  { id: 'cat-01', name: 'Máy Lọc Nước Ion Kiềm', slug: 'may-loc-nuoc-ion-kiem', description: 'Dòng máy lọc', image: '/images/categories/cat-1.webp', icon: 'droplet' },
  { id: 'cat-02', name: 'Máy Lọc Nước Hydrogen', slug: 'may-loc-nuoc-hydrogen', description: 'Máy hydrogen', image: '/images/categories/cat-2.webp', icon: 'activity' },
  { id: 'cat-03', name: 'Bình Ly Hydrogen', slug: 'binh-ly-hydrogen', description: 'Di động', image: '/images/categories/cat-3.webp', icon: 'coffee' },
  { id: 'cat-04', name: 'Lõi Lọc Phụ Kiện', slug: 'loi-loc-phu-kien', description: 'Phụ kiện', image: '/images/categories/cat-4.webp', icon: 'tool' },
  { id: 'cat-05', name: 'Thiết Bị Kiểm Tra', slug: 'thiet-bi-kiem-tra', description: 'Bút đo', image: '/images/categories/cat-5.webp', icon: 'sliders' },
];

async function main() {
  for (const cat of categories) {
    await prisma.productCategory.upsert({ where: { id: cat.id }, update: cat, create: cat });
  }
  console.log('Categories seeded');

  const mockFile = fs.readFileSync('/var/www/wasypro/src/data/mockData.ts', 'utf-8');
  const prodSection = mockFile.split('mockProducts: Product[] = [')[1];
  if (!prodSection) { console.log('No products found'); return; }
  
  const idMatches = [...prodSection.matchAll(/id:\s*'(prod-\d+)'/g)];
  const titleMatches = [...prodSection.matchAll(/title:\s*'([^']*)'/g)];
  const slugMatches = [...prodSection.matchAll(/slug:\s*'([^']*)'/g)];
  const catIdMatches = [...prodSection.matchAll(/categoryId:\s*'([^']*)'/g)];
  const priceMatches = [...prodSection.matchAll(/\n\s+price:\s*(\d+)/g)];
  const opMatches = [...prodSection.matchAll(/originalPrice:\s*(\d+)/g)];
  const ratingMatches = [...prodSection.matchAll(/rating:\s*([\d.]+)/g)];
  const reviewMatches = [...prodSection.matchAll(/reviewsCount:\s*(\d+)/g)];
  const imageMatches = [...prodSection.matchAll(/image:\s*'([^']*)'/g)];
  const hotMatches = [...prodSection.matchAll(/isHot:\s*(true|false)/g)];
  const newMatches = [...prodSection.matchAll(/isNew:\s*(true|false)/g)];
  const stockMatches = [...prodSection.matchAll(/stock:\s*(\d+)/g)];
  const descMatches = [...prodSection.matchAll(/description:\s*'([^']*)'/g)];
  
  let count = 0;
  let opIdx = 0;
  for (let i = 0; i < idMatches.length; i++) {
    try {
      const id = idMatches[i][1];
      const title = titleMatches[i] ? titleMatches[i][1] : '';
      const slug = slugMatches[i] ? slugMatches[i][1] : '';
      const categoryId = catIdMatches[i] ? catIdMatches[i][1] : 'cat-01';
      const price = priceMatches[i] ? parseInt(priceMatches[i][1]) : 0;
      const image = imageMatches[i] ? imageMatches[i][1] : '';
      const rating = ratingMatches[i] ? parseFloat(ratingMatches[i][1]) : 5;
      const reviewsCount = reviewMatches[i] ? parseInt(reviewMatches[i][1]) : 0;
      const isHot = hotMatches[i] ? hotMatches[i][1] === 'true' : false;
      const isNew = newMatches[i] ? newMatches[i][1] === 'true' : false;
      const stock = stockMatches[i] ? parseInt(stockMatches[i][1]) : 0;
      const description = descMatches[i] ? descMatches[i][1] : '';
      
      // originalPrice may not exist for all products
      let originalPrice = null;
      if (opMatches[opIdx]) {
        const opPos = opMatches[opIdx].index;
        const pricePos = priceMatches[i].index;
        const nextPricePos = priceMatches[i+1] ? priceMatches[i+1].index : Infinity;
        if (opPos > pricePos && opPos < nextPricePos) {
          originalPrice = parseInt(opMatches[opIdx][1]);
          opIdx++;
        }
      }

      if (!title || !slug) continue;

      const data = { title, slug, categoryId, price, originalPrice, rating, reviewsCount, image, isHot, isNew, stock, description, gallery: '[]', specs: '{}' };
      
      await prisma.product.upsert({
        where: { slug },
        update: data,
        create: { id, ...data },
      });
      count++;
      console.log(`  ${title} - ${price.toLocaleString()}d`);
    } catch (e) { console.error(`  ERR: ${e.message}`); }
  }
  console.log(`${count} products seeded to DB`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
