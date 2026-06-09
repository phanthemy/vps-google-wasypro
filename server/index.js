const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const Database = require('better-sqlite3');

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
const fs = require('fs');
const path = require('path');
const CONFIG_FILE = path.join(__dirname, 'config.json');

// Default config logic if file doesn't exist
const DEFAULT_RATES = {
  'SILVER': { 'referral': 0.20, '1': 0.25, '5': 0.30, '10': 0.35, '20': 0.40 },
  'GOLD': { 'referral': 0.25, '1': 0.30, '5': 0.35, '10': 0.40, '20': 0.40 },
  'DIAMOND': { 'referral': 0.30, '1': 0.35, '5': 0.40, '10': 0.40, '20': 0.40 },
};

if (!fs.existsSync(CONFIG_FILE)) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_RATES, null, 2));
}

function getCommissionRates() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  } catch (e) { return DEFAULT_RATES; }
}

app.get('/api/config', (req, res) => {
  res.json({ success: true, data: getCommissionRates() });
});

app.post('/api/config', (req, res) => {
  try {
    const newRates = req.body;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(newRates, null, 2));
    res.json({ success: true, data: newRates });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/dashboard', async (req, res) => {
  try {
    const totalDiamond = await prisma.user.count({ where: { tier: 'DIAMOND' }});
    const totalGold = await prisma.user.count({ where: { tier: 'GOLD' }});
    const totalSilver = await prisma.user.count({ where: { tier: 'SILVER' }});
    const totalSalesAgg = await prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: 'COMPLETED' }});
    res.json({
      success: true,
      data: { totalDiamond, totalGold, totalSilver, totalSales: totalSalesAgg._sum.totalAmount || 0 }
    });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.put('/api/users/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword, isForce } = req.body;
    
    if (!newPassword || newPassword.length < 3) return res.json({ success: false, message: 'Mật khẩu quá ngắn' });

    const user = await prisma.user.findUnique({ where: { userId: id } });
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    
    if (!isForce) {
      if (user.password !== oldPassword) {
        return res.json({ success: false, message: 'Mật khẩu cũ không chính xác' });
      }
    }
    
    await prisma.user.update({
      where: { userId: id },
      data: { password: newPassword }
    });
    
    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

app.get('/api/users', async (req, res) => {
  try {
    const { timeFilter, period } = req.query;
    let orderDateFilter = undefined;
    
    if (timeFilter === 'month' && period) {
      const [y, m] = period.split('-');
      orderDateFilter = {
        createdAt: {
          gte: new Date(y, m - 1, 1),
          lt: new Date(y, m, 1)
        }
      };
    }

    const users = await prisma.user.findMany({
      where: { role: 'ctv' },
      include: {
        parent: { select: { fullName: true, userId: true } },
        customers: {
          include: {
            orders: {
              where: orderDateFilter,
              select: { totalAmount: true }
            }
          }
        },
        commissions: {
          where: orderDateFilter ? { createdAt: orderDateFilter.createdAt } : undefined,
          include: {
            order: {
               include: { customer: true, items: { include: { service: true } } }
            }
          }
        }
      }
    });

    const mappedUsers = users.map(u => {
      const totalSales = u.customers.reduce((acc, c) => acc + c.orders.reduce((sum, o) => sum + o.totalAmount, 0), 0);
      const totalCommission = u.commissions.reduce((acc, c) => acc + c.amount, 0);
      return {
        id: u.userId,
        name: u.fullName,
        phone: u.phone,
        tier: u.tier,
        note: u.note,
        parent: u.parent ? `${u.parent.fullName} (${u.parent.userId})` : 'Trực tiếp (Phòng khám)',
        totalSales,
        totalCommission,
        commissions: u.commissions // Return raw commissions for tooltip display
      };
    });
    res.json({ success: true, data: mappedUsers });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/commissions', async (req, res) => {
  try {
    const { userId } = req.query;
    let whereFilter = {};
    if (userId && userId !== 'ADMIN' && userId !== 'admin') {
       whereFilter.receiverId = userId;
    }
    
    const commissions = await prisma.commission.findMany({
      where: whereFilter,
      include: {
         order: {
            include: {
               customer: true,
               items: { include: { service: true } }
            }
         },
         receiver: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: commissions });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/statistics', async (req, res) => {
  try {
    const { timeFilter, period, userId } = req.query;
    
    let dateFilter = undefined;
    if (timeFilter === 'month' && period) {
      const [y, m] = period.split('-');
      dateFilter = {
        createdAt: {
          gte: new Date(y, m - 1, 1),
          lt: new Date(y, m, 1)
        }
      };
    } else if (timeFilter === 'quarter' && period) {
      const [y, q] = period.split('-');
      const startMonth = (parseInt(q) - 1) * 3;
      dateFilter = {
        createdAt: {
          gte: new Date(y, startMonth, 1),
          lt: new Date(y, startMonth + 3, 1)
        }
      };
    }

    const orderWhere = Object.assign({ status: 'COMPLETED' }, dateFilter || {});
    
    if (userId && userId !== 'ADMIN' && userId !== 'undefined') {
       orderWhere.customer = { sourceCtvId: userId };
    }

    const items = await prisma.orderItem.findMany({
      where: { order: orderWhere },
      include: { service: true }
    });

    const serviceStats = {};
    items.forEach(item => {
      const sName = item.service?.name || 'Khác';
      if (!serviceStats[sName]) serviceStats[sName] = 0;
      serviceStats[sName] += item.amount;
    });

    const chartData = Object.keys(serviceStats).map(name => ({
      name,
      value: serviceStats[name]
    })).sort((a,b) => b.value - a.value);

    res.json({ success: true, data: chartData });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    // Hardcoded admin account
    if (phone === '0999999999' && password === 'admin123') {
      return res.json({ success: true, data: { id: 'ADMIN', role: 'admin', fullName: 'System Admin' } });
    }

    // Hardcoded accountant account
    if (phone === '0888888888' && password === 'ketoan') {
      return res.json({ success: true, data: { id: 'ACCOUNTANT', role: 'accountant', fullName: 'Kế Toán Hệ Thống' } });
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Số điện thoại hoặc mật khẩu không chính xác.' });
    }

    res.json({ success: true, data: { id: user.userId, role: user.role, fullName: user.fullName, tier: user.tier } });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// ==== [NEW] INTERNAL STAFF API ====
app.get('/api/internal-users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: { not: 'ctv' } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: users });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post('/api/internal-users', async (req, res) => {
  try {
    const { fullName, phone, role, password } = req.body;
    const generatedId = role.substring(0, 3).toUpperCase() + Math.floor(10 + Math.random() * 90);
    const user = await prisma.user.create({
      data: {
        userId: generatedId,
        fullName,
        phone,
        password: password || '123456',
        role,
        tier: 'NONE' // Internal staff don't have tiers
      }
    });
    res.json({ success: true, data: user });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.put('/api/internal-users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { password, status } = req.body;
    const data = {};
    if (password) data.password = password;
    if (status) data.status = status;
    const user = await prisma.user.update({
      where: { userId: id },
      data
    });
    res.json({ success: true, data: user });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// ==== [NEW] SYSTEM AUDIT LOGS API ====
app.get('/api/audit-logs', async (req, res) => {
  try {
    const logs = await prisma.customerAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: { customer: true },
      take: 200 // Limit to last 200 changes
    });
    res.json({ success: true, data: logs });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post('/api/users', async (req, res) => {
  try {
    const { fullName, phone, tier, parentId, password } = req.body;
    
    // Check for duplicate phone
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Số điện thoại này đã được sử dụng bởi một Cộng tác viên khác.' });
    }

    // Generate a unique ID
    let generatedId = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
       generatedId = tier.charAt(0).toUpperCase() + Math.floor(100 + Math.random() * 900); // e.g. S123
       const check = await prisma.user.findUnique({ where: { userId: generatedId } });
       if (!check) isUnique = true;
       attempts++;
    }

    const user = await prisma.user.create({
      data: {
        userId: generatedId,
        fullName,
        phone,
        password: password || '123456',
        tier,
        parentId: parentId || null
      }
    });
    res.json({ success: true, data: user });
  } catch (error) { res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + error.message }); }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, tier, parentId, password } = req.body;
    
    // Prevent setting self as parent
    if (parentId === id) {
      return res.status(400).json({ success: false, message: 'Không thể tự đặt mình làm tuyến trên.' });
    }

    // Check duplicate phone
    if (phone) {
       const existing = await prisma.user.findUnique({ where: { phone } });
       if (existing && existing.userId !== id) {
          return res.status(400).json({ success: false, message: 'Số điện thoại này đã được sử dụng bởi một Cộng tác viên khác.' });
       }
    }

    const updateData = { fullName, phone, tier, parentId: parentId || null };
    if (password) updateData.password = password;

    const updatedUser = await prisma.user.update({
      where: { userId: id },
      data: updateData
    });
    res.json({ success: true, data: updatedUser });
  } catch (error) { res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + error.message }); }
});

app.put('/api/users/:id/note', async (req, res) => {
  try {
    const { note } = req.body;
    const updatedUser = await prisma.user.update({
      where: { userId: req.params.id },
      data: { note }
    });
    res.json({ success: true, data: updatedUser });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/tree', async (req, res) => {
  try {
     const users = await prisma.user.findMany({
       where: { role: 'ctv' },
       include: { customers: { include: { orders: { select: { totalAmount: true } } } } }
     });
     const userMap = {};
     users.forEach(u => {
        userMap[u.userId] = {
           id: u.userId,
           name: u.fullName,
           tier: u.tier,
           totalSales: u.customers.reduce((acc, c) => acc + c.orders.reduce((sum, o) => sum + o.totalAmount, 0), 0),
           children: []
        };
     });
     const tree = [];
     users.forEach(u => {
        if (u.parentId && userMap[u.parentId]) {
           userMap[u.parentId].children.push(userMap[u.userId]);
        } else {
           tree.push(userMap[u.userId]);
        }
     });
     res.json({ success: true, data: tree });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// API: Đăng ký khách hàng (Pre-check)
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({ include: { sourceCtv: true } });
    res.json({ success: true, data: customers });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { fullName, phone, sourceCtvId } = req.body;
    
    let existing = await prisma.customer.findFirst({ where: { phone } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Số điện thoại này đã tồn tại trong hệ thống.' });
    }

    const customer = await prisma.customer.create({
      data: {
        fullName,
        phone,
        sourceCtvId: sourceCtvId || null,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    if (sourceCtvId) {
      await prisma.customerAuditLog.create({
        data: { 
           customerId: customer.id, 
           action: 'CREATE_CUSTOMER', 
           details: JSON.stringify({ name: fullName, phone }), 
           userId: req.headers['x-user-id'] || 'SYSTEM' 
        }
      });
    }

    // Auto-create a login account for the customer if they don't already have one
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (!existingUser) {
      let isUnique = false;
      let genId = '';
      let attempts = 0;
      while (!isUnique && attempts < 10) {
         genId = 'C' + Math.floor(100 + Math.random() * 900);
         const check = await prisma.user.findUnique({ where: { userId: genId } });
         if (!check) isUnique = true;
         attempts++;
      }
      
      await prisma.user.create({
        data: {
          userId: genId,
          fullName,
          phone,
          password: '123456', // Default password
          role: 'customer',
          tier: 'NONE',
          parentId: sourceCtvId || null
        }
      });
    }

    res.json({ success: true, data: customer });
  } catch (error) { res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + error.message }); }
});

// API: Cập nhật trạng thái khách hàng
app.put('/api/customers/:id/status', async (req, res) => {
  try {
    const { status, userId, userFullName } = req.body;
    const oldCustomer = await prisma.customer.findUnique({ where: { id: req.params.id } });
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: { status }
    });
    
    if (userId && oldCustomer.status !== status) {
      await prisma.customerAuditLog.create({
         data: {
            customerId: customer.id,
            userId: `${userFullName} (${userId})`,
            action: 'UPDATE_STATUS',
            details: JSON.stringify({ from: oldCustomer.status, to: status })
         }
      });
    }
    
    res.json({ success: true, data: customer });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// API: Nâng cấp Khách Hàng lên Đại Lý (CTV)
app.put('/api/customers/:id/promote', async (req, res) => {
  try {
    const { id } = req.params;
    const { tier, userId, userFullName } = req.body;

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });

    let user = await prisma.user.findUnique({ where: { phone: customer.phone } });
    
    if (!user) {
        let isUnique = false;
        let genId = '';
        while (!isUnique) {
           genId = 'S' + Math.floor(100 + Math.random() * 900);
           const check = await prisma.user.findUnique({ where: { userId: genId } });
           if (!check) isUnique = true;
        }
        user = await prisma.user.create({
          data: {
             userId: genId,
             fullName: customer.fullName,
             phone: customer.phone,
             password: '123456',
             role: 'ctv',
             tier: tier || 'SILVER',
             parentId: customer.sourceCtvId
          }
        });
    } else {
        let dataToUpdate = { role: 'ctv', tier: tier || 'SILVER' };
        if (user.userId.startsWith('C')) {
            let isUnique = false;
            let genId = '';
            while (!isUnique) {
               genId = 'S' + Math.floor(100 + Math.random() * 900);
               const check = await prisma.user.findUnique({ where: { userId: genId } });
               if (!check) isUnique = true;
            }
            dataToUpdate.userId = genId;
        }
        await prisma.user.update({
           where: { id: user.id },
           data: dataToUpdate
        });
    }

    if (userId) {
      await prisma.customerAuditLog.create({
         data: {
            customerId: customer.id,
            userId: `${userFullName} (${userId})`,
            action: 'PROMOTE_TO_CTV',
            details: JSON.stringify({ tier })
         }
      });
    }

    res.json({ success: true, message: 'Đã nâng cấp thành công!' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// API: Get customer audit logs
app.get('/api/customers/:id/audit-log', async (req, res) => {
  try {
    const logs = await prisma.customerAuditLog.findMany({
      where: { customerId: req.params.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: logs });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// API: Lấy danh sách dịch vụ
app.get('/api/services', async (req, res) => {
  const services = await prisma.service.findMany({ include: { category: true } });
  res.json({ success: true, data: services });
});

// API: Sửa giá dịch vụ
app.put('/api/services/:id', async (req, res) => {
  try {
    let { price, description, imageUrl, imageFileBase64 } = req.body;
    
    // Handle specific file upload if present
    if (imageFileBase64 && imageFileBase64.startsWith('data:image')) {
      const match = imageFileBase64.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      if (match) {
         const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
         const buffer = Buffer.from(match[2], 'base64');
         const uploadDir = path.join(__dirname, '../public/uploads');
         if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
         
         const filename = `service_${req.params.id}_${Date.now()}.${ext}`;
         fs.writeFileSync(path.join(uploadDir, filename), buffer);
         imageUrl = '/uploads/' + filename;
      }
    }

    const updateData = {};
    if (price !== undefined) updateData.price = Number(price);
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    const s = await prisma.service.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.json({ success: true, data: s });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// API: Thêm dịch vụ mới
app.post('/api/services', async (req, res) => {
  try {
    const { name, group, price, categoryName, description, imageUrl } = req.body;
    let cat = null;
    if (categoryName) {
      cat = await prisma.serviceCategory.findUnique({ where: { name: categoryName }});
      if (!cat) {
         cat = await prisma.serviceCategory.findFirst({ where: { name: { contains: categoryName } }});
      }
    }
    if (!cat) {
      cat = await prisma.serviceCategory.findFirst({ where: { name: 'Chăm sóc' }});
    }
    const s = await prisma.service.create({
      data: { name, group, price: Number(price), categoryId: cat.id, description, imageUrl }
    });
    res.json({ success: true, data: s });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// API: Xóa dịch vụ
app.delete('/api/services/:id', async (req, res) => {
  try {
    const s = await prisma.service.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: s });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// API: Tạo đơn hàng và tính Commission
app.post('/api/orders', async (req, res) => {
  try {
    let { customerId, ctvBuyerId, items } = req.body; // items: [{ serviceId, amount }]
    
    let customer;
    if (ctvBuyerId) {
        const ctvUser = await prisma.user.findUnique({ where: { userId: ctvBuyerId } });
        if (!ctvUser) return res.status(400).json({ success: false, message: 'CTV không tồn tại' });
        
        // Find if a Customer already exists with this CTV's phone
        customer = await prisma.customer.findFirst({ where: { phone: ctvUser.phone } });
        
        // Auto create Customer if not exists
        if (!customer) {
            customer = await prisma.customer.create({
                data: {
                    fullName: ctvUser.fullName,
                    phone: ctvUser.phone,
                    sourceCtvId: ctvUser.userId,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
            });
            // Audit Log cho viec tao Khach Hang
            await prisma.customerAuditLog.create({
              data: { 
                 customerId: customer.id, 
                 action: 'CREATE_CUSTOMER_FOR_CTV_BUY', 
                 details: JSON.stringify({ name: ctvUser.fullName, phone: ctvUser.phone }), 
                 userId: req.headers['x-user-id'] || 'SYSTEM' 
              }
            });
        }
        customerId = customer.id;
    }

    if (!customerId) return res.status(400).json({ success: false, message: 'Vui lòng chọn khách hàng hoặc CTV' });

    if (!customer) {
        customer = await prisma.customer.findUnique({
          where: { id: customerId }, include: { sourceCtv: { include: { parent: { include: { parent: { include: { parent: true } } } } } } }
        });
    } else {
        // We need to fetch the includes if customer was auto-created or fetched above
        customer = await prisma.customer.findUnique({
          where: { id: customer.id }, include: { sourceCtv: { include: { parent: { include: { parent: { include: { parent: true } } } } } } }
        });
    }

    if (!customer) return res.status(400).json({ success: false, message: 'Customer not found' });
    
    let totalAmount = 0;
    const itemsData = [];
    
    // Validate services
    for (const item of items) {
       const svc = await prisma.service.findUnique({ where: { id: item.serviceId }, include: { category: true } });
       if (!svc) return res.status(400).json({ success: false, message: `Service ${item.serviceId} not found` });
       totalAmount += item.amount;
       const qty = item.qty ? Math.max(1, parseInt(item.qty, 10)) : Math.max(1, Math.round(item.amount / (svc.price || 1)));
       itemsData.push({ serviceId: item.serviceId, amount: item.amount, qty, categoryName: svc.category.name });
    }

    const order = await prisma.order.create({
      data: {
        customerId,
        totalAmount,
        status: 'COMPLETED',
        items: {
          create: itemsData.map(i => ({ serviceId: i.serviceId, amount: i.amount, qty: i.qty }))
        }
      }
    });

    const ctv = customer.sourceCtv;
    if (!ctv) return res.json({ success: true, data: order });

    const commissionsToCreate = [];

    const isSelfBuy = ctv.phone === customer.phone;

    const commissionRates = getCommissionRates();

    function getWaterKingRate(tier, qty, isSelfBuy) {
        const tRates = commissionRates[tier] || DEFAULT_RATES[tier];
        if (!isSelfBuy) {
            return tRates['referral'] || 0;
        }
        if (qty >= 20) return tRates['20'] || tRates['10'] || tRates['5'] || tRates['1'] || 0;
        if (qty >= 10) return tRates['10'] || tRates['5'] || tRates['1'] || 0;
        if (qty >= 5) return tRates['5'] || tRates['1'] || 0;
        return tRates['1'] || 0;
    }

    const totalOrderQty = itemsData.reduce((sum, i) => sum + (i.qty || 1), 0);

    for (const item of itemsData) {
      // 1. Hoa hồng Trực Tiếp cho Người Giới Thiệu
      const baseRate = getWaterKingRate(ctv.tier, totalOrderQty, isSelfBuy);
      
      if (baseRate > 0) {
        commissionsToCreate.push({
          orderId: order.id,
          receiverId: ctv.userId,
          amount: item.amount * baseRate,
          type: 'DIRECT'
        });
      }

      // 2. Phí Hỗ Trợ Hệ Thống: F1 (10%), F2 (5%)
      let currentParent = ctv.parent;
      if (currentParent) {
         // Thưởng 10% cho Tuyến trên trực tiếp (F1)
         commissionsToCreate.push({
            orderId: order.id,
            receiverId: currentParent.userId,
            amount: item.amount * 0.10,
            type: 'OVERRIDE_F1'
         });

         let grandParent = currentParent.parent;
         if (grandParent) {
            // Thưởng 5% cho Tuyến trên của Tuyến trên (F2)
            commissionsToCreate.push({
               orderId: order.id,
               receiverId: grandParent.userId,
               amount: item.amount * 0.05,
               type: 'OVERRIDE_F2'
            });
         }
      }
    }

    if (commissionsToCreate.length > 0) {
      await prisma.commission.createMany({ data: commissionsToCreate });
    }

    res.json({ success: true, data: order, commissions: commissionsToCreate });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// API: Lấy danh sách toàn bộ Đơn hàng
app.get('/api/orders', async (req, res) => {
  try {
    const { userId } = req.query;
    let whereFilter = {};
    if (userId && userId !== 'ADMIN' && userId !== 'admin' && userId !== 'undefined') {
       whereFilter.customer = { sourceCtvId: userId };
    }

    const orders = await prisma.order.findMany({
      where: whereFilter,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
           include: { sourceCtv: true }
        },
        items: {
           include: { service: true }
        }
      }
    });
    res.json({ success: true, data: orders });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// API: Huỷ Đơn Hàng (Xoá An toàn bao gồm cả Hoa Hồng)
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    await prisma.$transaction([
       // 1. Thu hồi toàn bộ hoa hồng sinh ra từ đơn hàng này
       prisma.commission.deleteMany({ where: { orderId } }),
       // 2. Xoá chi tiết các sản phẩm trong giỏ hàng
       prisma.orderItem.deleteMany({ where: { orderId } }),
       // 3. Xoá Đơn hàng chủ
       prisma.order.delete({ where: { id: orderId } })
    ]);
    res.json({ success: true, message: 'Deleted order successfully' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.listen(PORT, () => {
  console.log(`Backend Server is running on http://localhost:${PORT}`);
});
