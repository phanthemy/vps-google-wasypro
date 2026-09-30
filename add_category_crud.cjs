const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('./server/node_modules/@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'file:/var/www/wasypro/server/dev.db' } } });

async function updateBackendAndDB() {
  console.log('1. Cleaning up empty obsolete categories (cat-02, cat-05)...');
  try {
    await prisma.productCategory.deleteMany({
      where: { id: { in: ['cat-02', 'cat-05'] } }
    });
    console.log('Cleaned cat-02 and cat-05 successfully.');
  } catch (e) {
    console.error('Delete categories error:', e.message);
  }

  // Categories CRUD code to inject
  const crudRoutes = `
// ProductCategory CRUD
app.post('/api/product-categories', async (req, res) => {
  try {
    const { name, slug, description, icon } = req.body;
    if (!name) return res.status(400).json({ error: 'Tên danh mục là bắt buộc' });
    const finalSlug = slug || name.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const newCat = await prisma.productCategory.create({
      data: {
        name,
        slug: finalSlug,
        description: description || '',
        icon: icon || 'tag'
      }
    });
    res.json({ success: true, category: newCat });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/product-categories/:id', async (req, res) => {
  try {
    const { name, slug, description, icon } = req.body;
    const finalSlug = slug ? slug : (name ? name.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') : undefined);
    const updated = await prisma.productCategory.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(finalSlug && { slug: finalSlug }),
        ...(description !== undefined && { description }),
        ...(icon && { icon })
      }
    });
    res.json({ success: true, category: updated });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/product-categories/:id', async (req, res) => {
  try {
    const defaultCat = await prisma.productCategory.findFirst({ where: { id: { not: req.params.id } } });
    if (defaultCat) {
      await prisma.product.updateMany({
        where: { categoryId: req.params.id },
        data: { categoryId: defaultCat.id }
      });
    }
    await prisma.productCategory.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Đã xóa danh mục' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
`;

  // Inject into server.cjs
  console.log('2. Injecting category routes into server.cjs...');
  let serverCjs = fs.readFileSync('/var/www/wasypro/server.cjs', 'utf8');
  if (!serverCjs.includes("app.post('/api/product-categories'")) {
    serverCjs = serverCjs.replace(
      "app.get('/api/product-categories', async (req, res) => {",
      crudRoutes + "\napp.get('/api/product-categories', async (req, res) => {"
    );
    fs.writeFileSync('/var/www/wasypro/server.cjs', serverCjs);
    console.log('Injected into server.cjs successfully.');
  } else {
    console.log('Already in server.cjs.');
  }

  // Inject into server/index.js
  console.log('3. Injecting category routes into server/index.js...');
  let serverIndex = fs.readFileSync('/var/www/wasypro/server/index.js', 'utf8');
  if (!serverIndex.includes("app.post('/api/product-categories'")) {
    serverIndex = serverIndex.replace(
      "app.get('/api/product-categories', async (req, res) => {",
      crudRoutes + "\napp.get('/api/product-categories', async (req, res) => {"
    );
    fs.writeFileSync('/var/www/wasypro/server/index.js', serverIndex);
    console.log('Injected into server/index.js successfully.');
  } else {
    console.log('Already in server/index.js.');
  }

  console.log('DONE!');
}

updateBackendAndDB().finally(() => prisma.$disconnect());
