const express = require('express');
const path = require('path');
const { PrismaClient } = require('./server/node_modules/@prisma/client');
const { PrismaBetterSqlite3 } = require('./server/node_modules/@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({ url: 'file:./server/dev.db' });
const prisma = new PrismaClient({ adapter });
const app = express();
const PORT = 5005;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// ============ PRODUCT API ============
app.get('/api/products', async (req, res) => {
  try {
    const { categoryId, search, sort, limit, isHot } = req.query;
    let where = {};
    if (categoryId) where.categoryId = categoryId;
    if (isHot === 'true') where.isHot = true;
    if (search) where.title = { contains: search };
    let orderBy = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    if (sort === 'price_desc') orderBy = { price: 'desc' };
    const products = await prisma.product.findMany({ where, orderBy, take: limit ? parseInt(limit) : undefined, include: { category: true } });
    res.json(products.map(p => ({ ...p, gallery: JSON.parse(p.gallery || '[]'), specs: JSON.parse(p.specs || '{}') })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/product-categories', async (req, res) => {
  try {
    const cats = await prisma.productCategory.findMany({ include: { _count: { select: { products: true } } } });
    res.json(cats);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/products/:slugOrId', async (req, res) => {
  try {
    const p = await prisma.product.findFirst({ where: { OR: [{ slug: req.params.slugOrId }, { id: req.params.slugOrId }] }, include: { category: true } });
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json({ ...p, gallery: JSON.parse(p.gallery || '[]'), specs: JSON.parse(p.specs || '{}') });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const data = {};
    ['title','slug','categoryId','description','image','isHot','isNew','promotion'].forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
    if (req.body.price !== undefined) data.price = Number(req.body.price);
    if (req.body.originalPrice !== undefined) data.originalPrice = Number(req.body.originalPrice);
    if (req.body.stock !== undefined) data.stock = Number(req.body.stock);
    if (req.body.gallery !== undefined) data.gallery = typeof req.body.gallery === 'string' ? req.body.gallery : JSON.stringify(req.body.gallery);
    if (req.body.specs !== undefined) data.specs = typeof req.body.specs === 'string' ? req.body.specs : JSON.stringify(req.body.specs);
    const updated = await prisma.product.update({ where: { id: req.params.id }, data });
    res.json({ ...updated, gallery: JSON.parse(updated.gallery || '[]'), specs: JSON.parse(updated.specs || '{}') });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/products', async (req, res) => {
  try {
    const { title, slug, categoryId, price, originalPrice, image, gallery, description, specs, isHot, isNew, stock } = req.body;
    const product = await prisma.product.create({
      data: { title, slug, categoryId, price: Number(price||0), originalPrice: originalPrice?Number(originalPrice):null,
        image: image||'', gallery: typeof gallery==='string'?gallery:JSON.stringify(gallery||[]),
        description: description||'', specs: typeof specs==='string'?specs:JSON.stringify(specs||{}),
        isHot: isHot||false, isNew: isNew||false, stock: Number(stock||0), promotion: req.body.promotion||null }
    });
    res.json({ ...product, gallery: JSON.parse(product.gallery||'[]'), specs: JSON.parse(product.specs||'{}') });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/products/:id', async (req, res) => {
  try { await prisma.product.delete({ where: { id: req.params.id } }); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ ORDER API ============
app.get('/api/orders', async (req, res) => {
  try {
    const { status, search } = req.query;
    let where = {};
    if (status) where.status = status;
    const orders = await prisma.order.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { customer: true, items: { include: { service: true } } }
    });
    // Transform to match frontend Order interface
    res.json(orders.map(o => ({
      id: o.id,
      customerName: o.customer?.fullName || 'N/A',
      customerPhone: o.customer?.phone || '',
      totalAmount: o.totalAmount,
      status: o.status,
      createdAt: o.createdAt,
      items: o.items.map(i => ({
        id: i.id,
        serviceName: i.service?.name || 'N/A',
        amount: i.amount,
        qty: i.qty
      }))
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await prisma.order.update({ where: { id: req.params.id }, data: { status } });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    await prisma.$transaction([
      prisma.commission.deleteMany({ where: { orderId: req.params.id } }),
      prisma.orderItem.deleteMany({ where: { orderId: req.params.id } }),
      prisma.order.delete({ where: { id: req.params.id } })
    ]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});


// ============ WEBSITE ORDER API ============
app.post('/api/website-orders', async (req, res) => {
  try {
    const { customerName, customerPhone, address, message, type, productId, productTitle, productPrice, qty } = req.body;
    if (!customerName || !customerPhone) return res.status(400).json({ error: 'Name and phone required' });
    
    const totalAmount = (productPrice || 0) * (qty || 1);
    const order = await prisma.websiteOrder.create({
      data: { customerName, customerPhone, address: address || '', message: message || '', type: type || 'ORDER',
        productId: productId || null, productTitle: productTitle || null, productPrice: productPrice || 0,
        qty: qty || 1, totalAmount }
    });
    console.log(`[NEW ORDER] ${customerName} - ${customerPhone} - ${productTitle || 'Tư vấn'} - ${totalAmount.toLocaleString()}d`);
    res.json({ success: true, order });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/website-orders', async (req, res) => {
  try {
    const { status, type } = req.query;
    let where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    const orders = await prisma.websiteOrder.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(orders);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/website-orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await prisma.websiteOrder.update({ where: { id: req.params.id }, data: { status } });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/website-orders/:id', async (req, res) => {
  try { await prisma.websiteOrder.delete({ where: { id: req.params.id } }); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// SPA fallback - must be LAST
app.get('*', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`WasyPro server on port ${PORT} with DB`);
});
