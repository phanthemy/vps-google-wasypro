const express = require('express');
const path = require('path');
const { PrismaClient } = require('./server/node_modules/@prisma/client');
const { PrismaBetterSqlite3 } = require('./server/node_modules/@prisma/adapter-better-sqlite3');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');

const adapter = new PrismaBetterSqlite3({ url: 'file:./server/dev.db' });
const prisma = new PrismaClient({ adapter });
const app = express();
const PORT = 5005;

// Create uploads directory
const UPLOADS_DIR = path.join(__dirname, 'uploads', 'products');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Multer config - temp storage, sharp will process
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only .jpg, .png, .webp, .mp4, .webm files allowed'));
  }
});

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
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
    if (req.body.gallery !== undefined) {
      // Handle both string[] and UploadedImage[] formats
      const gallery = req.body.gallery;
      if (typeof gallery === 'string') data.gallery = gallery;
      else if (Array.isArray(gallery)) {
        // Convert UploadedImage objects to URL strings for storage
        const urls = gallery.map(g => typeof g === 'string' ? g : g.url);
        data.gallery = JSON.stringify(urls);
      }
    }
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

// ============ IMAGE UPLOAD API ============
app.post('/api/upload', upload.array('images', 6), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    const results = [];
    for (const file of req.files) {
      const isVideoFile = file.mimetype.startsWith('video/');
      
      if (isVideoFile) {
        // Save video directly (no sharp processing)
        const ext = file.originalname.split('.').pop() || 'mp4';
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const filepath = path.join(UPLOADS_DIR, filename);
        fs.writeFileSync(filepath, file.buffer);
        
        results.push({
          url: `/uploads/products/${filename}`,
          thumbnail: null,
          originalName: file.originalname,
          size: file.size,
          type: 'video',
        });
      } else {
        // Image: resize and compress with sharp
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
        const filepath = path.join(UPLOADS_DIR, filename);
        
        await sharp(file.buffer)
          .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(filepath);
        
        const thumbFilename = `thumb-${filename}`;
        await sharp(file.buffer)
          .resize(200, 200, { fit: 'cover' })
          .webp({ quality: 70 })
          .toFile(path.join(UPLOADS_DIR, thumbFilename));
        
        results.push({
          url: `/uploads/products/${filename}`,
          thumbnail: `/uploads/products/${thumbFilename}`,
          originalName: file.originalname,
          size: file.size,
          type: 'image',
        });
      }
    }
    res.json({ success: true, images: results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/upload', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.startsWith('/uploads/products/')) return res.status(400).json({ error: 'Invalid URL' });
    const filename = path.basename(url);
    const filepath = path.join(UPLOADS_DIR, filename);
    const thumbPath = path.join(UPLOADS_DIR, 'thumb-' + filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Multer error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File quá lớn (tối đa 50MB cho video, 5MB cho ảnh)' });
    return res.status(400).json({ error: err.message });
  }
  if (err.message && err.message.includes('Only')) return res.status(400).json({ error: err.message });
  next(err);
});


// ============ ADMIN USER API ============
const bcryptCompare = (plain, hash) => {
  // Simple password comparison - for production use bcrypt
  if (hash.startsWith('$plain$')) return plain === hash.slice(7);
  return plain === hash;
};

app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email và mật khẩu là bắt buộc' });
    
    const user = await prisma.adminUser.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ success: false, message: 'Email không tồn tại' });
    if (!bcryptCompare(password, user.password)) return res.status(401).json({ success: false, message: 'Mật khẩu không đúng' });
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Tài khoản đã bị vô hiệu hóa' });
    
    // Simple token: base64(userId:timestamp)
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
    res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role }, token, message: 'Đăng nhập thành công' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await prisma.adminUser.findMany({ select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true } });
    res.json(users);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/users', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Email, mật khẩu và tên là bắt buộc' });
    
    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email đã tồn tại' });
    
    const user = await prisma.adminUser.create({
      data: { email, password: '$plain$' + password, name, role: role || 'admin' }
    });
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const data = {};
    if (req.body.name) data.name = req.body.name;
    if (req.body.email) data.email = req.body.email;
    if (req.body.role) data.role = req.body.role;
    if (req.body.password) data.password = '$plain$' + req.body.password;
    if (req.body.isActive !== undefined) data.isActive = req.body.isActive;
    
    const user = await prisma.adminUser.update({ where: { id: req.params.id }, data });
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role, isActive: user.isActive });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  try { await prisma.adminUser.delete({ where: { id: req.params.id } }); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    if (!userId || !newPassword) return res.status(400).json({ error: 'Thiếu thông tin' });
    
    const user = await prisma.adminUser.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    if (currentPassword && !bcryptCompare(currentPassword, user.password)) return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
    
    await prisma.adminUser.update({ where: { id: userId }, data: { password: '$plain$' + newPassword } });
    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// SPA fallback - must be LAST
app.get('*', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`WasyPro server on port ${PORT} with DB`);
});
