require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not defined!');
  process.exit(1);
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3011;

// ENVIRONMENT-BASED CORS CONFIGURATION (Strict Production Whitelist vs Dev)
const productionOrigins = [
  'https://wasypro.com',
  'https://www.wasypro.com',
  'https://app.wasypro.com'
];

const developmentOrigins = [
  ...productionOrigins,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3011'
];

const allowedOrigins = process.env.NODE_ENV === 'production' ? productionOrigins : developmentOrigins;

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Origin blocked by CORS policy: ' + origin));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

app.use(cookieParser());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// CSRF PROTECTION MIDDLEWARE for Cookie-Authenticated Mutating Requests
const csrfProtection = (req, res, next) => {
  const mutatingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  if (!mutatingMethods.includes(req.method)) {
    return next();
  }

  // Public unauthenticated routes are exempt
  if (req.path === '/api/auth/login' || req.path === '/api/auth/logout') {
    return next();
  }

  // If request is authenticated via Cookie, verify Double-Submit CSRF Token
  const cookieAuth = req.cookies && req.cookies.auth_token;
  if (cookieAuth) {
    const clientCsrfToken = req.headers['x-csrf-token'];
    const cookieCsrfToken = req.cookies && req.cookies.csrf_token;

    if (!clientCsrfToken || !cookieCsrfToken || clientCsrfToken !== cookieCsrfToken) {
      console.warn(`[CSRF VIOLATION] Blocked ${req.method} ${req.originalUrl} from origin ${req.headers.origin || 'unknown'}`);
      return res.status(403).json({
        success: false,
        code: 'CSRF_VALIDATION_FAILED',
        message: 'Yêu cầu bị từ chối do thiếu hoặc không khớp mã CSRF Token.'
      });
    }
  }

  next();
};

app.use(csrfProtection);

// Serve static uploads ONLY (backups and code are strictly non-public)
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Rate limiters
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
  max: parseInt(process.env.RATE_LIMIT_MAX || '10', 10), // 10 attempts
  message: { success: false, message: 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau 15 phút.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Bạn đã thử đổi mật khẩu quá nhiều lần. Vui lòng thử lại sau 15 phút.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Config file management
const CONFIG_FILE = path.join(__dirname, 'config.json');
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
  } catch (e) {
    return DEFAULT_RATES;
  }
}

// Helper: Sanitize user object (never leak password)
function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

// Helper: Find all downline userIds recursively
async function getDownlineUserIds(rootUserId) {
  const downline = new Set();
  const queue = [rootUserId];
  while (queue.length > 0) {
    const current = queue.shift();
    const children = await prisma.user.findMany({
      where: { parentId: current },
      select: { userId: true }
    });
    for (const child of children) {
      if (!downline.has(child.userId)) {
        downline.add(child.userId);
        queue.push(child.userId);
      }
    }
  }
  return downline;
}

// ================= AUTHENTICATION & RBAC MIDDLEWARES =================

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const cookieToken = req.cookies && req.cookies.auth_token;
  const token = cookieToken || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null);

  if (!token) {
    return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập để truy cập tài nguyên này.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Per-request DB query: verifies account existence, lock status, and real-time DB role
    const user = await prisma.user.findUnique({ where: { userId: decoded.userId } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại trên hệ thống.' });
    }

    // Real-Time Account Lock Check (immediate invalidation)
    if (user.status === 'INACTIVE') {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.' });
    }

    req.user = {
      id: user.userId,
      dbId: user.id,
      role: user.role, // Always read fresh from DB, never trust stale token payload
      fullName: user.fullName,
      phone: user.phone,
      tier: user.tier,
      parentId: user.parentId,
      mustChangePassword: user.mustChangePassword
    };

    // STRICT ENFORCEMENT OF MANDATORY PASSWORD CHANGE
    // When mustChangePassword is true, block ALL business endpoints!
    if (user.mustChangePassword) {
      const allowedEndpoints = [
        { method: 'PUT', pattern: new RegExp(`^/api/users/${user.userId}/password$`) },
        { method: 'GET', pattern: /^\/api\/auth\/me$/ },
        { method: 'POST', pattern: /^\/api\/auth\/logout$/ }
      ];

      const isAllowed = allowedEndpoints.some(e => e.method === req.method && e.pattern.test(req.path));
      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          code: 'PASSWORD_CHANGE_REQUIRED',
          message: 'Tài khoản đang ở trạng thái bắt buộc đổi mật khẩu. Vui lòng đổi mật khẩu trước khi sử dụng hệ thống.'
        });
      }
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Mã xác thực không hợp lệ.', code: 'INVALID_TOKEN' });
  }
};

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      console.warn(`[SECURITY VIOLATION] User ${req.user ? req.user.id : 'ANON'} with DB role '${req.user ? req.user.role : 'none'}' attempted unauthorized access to ${req.method} ${req.originalUrl}`);
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện hành động này.' });
    }
    next();
  };
};

// ================= API ROUTES =================

// 1. AUTHENTICATION LOGIN (HttpOnly Cookie + CSRF Double-Submit Token)
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp số điện thoại và mật khẩu.' });
    }

    const trimmedPhone = phone.trim();
    const user = await prisma.user.findUnique({ where: { phone: trimmedPhone } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Số điện thoại hoặc mật khẩu không chính xác.' });
    }

    if (user.status === 'INACTIVE') {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị tạm khóa.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Số điện thoại hoặc mật khẩu không chính xác.' });
    }

    const tokenPayload = {
      userId: user.userId,
      role: user.role,
      fullName: user.fullName,
      tier: user.tier
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const csrfToken = crypto.randomBytes(32).toString('hex');
    const isProd = process.env.NODE_ENV === 'production';

    // Set HttpOnly, Secure, SameSite Cookie for Auth Token
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000
    });

    // Set non-HttpOnly Cookie for CSRF Token (read by frontend client)
    res.cookie('csrf_token', csrfToken, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000
    });

    // Return user information without exposing token string in body
    res.json({
      success: true,
      requirePasswordChange: user.mustChangePassword,
      data: {
        id: user.userId,
        role: user.role,
        fullName: user.fullName,
        tier: user.tier,
        phone: user.phone,
        mustChangePassword: user.mustChangePassword
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ trong quá trình xử lý đăng nhập.' });
  }
});

// AUTH ME (Session Status)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user.id,
      role: req.user.role,
      fullName: req.user.fullName,
      tier: req.user.tier,
      phone: req.user.phone,
      mustChangePassword: req.user.mustChangePassword
    }
  });
});

// LOGOUT (Clear Cookies)
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('auth_token', { path: '/' });
  res.clearCookie('csrf_token', { path: '/' });
  res.json({ success: true, message: 'Đã đăng xuất thành công.' });
});

// 2. CONFIG COMMISSION MATRIX
app.get('/api/config', authenticateToken, (req, res) => {
  res.json({ success: true, data: getCommissionRates() });
});

app.post('/api/config', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const newRates = req.body;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(newRates, null, 2));
    res.json({ success: true, data: newRates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. DASHBOARD STATS
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    const isGlobal = req.user.role === 'admin' || req.user.role === 'accountant';

    if (isGlobal) {
      const totalDiamond = await prisma.user.count({ where: { tier: 'DIAMOND', role: 'ctv' } });
      const totalGold = await prisma.user.count({ where: { tier: 'GOLD', role: 'ctv' } });
      const totalSilver = await prisma.user.count({ where: { tier: 'SILVER', role: 'ctv' } });
      const totalSalesAgg = await prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: 'COMPLETED' }
      });
      return res.json({
        success: true,
        data: {
          totalDiamond,
          totalGold,
          totalSilver,
          totalSales: totalSalesAgg._sum.totalAmount || 0
        }
      });
    }

    // CTV Scope
    const downlineIds = await getDownlineUserIds(req.user.id);
    const networkUserIds = [req.user.id, ...Array.from(downlineIds)];

    const personalCustomers = await prisma.customer.findMany({
      where: { sourceCtvId: req.user.id },
      include: { orders: { where: { status: 'COMPLETED' }, select: { totalAmount: true } } }
    });

    const personalSales = personalCustomers.reduce((acc, c) => acc + c.orders.reduce((s, o) => s + o.totalAmount, 0), 0);

    const networkCustomers = await prisma.customer.findMany({
      where: { sourceCtvId: { in: networkUserIds } },
      include: { orders: { where: { status: 'COMPLETED' }, select: { totalAmount: true } } }
    });
    const networkSales = networkCustomers.reduce((acc, c) => acc + c.orders.reduce((s, o) => s + o.totalAmount, 0), 0);

    const totalCommissions = await prisma.commission.aggregate({
      _sum: { amount: true },
      where: { receiverId: req.user.id, status: { in: ['PENDING', 'PAID'] } }
    });

    res.json({
      success: true,
      data: {
        tier: req.user.tier,
        personalSales,
        networkSales,
        directCustomersCount: personalCustomers.length,
        totalCommission: totalCommissions._sum.amount || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. USERS MANAGEMENT (CTVs)
app.get('/api/users', authenticateToken, async (req, res) => {
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

    let userFilter = { role: 'ctv' };
    if (req.user.role === 'ctv') {
      const downlineIds = await getDownlineUserIds(req.user.id);
      userFilter.userId = { in: [req.user.id, ...Array.from(downlineIds)] };
    }

    const users = await prisma.user.findMany({
      where: userFilter,
      include: {
        parent: { select: { fullName: true, userId: true } },
        customers: {
          include: {
            orders: {
              where: orderDateFilter ? Object.assign({ status: 'COMPLETED' }, orderDateFilter) : { status: 'COMPLETED' },
              select: { totalAmount: true }
            }
          }
        },
        commissions: {
          where: orderDateFilter ? { createdAt: orderDateFilter.createdAt, status: { in: ['PENDING', 'PAID'] } } : { status: { in: ['PENDING', 'PAID'] } },
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
        parentId: u.parentId || '',
        parent: u.parent ? `${u.parent.fullName} (${u.parent.userId})` : 'Trực tiếp Công ty',
        totalSales,
        totalCommission,
        commissions: u.commissions
      };
    });

    res.json({ success: true, data: mappedUsers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE CTV
app.post('/api/users', authenticateToken, requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    let { fullName, phone, tier, parentId, password } = req.body;

    if (!fullName || !phone) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ Họ tên và Số điện thoại' });
    }

    phone = phone.trim();
    tier = (tier || 'SILVER').toUpperCase();

    let validParentId = null;
    if (parentId && typeof parentId === 'string' && parentId.trim()) {
      const parentUser = await prisma.user.findUnique({ where: { userId: parentId.trim() } });
      if (parentUser) validParentId = parentUser.userId;
    }

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      if (existing.role === 'ctv') {
        return res.status(400).json({ success: false, message: `Số điện thoại này đã là CTV (Mã CTV: ${existing.userId}).` });
      }

      let targetUserId = existing.userId;
      if (targetUserId.startsWith('C') || targetUserId.startsWith('U')) {
        let isUnique = false;
        let genId = '';
        const prefix = tier.charAt(0);
        while (!isUnique) {
          genId = prefix + Math.floor(100 + Math.random() * 900);
          const check = await prisma.user.findUnique({ where: { userId: genId } });
          if (!check) isUnique = true;
        }
        targetUserId = genId;
      }

      const updateData = {
        userId: targetUserId,
        fullName: fullName || existing.fullName,
        role: 'ctv',
        tier,
        parentId: validParentId,
        mustChangePassword: true
      };
      if (password && password.trim()) {
        updateData.password = await bcrypt.hash(password.trim(), 10);
      }

      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: updateData
      });

      return res.json({ success: true, data: sanitizeUser(updated), message: 'Đã nâng cấp tài khoản thành CTV thành công!' });
    }

    let generatedId = '';
    let isUnique = false;
    const prefix = tier.charAt(0);
    while (!isUnique) {
      generatedId = prefix + Math.floor(100 + Math.random() * 900);
      const check = await prisma.user.findUnique({ where: { userId: generatedId } });
      if (!check) isUnique = true;
    }

    const rawPwd = password && password.trim() ? password.trim() : '123456';
    const hashedPassword = await bcrypt.hash(rawPwd, 10);

    const newUser = await prisma.user.create({
      data: {
        userId: generatedId,
        fullName,
        phone,
        password: hashedPassword,
        role: 'ctv',
        tier,
        parentId: validParentId,
        mustChangePassword: true
      }
    });

    res.json({ success: true, data: sanitizeUser(newUser) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + error.message });
  }
});

// UPDATE CTV (Admin only)
app.put('/api/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    let { fullName, phone, tier, parentId, password } = req.body;

    if (parentId === id) {
      return res.status(400).json({ success: false, message: 'Không thể tự đặt mình làm tuyến trên.' });
    }

    let validParentId = null;
    if (parentId && typeof parentId === 'string' && parentId.trim()) {
      const parentUser = await prisma.user.findUnique({ where: { userId: parentId.trim() } });
      if (parentUser) validParentId = parentUser.userId;
    }

    if (phone) {
      phone = phone.trim();
      const existing = await prisma.user.findUnique({ where: { phone } });
      if (existing && existing.userId !== id) {
        return res.status(400).json({ success: false, message: 'Số điện thoại này đã được sử dụng.' });
      }
    }

    const updateData = {
      fullName,
      phone,
      tier: (tier || 'SILVER').toUpperCase(),
      parentId: validParentId
    };

    if (password && password.trim()) {
      updateData.password = await bcrypt.hash(password.trim(), 10);
      updateData.mustChangePassword = true;
    }

    const updatedUser = await prisma.user.update({
      where: { userId: id },
      data: updateData
    });

    res.json({ success: true, data: sanitizeUser(updatedUser) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + error.message });
  }
});

// CHANGE OWN PASSWORD (Self Only with Strict Validation)
app.put('/api/users/:id/password', passwordLimiter, authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    // Security Rule: Users can ONLY change their OWN password!
    if (req.user.id !== id) {
      return res.status(403).json({ success: false, message: 'Bạn chỉ có quyền đổi mật khẩu của chính tài khoản mình.' });
    }

    // Strict Password Policy (Minimum 8 chars, uppercase, lowercase, number, special char)
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s]).{8,}$/;
    if (!newPassword || !strongPasswordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt.'
      });
    }

    const targetUser = await prisma.user.findUnique({ where: { userId: id } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản người dùng.' });
    }

    if (!oldPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mật khẩu cũ hoặc mật khẩu tạm thời.' });
    }

    const isMatch = await bcrypt.compare(oldPassword, targetUser.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu cũ không chính xác.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { userId: id },
      data: { password: hashed, mustChangePassword: false }
    });

    res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// SEPARATE ADMIN ENDPOINT: RESET USER PASSWORD
app.post('/api/admin/users/:id/reset-password', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await prisma.user.findUnique({ where: { userId: id } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản người dùng.' });
    }

    // Generate random strong temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex') + 'Aa1!';
    const hashed = await bcrypt.hash(tempPassword, 10);

    await prisma.user.update({
      where: { userId: id },
      data: { password: hashed, mustChangePassword: true }
    });

    // Audit Log: only record target ID and admin ID - NEVER log the plain password!
    const customer = await prisma.customer.findFirst({ where: { phone: targetUser.phone } });
    if (customer) {
      await prisma.customerAuditLog.create({
        data: {
          customerId: customer.id,
          action: 'ADMIN_RESET_PASSWORD',
          details: JSON.stringify({ targetUserId: id, resetBy: req.user.id }),
          userId: `${req.user.fullName} (${req.user.id})`
        }
      });
    }

    // Anti-caching headers for sensitive one-time password delivery
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.json({
      success: true,
      message: 'Đã đặt lại mật khẩu tạm thành công cho tài khoản.',
      tempPassword
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE USER NOTE (Admin/Accountant)
app.put('/api/users/:id/note', authenticateToken, requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    const { note } = req.body;
    const updatedUser = await prisma.user.update({
      where: { userId: req.params.id },
      data: { note }
    });
    res.json({ success: true, data: sanitizeUser(updatedUser) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. NETWORK TREE
app.get('/api/tree', authenticateToken, async (req, res) => {
  try {
    const isGlobal = req.user.role === 'admin' || req.user.role === 'accountant';
    let userFilter = { role: 'ctv' };

    if (!isGlobal) {
      const downlineIds = await getDownlineUserIds(req.user.id);
      userFilter.userId = { in: [req.user.id, ...Array.from(downlineIds)] };
    }

    const users = await prisma.user.findMany({
      where: userFilter,
      include: {
        customers: {
          include: {
            orders: {
              where: { status: 'COMPLETED' },
              select: { totalAmount: true }
            }
          }
        }
      }
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
      if (u.parentId && userMap[u.parentId] && u.userId !== req.user.id) {
        userMap[u.parentId].children.push(userMap[u.userId]);
      } else if (isGlobal || u.userId === req.user.id) {
        tree.push(userMap[u.userId]);
      }
    });

    res.json({ success: true, data: tree });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. CUSTOMER LEADS & AUDIT TRAIL
app.get('/api/customers', authenticateToken, async (req, res) => {
  try {
    let whereFilter = {};
    if (req.user.role === 'ctv') {
      const downlineIds = await getDownlineUserIds(req.user.id);
      whereFilter.sourceCtvId = { in: [req.user.id, ...Array.from(downlineIds)] };
    }

    const customers = await prisma.customer.findMany({
      where: whereFilter,
      include: { sourceCtv: { select: { userId: true, fullName: true, phone: true, tier: true } } },
      orderBy: { registeredAt: 'desc' }
    });

    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE CUSTOMER
app.post('/api/customers', authenticateToken, async (req, res) => {
  try {
    let { fullName, phone, sourceCtvId } = req.body;

    if (!fullName || !phone) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ Họ tên và Số điện thoại' });
    }

    phone = phone.trim();

    let validCtvId = req.user.id;
    let sponsorDbId = req.user.dbId;
    if (req.user.role === 'admin' || req.user.role === 'accountant') {
      if (sourceCtvId && sourceCtvId.trim()) {
        const ctvUser = await prisma.user.findUnique({ where: { userId: sourceCtvId.trim() } });
        if (ctvUser) {
          validCtvId = ctvUser.userId;
          sponsorDbId = ctvUser.id;
        }
      }
    }

    const existing = await prisma.customer.findFirst({
      where: { phone, sourceCtvId: validCtvId }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Khách hàng này đã được đăng ký trong danh sách của bạn.' });
    }

    const customer = await prisma.customer.create({
      data: {
        fullName,
        phone,
        sourceCtvId: validCtvId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    // Audit Log with authentic token identity
    await prisma.customerAuditLog.create({
      data: {
        customerId: customer.id,
        action: 'CREATE_CUSTOMER',
        details: JSON.stringify({ name: fullName, phone, sourceCtvId: validCtvId }),
        userId: `${req.user.fullName} (${req.user.id})`
      }
    });

    // Auto-create customer account with secure password
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (!existingUser) {
      let isUnique = false;
      let genId = '';
      while (!isUnique) {
        genId = 'C' + Math.floor(100 + Math.random() * 900);
        const check = await prisma.user.findUnique({ where: { userId: genId } });
        if (!check) isUnique = true;
      }

      const defaultHashed = await bcrypt.hash('123456', 10);
      await prisma.user.create({
        data: {
          userId: genId,
          fullName,
          phone,
          password: defaultHashed,
          role: 'customer',
          tier: 'NONE',
          parentId: validCtvId,
          mustChangePassword: true
        }
      });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + error.message });
  }
});

// UPDATE CUSTOMER STATUS
app.put('/api/customers/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng.' });
    }

    if (req.user.role === 'ctv') {
      const downline = await getDownlineUserIds(req.user.id);
      if (customer.sourceCtvId !== req.user.id && !downline.has(customer.sourceCtvId)) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa khách hàng của CTV khác.' });
      }
    }

    const updated = await prisma.customer.update({
      where: { id: req.params.id },
      data: { status }
    });

    if (customer.status !== status) {
      await prisma.customerAuditLog.create({
        data: {
          customerId: customer.id,
          userId: `${req.user.fullName} (${req.user.id})`,
          action: 'UPDATE_STATUS',
          details: JSON.stringify({ from: customer.status, to: status })
        }
      });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PROMOTE CUSTOMER TO CTV
app.put('/api/customers/:id/promote', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { tier } = req.body;

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng.' });

    if (req.user.role === 'ctv') {
      const downline = await getDownlineUserIds(req.user.id);
      if (customer.sourceCtvId !== req.user.id && !downline.has(customer.sourceCtvId)) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền nâng cấp khách hàng của CTV khác.' });
      }
    }

    let user = await prisma.user.findUnique({ where: { phone: customer.phone } });
    const targetTier = (tier || 'SILVER').toUpperCase();

    if (!user) {
      let isUnique = false;
      let genId = '';
      const prefix = targetTier.charAt(0);
      while (!isUnique) {
        genId = prefix + Math.floor(100 + Math.random() * 900);
        const check = await prisma.user.findUnique({ where: { userId: genId } });
        if (!check) isUnique = true;
      }
      const defaultPwd = await bcrypt.hash('123456', 10);
      user = await prisma.user.create({
        data: {
          userId: genId,
          fullName: customer.fullName,
          phone: customer.phone,
          password: defaultPwd,
          role: 'ctv',
          tier: targetTier,
          parentId: customer.sourceCtvId,
          mustChangePassword: true
        }
      });
    } else {
      let dataToUpdate = { role: 'ctv', tier: targetTier, mustChangePassword: true };
      if (user.userId.startsWith('C') || user.userId.startsWith('U')) {
        let isUnique = false;
        let genId = '';
        const prefix = targetTier.charAt(0);
        while (!isUnique) {
          genId = prefix + Math.floor(100 + Math.random() * 900);
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

    await prisma.customerAuditLog.create({
      data: {
        customerId: customer.id,
        userId: `${req.user.fullName} (${req.user.id})`,
        action: 'PROMOTE_TO_CTV',
        details: JSON.stringify({ tier: targetTier })
      }
    });

    res.json({ success: true, message: 'Đã nâng cấp thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CUSTOMER AUDIT LOGS
app.get('/api/customers/:id/audit-log', authenticateToken, async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
    if (!customer) return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng.' });

    if (req.user.role === 'ctv') {
      const downline = await getDownlineUserIds(req.user.id);
      if (customer.sourceCtvId !== req.user.id && !downline.has(customer.sourceCtvId)) {
        return res.status(403).json({ success: false, message: 'Không có quyền xem lịch sử khách hàng này.' });
      }
    }

    const logs = await prisma.customerAuditLog.findMany({
      where: { customerId: req.params.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. ORDERS & COMMISSIONS

// GET ORDERS
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    let whereFilter = {};
    if (req.user.role === 'ctv') {
      const downline = await getDownlineUserIds(req.user.id);
      const allowedCtvIds = [req.user.id, ...Array.from(downline)];
      whereFilter = {
        customer: { sourceCtvId: { in: allowedCtvIds } }
      };
    }

    const orders = await prisma.order.findMany({
      where: whereFilter,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          include: { sourceCtv: { select: { userId: true, fullName: true, phone: true, tier: true } } }
        },
        items: {
          include: { service: true }
        },
        commissions: true
      }
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE ORDER
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    let { customerId, ctvBuyerId, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Đơn hàng phải có ít nhất một sản phẩm/dịch vụ.' });
    }

    let customer;
    if (ctvBuyerId) {
      if (req.user.role === 'ctv' && ctvBuyerId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Bạn chỉ có thể tạo đơn mua sỉ cho chính tài khoản của bạn.' });
      }

      const ctvUser = await prisma.user.findUnique({ where: { userId: ctvBuyerId } });
      if (!ctvUser) return res.status(400).json({ success: false, message: 'CTV không tồn tại' });

      customer = await prisma.customer.findFirst({ where: { phone: ctvUser.phone } });
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            fullName: ctvUser.fullName,
            phone: ctvUser.phone,
            sourceCtvId: ctvUser.userId,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        });
      }
      customerId = customer.id;
    }

    if (!customerId) return res.status(400).json({ success: false, message: 'Vui lòng chọn khách hàng hoặc CTV mua hàng' });

    customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { sourceCtv: { include: { parent: { include: { parent: true } } } } }
    });

    if (!customer) return res.status(400).json({ success: false, message: 'Không tìm thấy thông tin khách hàng.' });

    if (req.user.role === 'ctv' && !ctvBuyerId) {
      const downline = await getDownlineUserIds(req.user.id);
      if (customer.sourceCtvId !== req.user.id && !downline.has(customer.sourceCtvId)) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền tạo đơn cho khách hàng của CTV khác.' });
      }
    }

    let totalAmount = 0;
    const itemsData = [];

    for (const item of items) {
      const svc = await prisma.service.findUnique({ where: { id: item.serviceId }, include: { category: true } });
      if (!svc) return res.status(400).json({ success: false, message: `Dịch vụ/Sản phẩm ${item.serviceId} không tồn tại` });

      const itemAmount = Number(item.amount) || (svc.price * (item.qty || 1));
      totalAmount += itemAmount;
      const qty = item.qty ? Math.max(1, parseInt(item.qty, 10)) : 1;

      // Phase 2C: Snapshot commissionPoints at order time (IMMUTABLE per SPEC v2.2 §X)
      // commissionPoints is INDEPENDENT from price — admin sets manually
      const unitCommissionPts = svc.commissionPoints || 0;
      const lineCommissionPts = unitCommissionPts * qty;

      itemsData.push({ serviceId: item.serviceId, amount: itemAmount, qty, unitCommissionPts, lineCommissionPts });
    }

    
    // Phase 2C: Resolve customer for compute purchaseType
    const customerRecord = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { linkedUserId: true, sponsorUserId: true }
    });
    const isSelfPurchasePhase2C = customerRecord.linkedUserId !== null && 
                           customerRecord.linkedUserId === req.user.id;
    const purchaseType = isSelfPurchasePhase2C ? 'SELF_PURCHASE' : 'CUSTOMER_PURCHASE';

    // Phase 2C: Create order with commission point snapshots on OrderItem
    const order = await prisma.order.create({
      data: {
        customerId,
        totalAmount,
        status: 'COMPLETED',
        ordererUserId: req.user.id,
        purchaseType: purchaseType,
        items: {
          create: itemsData.map(i => ({
            serviceId: i.serviceId,
            amount: i.amount,
            qty: i.qty,
            unitCommissionPts: i.unitCommissionPts,
            lineCommissionPts: i.lineCommissionPts,
          }))
        }
      }
    });

    const ctv = customer.sourceCtv;
    const isSelfBuy = ctv ? (ctv.phone === customer.phone) : false;

    // Update Order with Phase 2B/2C fields
    await prisma.order.update({
      where: { id: order.id },
      data: { orderType: 'RETAIL', isSelfBuy }
    });

    // Run Commission Engine v3 (non-blocking)
    createCommissionsForOrder_v3(order.id).catch(err => 
      console.error('[Commission Engine v3] Error:', err)
    );

    res.json({ success: true, data: order, commissions: [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// VOID / CANCEL ORDER (No hard delete! Preserves full accounting audit trail with REVERSAL for PAID commissions)
app.delete('/api/orders/:id', authenticateToken, requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { commissions: true, customer: true }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng cần hủy.' });
    }

    if (order.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Đơn hàng này đã bị hủy trước đó.' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Mark Order as CANCELLED
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' }
      });

      // 2. Handle commissions
      for (const comm of order.commissions) {
        if (comm.status === 'PENDING') {
          await tx.commission.update({
            where: { id: comm.id },
            data: { status: 'REVOKED' }
          });
        } else if (comm.status === 'PAID') {
          // Create exact REVERSAL counter-record with negative amount
          await tx.commission.create({
            data: {
              orderId: order.id,
              receiverId: comm.receiverId,
              amount: -comm.amount,
              type: 'REVERSAL',
              status: 'COMPLETED'
            }
          });
        }
      }

      // 3. Record Audit Log
      await tx.customerAuditLog.create({
        data: {
          customerId: order.customerId,
          action: 'CANCEL_ORDER',
          details: JSON.stringify({
            orderId: order.id,
            totalAmount: order.totalAmount,
            reason: 'Hủy đơn bởi ' + req.user.role,
            cancelledBy: `${req.user.fullName} (${req.user.id})`
          }),
          userId: `${req.user.fullName} (${req.user.id})`
        }
      });
    });

    res.json({ success: true, message: 'Đã hủy đơn hàng và thu hồi/ghi nhận hoàn trả hoa hồng thành công!' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. COMMISSIONS LIST
app.get('/api/commissions', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.query;
    let whereFilter = {};

    if (req.user.role === 'ctv') {
      whereFilter.receiverId = req.user.id;
    } else if (userId && userId !== 'ADMIN' && userId !== 'admin') {
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
        receiver: { select: { userId: true, fullName: true, phone: true, tier: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: commissions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 9. STATISTICS
app.get('/api/statistics', authenticateToken, async (req, res) => {
  try {
    const { timeFilter, period } = req.query;
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
      const startMonth = (parseInt(q, 10) - 1) * 3;
      dateFilter = {
        createdAt: {
          gte: new Date(y, startMonth, 1),
          lt: new Date(y, startMonth + 3, 1)
        }
      };
    }

    const orderWhere = Object.assign({ status: 'COMPLETED' }, dateFilter || {});

    if (req.user.role === 'ctv') {
      const downline = await getDownlineUserIds(req.user.id);
      orderWhere.customer = { sourceCtvId: { in: [req.user.id, ...Array.from(downline)] } };
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
    })).sort((a, b) => b.value - a.value);

    res.json({ success: true, data: chartData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 10. INTERNAL STAFF (Admin only)
app.get('/api/internal-users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: { not: 'ctv' } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: users.map(sanitizeUser) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/internal-users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { fullName, phone, role, password } = req.body;
    if (!fullName || !phone || !role) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin.' });
    }

    const existing = await prisma.user.findUnique({ where: { phone: phone.trim() } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Số điện thoại này đã tồn tại.' });
    }

    const generatedId = role.substring(0, 3).toUpperCase() + Math.floor(10 + Math.random() * 90);
    const rawPwd = password && password.trim() ? password.trim() : '123456';
    const hashedPassword = await bcrypt.hash(rawPwd, 10);

    const user = await prisma.user.create({
      data: {
        userId: generatedId,
        fullName,
        phone: phone.trim(),
        password: hashedPassword,
        role,
        tier: 'NONE',
        status: 'ACTIVE',
        mustChangePassword: true
      }
    });

    res.json({ success: true, data: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/internal-users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { password, status, role } = req.body;
    const data = {};
    if (password && password.trim()) {
      data.password = await bcrypt.hash(password.trim(), 10);
      data.mustChangePassword = true;
    }
    if (status) data.status = status;
    if (role) data.role = role;

    const user = await prisma.user.update({
      where: { userId: id },
      data
    });
    res.json({ success: true, data: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 11. AUDIT LOGS (Admin / Accountant)
app.get('/api/audit-logs', authenticateToken, requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    const logs = await prisma.customerAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: { customer: true },
      take: 200
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 12. SERVICES CATALOG (Public Read / Admin Write)
app.get('/api/services', async (req, res) => {
  try {
    const services = await prisma.service.findMany({ include: { category: true } });
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/services', authenticateToken, requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    const { name, group, price, commissionPoints, categoryName, description, imageUrl } = req.body;
    let cat = null;
    if (categoryName) {
      cat = await prisma.serviceCategory.findUnique({ where: { name: categoryName } });
    }
    if (!cat) {
      cat = await prisma.serviceCategory.findFirst();
      if (!cat) {
        cat = await prisma.serviceCategory.create({ data: { name: 'Chăm sóc' } });
      }
    }
    // Phase 2C: commissionPoints is INDEPENDENT from price (SPEC v2.2 §XI)
    // Admin sets commissionPoints manually — NEVER price / 1000
    const cp = commissionPoints !== undefined ? Number(commissionPoints) : 0;
    if (cp === 0) {
      console.warn(`[SERVICE CREATE] commissionPoints=0 for service "${name}". Admin should set this manually.`);
    }
    const s = await prisma.service.create({
      data: { name, group, price: Number(price), commissionPoints: cp, categoryId: cat.id, description, imageUrl }
    });
    res.json({ success: true, data: s });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


app.put('/api/services/:id', authenticateToken, requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    let { price, commissionPoints, description, imageUrl } = req.body;
    const updateData = {};
    if (price !== undefined) updateData.price = Number(price);
    // Phase 2C: commissionPoints is INDEPENDENT — admin sets manually
    if (commissionPoints !== undefined) updateData.commissionPoints = Number(commissionPoints);
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    // SPEC v3.0 §IX.3: Audit trail for commissionPoints change
    let oldCp = null;
    if (commissionPoints !== undefined) {
      const existing = await prisma.service.findUnique({ where: { id: req.params.id }, select: { commissionPoints: true, name: true } });
      oldCp = existing ? existing.commissionPoints : null;
    }

    const s = await prisma.service.update({
      where: { id: req.params.id },
      data: updateData
    });

    // Write audit log if commissionPoints changed
    if (commissionPoints !== undefined && oldCp !== null && oldCp !== Number(commissionPoints)) {
      await prisma.customerAuditLog.create({
        data: {
          customerId: req.params.id,
          action: 'UPDATE_COMMISSION_POINTS',
          details: JSON.stringify({
            serviceId: req.params.id,
            serviceName: s.name,
            field: 'commissionPoints',
            oldValue: oldCp,
            newValue: Number(commissionPoints),
            actor: req.user.userId || req.user.id,
            timestamp: new Date().toISOString(),
          }),
          userId: req.user.userId || req.user.id,
        },
      }).catch(e => console.error('[COMMISSION_AUDIT]', e.message));
    }

    res.json({ success: true, data: s });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


app.delete('/api/services/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const s = await prisma.service.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: s });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 13. WEBSITE PRODUCTS (Public Read / Admin Write Protected)
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
    const products = await prisma.product.findMany({
      where,
      orderBy,
      take: limit ? parseInt(limit, 10) : undefined,
      include: { category: true }
    });
    res.json(products.map(p => ({
      ...p,
      gallery: JSON.parse(p.gallery || '[]'),
      specs: JSON.parse(p.specs || '{}')
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/products/:slugOrId', async (req, res) => {
  try {
    const p = await prisma.product.findFirst({
      where: { OR: [{ slug: req.params.slugOrId }, { id: req.params.slugOrId }] },
      include: { category: true }
    });
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json({
      ...p,
      gallery: JSON.parse(p.gallery || '[]'),
      specs: JSON.parse(p.specs || '{}')
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/product-categories', async (req, res) => {
  try {
    const cats = await prisma.productCategory.findMany({
      include: { _count: { select: { products: true } } }
    });
    res.json(cats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PROTECTED PRODUCT CRUD (Admin only)
app.post('/api/products', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { title, slug, categoryId, price, originalPrice, image, gallery, description, specs, isHot, isNew, stock } = req.body;
    const product = await prisma.product.create({
      data: {
        title,
        slug,
        categoryId,
        price: Number(price || 0),
        originalPrice: originalPrice ? Number(originalPrice) : null,
        image: image || '',
        gallery: typeof gallery === 'string' ? gallery : JSON.stringify(gallery || []),
        description: description || '',
        specs: typeof specs === 'string' ? specs : JSON.stringify(specs || {}),
        isHot: isHot || false,
        isNew: isNew || false,
        stock: Number(stock || 0)
      }
    });
    res.json({
      ...product,
      gallery: JSON.parse(product.gallery || '[]'),
      specs: JSON.parse(product.specs || '{}')
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/products/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const data = {};
    ['title', 'slug', 'categoryId', 'description', 'image', 'isHot', 'isNew'].forEach(f => {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    });
    if (req.body.price !== undefined) data.price = Number(req.body.price);
    if (req.body.originalPrice !== undefined) data.originalPrice = Number(req.body.originalPrice);
    if (req.body.stock !== undefined) data.stock = Number(req.body.stock);
    if (req.body.gallery !== undefined) data.gallery = typeof req.body.gallery === 'string' ? req.body.gallery : JSON.stringify(req.body.gallery);
    if (req.body.specs !== undefined) data.specs = typeof req.body.specs === 'string' ? req.body.specs : JSON.stringify(req.body.specs);

    // SPEC v3.0 §IX: commissionPoints independent from price
    if (req.body.commissionPoints !== undefined) data.commissionPoints = Number(req.body.commissionPoints);

    // SPEC v3.0 §IX.3: Audit commissionPoints changes
    let oldCp = null;
    if (req.body.commissionPoints !== undefined) {
      const existing = await prisma.product.findUnique({ where: { id: req.params.id }, select: { commissionPoints: true, title: true } });
      oldCp = existing ? existing.commissionPoints : null;
    }

    const updated = await prisma.product.update({ where: { id: req.params.id }, data });

    if (req.body.commissionPoints !== undefined && oldCp !== null && oldCp !== Number(req.body.commissionPoints)) {
      await prisma.customerAuditLog.create({
        data: {
          customerId: req.params.id,
          action: 'UPDATE_COMMISSION_POINTS',
          details: JSON.stringify({
            productId: req.params.id,
            productTitle: updated.title,
            field: 'commissionPoints',
            oldValue: oldCp,
            newValue: Number(req.body.commissionPoints),
            actor: req.user.userId || req.user.id,
            timestamp: new Date().toISOString(),
          }),
          userId: req.user.userId || req.user.id,
        },
      }).catch(e => console.error('[COMMISSION_AUDIT_PRODUCT]', e.message));
    }

    res.json({
      ...updated,
      gallery: JSON.parse(updated.gallery || '[]'),
      specs: JSON.parse(updated.specs || '{}')
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


app.delete('/api/products/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Deleted product' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



// =============================================================================
// PHASE 2C — COMMISSION ENGINE v2.2 (FINAL SPEC v2.2)
// =============================================================================
// Architecture principles:
//   - F0/F1/F2 are RELATIVE per-transaction, not absolute 3-tier system
//   - commission depth max = 2 from each buyer's perspective
//   - NO skip: customers without businessId are not nodes in Business Tree
//   - ALL rates loaded from SystemPolicyConfig — no hard-code
//   - earnedPoints = commissionPoints × rate (NOT amount × rate)
//   - earnedMoney = earnedPoints × 1000
//   - rateSnapshot + policyVersion are IMMUTABLE after Commission record created
// =============================================================================

// ── Policy Config Cache ────────────────────────────────────────────────────────
// Cache in-process for the lifetime of the request to avoid N+1 DB hits
let _policyCache = null;
let _policyCacheAt = 0;
const POLICY_CACHE_TTL_MS = 60_000; // 60 seconds

async function loadPolicyCache() {
  const now = Date.now();
  if (_policyCache && (now - _policyCacheAt) < POLICY_CACHE_TTL_MS) return _policyCache;
  const rows = await prisma.systemPolicyConfig.findMany();
  _policyCache = {};
  for (const r of rows) _policyCache[r.key] = r.value;
  _policyCacheAt = now;
  return _policyCache;
}

/** Get a numeric rate from SystemPolicyConfig. Returns null if NOT_CONFIGURED or missing. */
async function getPolicyRate(key) {
  const cache = await loadPolicyCache();
  const val = cache[key];
  if (!val || val === 'NOT_CONFIGURED') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

/** Get current POLICY_VERSION string from config */
async function getPolicyVersion() {
  const cache = await loadPolicyCache();
  return cache['POLICY_VERSION'] || '1.0.0';
}

/** Get AMBASSADOR_THRESHOLD as number */
async function getAmbassadorThreshold() {
  const cache = await loadPolicyCache();
  return parseFloat(cache['AMBASSADOR_THRESHOLD'] || '5000');
}

// ── Business ID Generation ─────────────────────────────────────────────────────
/** Generate next WK-NNNNN Business ID atomically within a Prisma transaction */
async function generateBusinessId(tx) {
  const record = await tx.businessIdSequence.update({
    where: { id: 1 },
    data: { nextVal: { increment: 1 } },
    select: { nextVal: true },
  });
  return `WK-${record.nextVal}`;
}

// ── Network Tree Helpers ───────────────────────────────────────────────────────
/**
 * Find the F1 of a given user: direct sponsor child of userId
 * that has a Business ID (is a Business Tree node).
 * NOTE: We look UP the sponsor chain (buyer's sponsor), not DOWN.
 *
 * When buyer places an order:
 *   F1_of_buyer = buyer.sponsorUserId's user (if that user has businessId)
 *   F2_of_buyer = F1's sponsorUserId's user (if that user has businessId)
 *
 * This function: given a userId (the BUYER), find their direct sponsor who has businessId.
 */
async function getSponsorWithBusinessId(userId) {
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { sponsorUserId: true }
  });
  if (!user || !user.sponsorUserId) return null;

  const sponsor = await prisma.user.findUnique({
    where: { id: user.sponsorUserId },
    select: { id: true, userId: true, businessId: true, rank: true, rankStatus: true,
              isSystemParticipant: true, status: true, qualifyingPoints: true,
              sponsorUserId: true, fullName: true }
  });
  // Sponsor must have businessId (be a Business Tree node) and be active
  if (!sponsor || !sponsor.businessId || sponsor.status !== 'ACTIVE') return null;
  return sponsor;
}

/**
 * SPEC v2.2 § IV: F1 of F0 = direct sponsor of F0 with businessId
 * F2 of F0 = direct sponsor of F1 with businessId
 * NO BFS/DFS skip — strictly direct relationship only
 */
async function getF1andF2ofBuyer(buyerInternalId) {
  const f1 = await getSponsorWithBusinessId(buyerInternalId);
  if (!f1) return { f1: null, f2: null };
  const f2 = await getSponsorWithBusinessId(f1.id);
  return { f1, f2 };
}

// ── Split-Point Algorithm ──────────────────────────────────────────────────────
/**
 * Compute split-point commission for Ambassador self-activation purchases.
 * Returns { qualifyingPart, excessPart, qualifyingRate, excessRate, totalEarned }
 * SPEC v2.2 § VII
 */
async function computeSplitPoint(currentQualifyingPoints, orderTotalCP) {
  const threshold = await getAmbassadorThreshold();
  const qualifyingRate = await getPolicyRate('AMBASSADOR_QUALIFYING_PORTION') || 0.20;
  const excessRate = await getPolicyRate('AMBASSADOR_EXCESS_PORTION') || 0.10;

  let qualifyingPart, excessPart;
  const remaining = threshold - currentQualifyingPoints;

  if (remaining <= 0) {
    // Already past threshold — all excess
    qualifyingPart = 0;
    excessPart = orderTotalCP;
  } else if (orderTotalCP <= remaining) {
    // Order does not reach threshold
    qualifyingPart = orderTotalCP;
    excessPart = 0;
  } else {
    // Order crosses threshold
    qualifyingPart = remaining;
    excessPart = orderTotalCP - remaining;
  }

  return { qualifyingPart, excessPart, qualifyingRate, excessRate,
           totalEarned: qualifyingPart * qualifyingRate + excessPart * excessRate };
}

// ── Commission Engine v2.2 ─────────────────────────────────────────────────────
/**
 * Main commission engine — called within POST /api/orders transaction.
 * Returns array of Commission data objects to be created.
 * SPEC v2.2 § V: F0/F1/F2 relative, max depth 2, no skip
 *
 * @param {object} buyer - The User who placed the order (loaded with Prisma, has .id, .rank, .businessId, etc.)
 * @param {object} order - The created Order record
 * @param {Array}  items - Array of { serviceId, unitCommissionPts, lineCommissionPts, qty, amount }
 * @param {object} customer - The Customer record (has .phone)
 */
async function createCommissionsForOrder_v2(buyer, order, items, customer) {
  const commissions = [];
  const policyVersion = await getPolicyVersion();
  const threshold = await getAmbassadorThreshold();

  // Total commission points for this order
  const orderTotalCP = items.reduce((sum, i) => sum + (i.lineCommissionPts || 0), 0);
  if (orderTotalCP <= 0) return commissions; // No commissionable points → skip

  const buyerRank = buyer.rank || null;
  const buyerHasId = !!buyer.businessId;
  const isSelfBuy = buyer.phone === customer.phone; // buyer IS the customer

  // Determine customer's businessId status
  // In this system, customer records are separate from User records.
  // A customer "has Business ID" means they are also a User with businessId.
  // We look up by phone match.
  let customerUser = null;
  if (!isSelfBuy) {
    customerUser = await prisma.user.findUnique({
      where: { phone: customer.phone },
      select: { id: true, businessId: true, rank: true }
    });
  }
  const customerHasId = customerUser && !!customerUser.businessId;

  // ── Find F1 and F2 of buyer (sponsor chain, strict depth 2) ──────────────
  const { f1, f2 } = await getF1andF2ofBuyer(buyer.id);

  // ── SELF commission (buyer earns on own purchase) ─────────────────────────
  if (buyerHasId) {
    let selfRate = null;
    let selfRuleKey = null;

    if (buyerRank === 'DIRECTOR') {
      selfRate = isSelfBuy || !customerHasId
        ? await getPolicyRate('DIRECTOR_SELF_BUY')
        : await getPolicyRate('DIRECTOR_DIRECT_WITH_ID');
      selfRuleKey = isSelfBuy || !customerHasId ? 'DIRECTOR_SELF_BUY' : 'DIRECTOR_DIRECT_WITH_ID';
      if (!isSelfBuy && !customerHasId) selfRuleKey = 'DIRECTOR_DIRECT_NO_ID';
      if (!isSelfBuy && !customerHasId) selfRate = await getPolicyRate('DIRECTOR_DIRECT_NO_ID');

    } else if (buyerRank === 'MANAGER') {
      if (isSelfBuy) {
        selfRate = await getPolicyRate('MANAGER_SELF_BUY');
        selfRuleKey = 'MANAGER_SELF_BUY';
      } else if (!customerHasId) {
        selfRate = await getPolicyRate('MANAGER_DIRECT_NO_ID');
        selfRuleKey = 'MANAGER_DIRECT_NO_ID';
      } else {
        selfRate = await getPolicyRate('MANAGER_DIRECT_WITH_ID');
        selfRuleKey = 'MANAGER_DIRECT_WITH_ID';
      }

    } else if (buyerRank === 'AMBASSADOR') {
      // SPEC v3.0 §I.2: AMBASSADOR_SELF_BUY ≠ AMBASSADOR_DIRECT_NO_ID
      // Both are 20% but separate rules — Admin may tune independently
      if (isSelfBuy) {
        selfRate = await getPolicyRate('AMBASSADOR_SELF_BUY');
        selfRuleKey = 'AMBASSADOR_SELF_BUY';
      } else if (!customerHasId) {
        selfRate = await getPolicyRate('AMBASSADOR_DIRECT_NO_ID');
        selfRuleKey = 'AMBASSADOR_DIRECT_NO_ID';
      } else {
        selfRate = await getPolicyRate('AMBASSADOR_DIRECT_WITH_ID');
        selfRuleKey = 'AMBASSADOR_DIRECT_WITH_ID';
      }
    }

    if (selfRate !== null && selfRuleKey) {
      const earnedPoints = orderTotalCP * selfRate;
      commissions.push({
        orderId: order.id,
        receiverId: buyer.userId,
        amount: earnedPoints * 1000,
        type: 'SELF',
        status: 'PENDING',
        rateSnapshot: selfRate,
        rankSnapshot: buyerRank,
        baseAmount: orderTotalCP * 1000,
        policyRef: selfRuleKey,
        // Phase 2C fields
        ruleKey: selfRuleKey,
        policyVersion,
        role: 'SELF',
        basePoints: orderTotalCP,
        earnedPoints,
        earnedMoney: earnedPoints * 1000,
      });
    }
  }

  // ── F1 commission (buyer's direct sponsor with businessId) ────────────────
  // SPEC v2.2 §V: F1 rate depends on F1's rank and the transaction type
  if (f1) {
    let f1Rate = null;
    let f1RuleKey = null;
    const f1Rank = f1.rank || null;

    if (f1Rank === 'DIRECTOR') {
      f1Rate = await getPolicyRate('DIRECTOR_F1');
      f1RuleKey = 'DIRECTOR_F1';
    } else if (f1Rank === 'MANAGER') {
      if (isSelfBuy || buyerHasId) {
        // Buyer (F0) is self-buying or has ID → F1 earns F1_PURCHASE rate
        f1Rate = await getPolicyRate('MANAGER_F1_PURCHASE');
        f1RuleKey = 'MANAGER_F1_PURCHASE';
      } else {
        // Buyer sold to customer without ID → MANAGER_F1_SELL_TO_CUSTOMER_NO_ID
        f1Rate = await getPolicyRate('MANAGER_F1_SELL_TO_CUSTOMER_NO_ID');
        f1RuleKey = 'MANAGER_F1_SELL_TO_CUSTOMER_NO_ID';
      }
    } else if (f1Rank === 'AMBASSADOR') {
      // Ambassador as F1 — use Ambassador direct rates for their own customers
      // Per spec: not double-dipping, F1 earns based on their own rank
      f1Rate = null; // Ambassador F1 rates TBD — OPEN-Q1
      f1RuleKey = null;
    }

    if (f1Rate !== null && f1RuleKey) {
      const earnedPoints = orderTotalCP * f1Rate;
      commissions.push({
        orderId: order.id,
        receiverId: f1.userId,
        amount: earnedPoints * 1000,
        type: 'OVERRIDE_F1',
        status: 'PENDING',
        rateSnapshot: f1Rate,
        rankSnapshot: f1Rank,
        baseAmount: orderTotalCP * 1000,
        policyRef: f1RuleKey,
        ruleKey: f1RuleKey,
        policyVersion,
        role: 'F1',
        basePoints: orderTotalCP,
        earnedPoints,
        earnedMoney: earnedPoints * 1000,
      });
    }
  }

  // ── F2 commission (F1's direct sponsor with businessId) ───────────────────
  // SPEC v2.2 §V: depth 2 max — no F3+
  if (f2) {
    let f2Rate = null;
    let f2RuleKey = null;
    const f2Rank = f2.rank || null;

    if (f2Rank === 'DIRECTOR') {
      f2Rate = await getPolicyRate('DIRECTOR_F2');
      f2RuleKey = 'DIRECTOR_F2';
    } else if (f2Rank === 'MANAGER') {
      f2Rate = await getPolicyRate('MANAGER_F2_PURCHASE');
      f2RuleKey = 'MANAGER_F2_PURCHASE';
    }
    // depth >= 3 → 0 commission → no record created (SPEC v2.2 §II.3)

    if (f2Rate !== null && f2RuleKey) {
      const earnedPoints = orderTotalCP * f2Rate;
      commissions.push({
        orderId: order.id,
        receiverId: f2.userId,
        amount: earnedPoints * 1000,
        type: 'OVERRIDE_F2',
        status: 'PENDING',
        rateSnapshot: f2Rate,
        rankSnapshot: f2Rank,
        baseAmount: orderTotalCP * 1000,
        policyRef: f2RuleKey,
        ruleKey: f2RuleKey,
        policyVersion,
        role: 'F2',
        basePoints: orderTotalCP,
        earnedPoints,
        earnedMoney: earnedPoints * 1000,
      });
    }
  }
  // SPEC v2.2 §II.3: depth >= 3 → NO commission record → enforced by stopping here

  return commissions;
}

// ── Split-Point Commission (Ambassador self-qualification orders) ──────────────
/**
 * Special case: buyer is NOT yet Ambassador (isSystemParticipant=true, businessId=null).
 * Commission goes to buyer's F1 (sponsor) using split-point algorithm.
 * Creates 2 Commission records (QUALIFYING_SPLIT + EXCESS_SPLIT) for audit.
 * SPEC v2.2 § VII, TC-C06, TC-C07 (TC-18)
 */
async function createSplitPointCommissions(buyer, order, orderTotalCP, f1) {
  if (!f1 || orderTotalCP <= 0) return [];
  const policyVersion = await getPolicyVersion();
  const split = await computeSplitPoint(buyer.qualifyingPoints || 0, orderTotalCP);
  const commissions = [];

  if (split.qualifyingPart > 0 && split.qualifyingRate > 0) {
    const earnedPoints = split.qualifyingPart * split.qualifyingRate;
    commissions.push({
      orderId: order.id,
      receiverId: f1.userId,
      amount: earnedPoints * 1000,
      type: 'DIRECT',
      status: 'PENDING',
      rateSnapshot: split.qualifyingRate,
      rankSnapshot: f1.rank,
      baseAmount: split.qualifyingPart * 1000,
      policyRef: 'AMBASSADOR_QUALIFYING_SPLIT',
      ruleKey: 'AMBASSADOR_QUALIFYING_SPLIT',
      policyVersion,
      role: 'F1',
      basePoints: split.qualifyingPart,
      earnedPoints,
      earnedMoney: earnedPoints * 1000,
    });
  }

  if (split.excessPart > 0 && split.excessRate > 0) {
    const earnedPoints = split.excessPart * split.excessRate;
    commissions.push({
      orderId: order.id,
      receiverId: f1.userId,
      amount: earnedPoints * 1000,
      type: 'DIRECT',
      status: 'PENDING',
      rateSnapshot: split.excessRate,
      rankSnapshot: f1.rank,
      baseAmount: split.excessPart * 1000,
      policyRef: 'AMBASSADOR_EXCESS_SPLIT',
      ruleKey: 'AMBASSADOR_EXCESS_SPLIT',
      policyVersion,
      role: 'F1',
      basePoints: split.excessPart,
      earnedPoints,
      earnedMoney: earnedPoints * 1000,
    });
  }

  return commissions;
}

// ── S-Points Engine v2 ────────────────────────────────────────────────────────
/**
 * Award S-Points and qualifyingPoints after order completion.
 * SPEC v2.2 § X:
 *   - qualifyingPoints only counted from participantAt onward
 *   - commissionPoints (not amount/1000) is the source of truth
 *   - All MACHINE type services earn points
 */
async function awardSPointsForOrder_v2(order, buyer) {
  try {
    const policyVersion = await getPolicyVersion();
    const items = await prisma.orderItem.findMany({
      where: { orderId: order.id },
      include: { service: true },
    });

    let totalCP = 0;
    for (const item of items) {
      if (item.service && item.service.productType === 'MACHINE') {
        // Use commissionPoints snapshot on OrderItem (NOT amount/1000)
        totalCP += item.lineCommissionPts || 0;
      }
    }

    if (totalCP <= 0) return;

    const isQualifying = buyer.isSystemParticipant && !!buyer.participantAt;
    const newBalance = (buyer.sPoints || 0) + totalCP;
    const newQualifyingPoints = isQualifying
      ? (buyer.qualifyingPoints || 0) + totalCP
      : (buyer.qualifyingPoints || 0);

    // Update user balances
    await prisma.user.update({
      where: { userId: buyer.userId },
      data: {
        sPoints: newBalance,
        qualifyingPoints: newQualifyingPoints,
        totalMachinesBought: {
          increment: items.filter(i => i.service?.productType === 'MACHINE')
                         .reduce((s, i) => s + i.qty, 0)
        },
      },
    });

    // Create SPointTransaction with Phase 2C fields
    await prisma.sPointTransaction.create({
      data: {
        userId: buyer.userId,
        orderId: order.id,
        points: totalCP,
        type: 'EARN',
        isQualifying,
        snapshotBalance: newBalance,
        policyVersion,
        description: `Don hang #${order.id} - ${totalCP} CP`,
      },
    });

    console.log(`[S-POINTS v2] +${totalCP} CP to ${buyer.userId} (qualifying=${isQualifying}). Balance: ${newBalance}`);
  } catch (err) {
    console.error(`[S-POINTS v2 ERROR] order ${order.id}:`, err.message);
  }
}

// ── Ambassador Auto-Activation v2 ─────────────────────────────────────────────
/**
 * Check and auto-activate Ambassador if qualifyingPoints >= threshold.
 * SPEC v2.2 § VIII.1: Uses qualifyingPoints + AMBASSADOR_THRESHOLD config.
 * Issues businessId from atomic sequence.
 */
async function checkAndAutoActivateAmbassador_v2(userId) {
  try {
    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user || user.businessId) return; // Already has ID
    if (!user.isSystemParticipant) return; // Must have joined system

    const threshold = await getAmbassadorThreshold();
    if ((user.qualifyingPoints || 0) < threshold) return;

    // Atomically generate businessId and update user
    await prisma.$transaction(async (tx) => {
      const bizId = await generateBusinessId(tx);
      await tx.user.update({
        where: { userId },
        data: {
          businessId: bizId,
          rank: 'AMBASSADOR',
          rankStatus: 'ACTIVE_RANK',
          rankAchievedAt: new Date(),
          rankActivationMethod: 'AUTO_SPOINT_THRESHOLD',
          rankActivatedBy: null,
        },
      });
      await tx.rankHistory.create({
        data: {
          userId,
          fromRank: user.rank || null,
          toRank: 'AMBASSADOR',
          fromStatus: user.rankStatus || null,
          toStatus: 'ACTIVE_RANK',
          reason: 'AUTO_SPOINT_THRESHOLD',
          triggeredBy: 'SYSTEM',
          metadata: JSON.stringify({
            qualifyingPointsAtTime: user.qualifyingPoints,
            threshold,
            businessIdAssigned: bizId,
          }),
        },
      });
      console.log(`[AMBASSADOR v2] ${userId} auto-activated. businessId=${bizId}`);
    });

    // After activation, check if sponsor can be promoted
    if (user.sponsorUserId) {
      checkAndAutoPromoteRank(user.sponsorUserId).catch(e =>
        console.error('[RANK PROMOTE ERROR]', e.message));
    }
  } catch (e) {
    console.error('[AMBASSADOR v2 ERROR]', e.message);
  }
}

// ── Rank Auto-Promotion v2 ────────────────────────────────────────────────────
/**
 * Check if a user should be auto-promoted to Manager or Director.
 * SPEC v2.2 § VIII.2-3:
 *   Ambassador → Manager: 5 direct F1s who are AMBASSADOR with businessId
 *   Manager → Director:   5 direct F1s who are MANAGER with businessId
 * "Direct F1" = users whose sponsorUserId = this user's .id (depth 1 only).
 */
async function checkAndAutoPromoteRank(internalId) {
  try {
    const user = await prisma.user.findUnique({ where: { id: internalId } });
    if (!user || !user.businessId) return;

    const currentRank = user.rank;
    let targetRank = null;
    let requiredF1Rank = null;

    if (currentRank === 'AMBASSADOR') {
      targetRank = 'MANAGER';
      requiredF1Rank = 'AMBASSADOR';
    } else if (currentRank === 'MANAGER') {
      targetRank = 'DIRECTOR';
      requiredF1Rank = 'MANAGER';
    } else {
      return; // Already Director or no rank
    }

    // Count direct F1s (sponsorUserId = user.id) who have achieved requiredF1Rank and have businessId
    const qualifyingF1Count = await prisma.user.count({
      where: {
        sponsorUserId: user.id,
        businessId: { not: null },
        rank: requiredF1Rank,
        status: 'ACTIVE',
      },
    });

    if (qualifyingF1Count < 5) return;

    // Promote!
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: internalId },
        data: {
          rank: targetRank,
          rankStatus: 'ACTIVE_RANK',
          rankAchievedAt: new Date(),
          rankActivationMethod: 'AUTO_F1_COUNT',
          rankActivatedBy: null,
        },
      });
      await tx.rankHistory.create({
        data: {
          userId: user.userId,
          fromRank: currentRank,
          toRank: targetRank,
          fromStatus: user.rankStatus || null,
          toStatus: 'ACTIVE_RANK',
          reason: 'AUTO_F1_COUNT',
          triggeredBy: 'SYSTEM',
          metadata: JSON.stringify({ qualifyingF1Count, requiredF1Rank }),
        },
      });
      console.log(`[RANK PROMOTE v2] ${user.userId}: ${currentRank} -> ${targetRank} (${qualifyingF1Count} F1s)`);
    });
  } catch (e) {
    console.error('[RANK PROMOTE v2 ERROR]', e.message);
  }
}

// ================= PHASE 2A: S-POINTS & RANK FOUNDATION API =================

// HELPER: Award S-Points passively after order completion (LEGACY — kept for old orders)
// Only awards if service.productType = 'MACHINE' (per spec)
// If productType is null, no points are awarded (safe default — pending MAU_THUAN_04 decision)

async function awardSPointsForOrder(order, ctv) {
  try {
    const items = await prisma.orderItem.findMany({
      where: { orderId: order.id },
      include: { service: true }
    });

    let totalPointsEarned = 0;
    for (const item of items) {
      if (item.service && item.service.productType === 'MACHINE') {
        // 1 point = 1,000 VND per policy
        const pointsEarned = Math.floor(item.amount / 1000);
        if (pointsEarned > 0) {
          await prisma.sPointTransaction.create({
            data: {
              userId: ctv.userId,
              orderId: order.id,
              points: pointsEarned,
              type: 'EARN',
              description: `Don hang #${order.id} - ${item.service.name} (${item.qty} may)`
            }
          });
          totalPointsEarned += pointsEarned;
          await prisma.user.update({
            where: { userId: ctv.userId },
            data: { totalMachinesBought: { increment: item.qty } }
          });
        }
      }
    }

    if (totalPointsEarned > 0) {
      await prisma.user.update({
        where: { userId: ctv.userId },
        data: { sPoints: { increment: totalPointsEarned } }
      });
      console.log(`[S-POINTS] Awarded ${totalPointsEarned} pts to ${ctv.userId} for order ${order.id}`);
    }
  } catch (err) {
    console.error(`[S-POINTS] Error for order ${order.id}:`, err.message);
  }
}


// ============================================================
// PHASE 2B — HELPER FUNCTIONS
// ============================================================

/** Check if a user is an active Ambassador */
function isActiveAmbassador(user) {
  return user &&
    user.rank === 'AMBASSADOR' &&
    ['ACTIVE_RANK', 'MANUAL_APPROVED'].includes(user.rankStatus);
}

/** Find nearest Ambassador ancestor above a given userId */
async function findNearestAmbassadorAncestor(startUserId, excludeUserId = null) {
  let currentId = startUserId;
  const visited = new Set();
  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const user = await prisma.user.findUnique({ where: { userId: currentId } });
    if (!user || !user.parentId) break;
    const parent = await prisma.user.findUnique({ where: { userId: user.parentId } });
    if (!parent) break;
    if (parent.userId === excludeUserId) {
      currentId = parent.userId;
      continue;
    }
    if (isActiveAmbassador(parent)) {
      return parent;
    }
    currentId = parent.userId;
  }
  return null;
}

/** Look up a retail commission rule for a given productType and price */
async function getRetailCommRule(productType, price, rank) {
  const rules = await prisma.commissionPriceRule.findMany({
    where: {
      productType,
      isActive: true,
      OR: [{ rankRequired: rank }, { rankRequired: null }]
    },
    orderBy: { minPrice: 'desc' }
  });
  for (const rule of rules) {
    const aboveMin = rule.minPrice === null || price >= rule.minPrice;
    const belowMax = rule.maxPrice === null || price <= rule.maxPrice;
    if (aboveMin && belowMax) return rule;
  }
  return null;
}

/** Auto-activate Ambassador if user qualifies. Creates RankHistory audit. */
async function checkAndAutoActivateAmbassador(userId) {
  try {
    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user || user.rank === 'AMBASSADOR') return;
    const qualifies = user.totalMachinesBought >= 1 || user.sPoints >= 5000;
    if (!qualifies) return;
    const method = user.totalMachinesBought >= 1 ? 'AUTO_MACHINE_PURCHASE' : 'AUTO_SPOINT_THRESHOLD';
    await prisma.user.update({
      where: { userId },
      data: {
        rank: 'AMBASSADOR',
        rankStatus: 'ACTIVE_RANK',
        rankAchievedAt: new Date(),
        rankActivationMethod: method,
        rankActivatedBy: null
      }
    });
    await prisma.rankHistory.create({
      data: {
        userId,
        fromRank: null,
        toRank: 'AMBASSADOR',
        fromStatus: null,
        toStatus: 'ACTIVE_RANK',
        reason: method,
        triggeredBy: 'SYSTEM',
        metadata: JSON.stringify({
          machinesBoughtAtTime: user.totalMachinesBought,
          sPointsAtTime: user.sPoints
        })
      }
    });
    console.log(`[AMBASSADOR AUTO] ${userId} qualified via ${method}`);
  } catch (e) {
    console.error('[AMBASSADOR AUTO ERROR]', e.message);
  }
}

// ============================================================
// PHASE 2B — AMBASSADOR RANK MANAGEMENT ENDPOINTS
// ============================================================

/** GET /api/rank/ambassador/check/:userId — Preview eligibility */
app.get('/api/rank/ambassador/check/:userId', authenticateToken, async (req, res) => {
  try {
    const targetId = req.params.userId;
    if (req.user.role !== 'admin' && req.user.id !== targetId) {
      return res.status(403).json({ success: false, message: 'Không có quyền.' });
    }
    const user = await prisma.user.findUnique({ where: { userId: targetId } });
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy user.' });
    const conditionA = user.totalMachinesBought >= 1;
    const conditionB = user.sPoints >= 5000;
    res.json({
      success: true,
      data: {
        userId: user.userId,
        name: user.fullName,
        currentRank: user.rank,
        currentRankStatus: user.rankStatus,
        isAmbassador: user.rank === 'AMBASSADOR',
        eligibility: {
          qualifies: conditionA || conditionB,
          conditionA: { met: conditionA, value: user.totalMachinesBought, required: 1, label: 'Đã mua ≥1 sản phẩm' },
          conditionB: { met: conditionB, value: user.sPoints, required: 5000, label: 'S-Points ≥5.000' }
        }
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/** GET /api/rank/ambassador/eligible — List CTVs eligible for auto-activation */
app.get('/api/rank/ambassador/eligible', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const eligible = await prisma.user.findMany({
      where: {
        role: 'ctv',
        rank: null,
        OR: [
          { totalMachinesBought: { gte: 1 } },
          { sPoints: { gte: 5000 } }
        ]
      },
      select: { userId: true, fullName: true, phone: true, tier: true, totalMachinesBought: true, sPoints: true, createdAt: true }
    });
    res.json({ success: true, data: eligible, count: eligible.length });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/** POST /api/rank/ambassador/activate/:userId — Admin manual approve */
app.post('/api/rank/ambassador/activate/:userId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const targetId = req.params.userId;
    const { note } = req.body;
    const user = await prisma.user.findUnique({ where: { userId: targetId } });
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy user.' });
    if (user.rank === 'AMBASSADOR' && user.rankStatus === 'ACTIVE_RANK') {
      return res.status(400).json({ success: false, message: 'User đã là Ambassador ACTIVE.' });
    }
    await prisma.user.update({
      where: { userId: targetId },
      data: {
        rank: 'AMBASSADOR',
        rankStatus: 'MANUAL_APPROVED',
        rankAchievedAt: new Date(),
        rankActivationMethod: 'ADMIN_MANUAL_APPROVE',
        rankActivatedBy: req.user.id
      }
    });
    await prisma.rankHistory.create({
      data: {
        userId: targetId,
        fromRank: user.rank,
        toRank: 'AMBASSADOR',
        fromStatus: user.rankStatus,
        toStatus: 'MANUAL_APPROVED',
        reason: 'ADMIN_MANUAL_APPROVE',
        triggeredBy: req.user.id,
        metadata: JSON.stringify({
          approvalNote: note || '',
          machinesBoughtAtTime: user.totalMachinesBought,
          sPointsAtTime: user.sPoints,
          approvedByAdmin: req.user.id
        })
      }
    });
    res.json({ success: true, message: `Đã kích hoạt Ambassador cho ${user.name}.` });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/** POST /api/rank/ambassador/revoke/:userId — Admin revoke */
app.post('/api/rank/ambassador/revoke/:userId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const targetId = req.params.userId;
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Vui lòng cung cấp lý do thu hồi.' });
    const user = await prisma.user.findUnique({ where: { userId: targetId } });
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy user.' });
    if (user.rank !== 'AMBASSADOR') {
      return res.status(400).json({ success: false, message: 'User không phải Ambassador.' });
    }
    await prisma.user.update({
      where: { userId: targetId },
      data: { rankStatus: 'REVOKED', rankActivationMethod: null }
    });
    await prisma.rankHistory.create({
      data: {
        userId: targetId,
        fromRank: 'AMBASSADOR',
        toRank: 'AMBASSADOR',
        fromStatus: user.rankStatus,
        toStatus: 'REVOKED',
        reason: 'ADMIN_REVOKE',
        triggeredBy: req.user.id,
        metadata: JSON.stringify({ revokeReason: reason, revokedByAdmin: req.user.id })
      }
    });
    res.json({ success: true, message: `Đã thu hồi Ambassador của ${user.name}.` });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/** GET /api/rank/history/:userId — Rank change history */
app.get('/api/rank/history/:userId', authenticateToken, async (req, res) => {
  try {
    const targetId = req.params.userId;
    if (req.user.role !== 'admin' && req.user.id !== targetId) {
      return res.status(403).json({ success: false, message: 'Không có quyền.' });
    }
    const history = await prisma.rankHistory.findMany({
      where: { userId: targetId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: history });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================================
// PHASE 2B — WHOLESALE ORDER MODULE
// All CTVs can create wholesale orders (no rank restriction)
// Base price = service.price (CHOT — MAU_THUAN_03)
// ============================================================

function getWholesaleDiscountRate(totalMachines) {
  if (totalMachines >= 20) return 0.45;
  if (totalMachines >= 10) return 0.40;
  if (totalMachines >= 5) return 0.35;
  return null; // below minimum
}

/** GET /api/wholesale/price-preview — Preview wholesale pricing */
app.get('/api/wholesale/price-preview', authenticateToken, requireRole(['admin', 'ctv']), async (req, res) => {
  try {
    const { qty } = req.query;
    const totalQty = parseInt(qty) || 0;
    const rate = getWholesaleDiscountRate(totalQty);
    res.json({
      success: true,
      data: {
        totalMachines: totalQty,
        discountRate: rate,
        discountPercent: rate ? Math.round(rate * 100) + '%' : null,
        eligible: rate !== null,
        message: rate ? `Chiết khấu ${Math.round(rate * 100)}% trên giá bán` : 'Cần tối thiểu 5 máy để được chiết khấu sỉ.'
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/** GET /api/wholesale/orders */
app.get('/api/wholesale/orders', authenticateToken, requireRole(['admin', 'ctv']), async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (req.user.role === 'ctv') where.buyerUserId = req.user.id;
    if (status) where.status = status;
    const orders = await prisma.wholesaleOrder.findMany({
      where,
      include: {
        buyer: { select: { userId: true, fullName: true, phone: true, tier: true, rank: true } },
        items: { include: { service: { select: { id: true, name: true, price: true, listPrice: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: orders });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/** POST /api/wholesale/orders — Create wholesale order */
app.post('/api/wholesale/orders', authenticateToken, requireRole(['admin', 'ctv']), async (req, res) => {
  try {
    const { items, notes } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp danh sách sản phẩm.' });
    }
    // Validate and calculate
    let totalMachines = 0;
    let priceTotal = 0;
    let listPriceTotal = 0;
    const itemsData = [];
    for (const item of items) {
      const svc = await prisma.service.findUnique({ where: { id: item.serviceId } });
      if (!svc) return res.status(400).json({ success: false, message: `Không tìm thấy sản phẩm ${item.serviceId}` });
      const qty = Math.max(1, parseInt(item.qty) || 1);
      totalMachines += qty;
      const unitPrice = svc.price;
      const unitListPrice = svc.listPrice || null;
      priceTotal += unitPrice * qty;
      if (unitListPrice) listPriceTotal += unitListPrice * qty;
      itemsData.push({ serviceId: item.serviceId, qty, unitPrice, unitListPrice, serviceName: svc.name });
    }
    const discountRate = getWholesaleDiscountRate(totalMachines);
    if (!discountRate) {
      return res.status(400).json({ success: false, message: `Cần tối thiểu 5 máy để đặt đơn sỉ. Hiện tại: ${totalMachines} máy.` });
    }
    const finalAmount = priceTotal * (1 - discountRate);
    const buyerUserId = req.user.id;
    const order = await prisma.wholesaleOrder.create({
      data: {
        buyerUserId,
        totalMachines,
        discountRate,
        basePriceType: 'PRICE',
        priceTotal,
        listPriceTotal: listPriceTotal || null,
        finalAmount,
        notes: notes || null,
        status: 'PENDING_APPROVAL',
        items: {
          create: itemsData.map(i => ({
            serviceId: i.serviceId,
            qty: i.qty,
            unitPrice: i.unitPrice,
            unitListPrice: i.unitListPrice,
            discountRate,
            discountedPrice: i.unitPrice * (1 - discountRate),
            subtotal: i.unitPrice * (1 - discountRate) * i.qty
          }))
        }
      },
      include: { items: true }
    });
    res.json({ success: true, data: order, message: `Đơn sỉ đã tạo. Chiết khấu ${Math.round(discountRate * 100)}% trên giá bán.` });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/** GET /api/wholesale/orders/:id */
app.get('/api/wholesale/orders/:id', authenticateToken, requireRole(['admin', 'ctv']), async (req, res) => {
  try {
    const order = await prisma.wholesaleOrder.findUnique({
      where: { id: req.params.id },
      include: {
        buyer: { select: { userId: true, fullName: true, phone: true, tier: true, rank: true } },
        items: { include: { service: { select: { id: true, name: true, price: true, listPrice: true } } } }
      }
    });
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn sỉ.' });
    if (req.user.role === 'ctv' && order.buyerUserId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Không có quyền.' });
    }
    res.json({ success: true, data: order });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/** PUT /api/wholesale/orders/:id/approve */
app.put('/api/wholesale/orders/:id/approve', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const order = await prisma.wholesaleOrder.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED', approvedBy: req.user.id, approvedAt: new Date() }
    });
    res.json({ success: true, data: order, message: 'Đã duyệt đơn sỉ.' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/** PUT /api/wholesale/orders/:id/ship */
app.put('/api/wholesale/orders/:id/ship', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const order = await prisma.wholesaleOrder.update({
      where: { id: req.params.id },
      data: { status: 'SHIPPING', shippedAt: new Date() }
    });
    res.json({ success: true, data: order, message: 'Đã cập nhật trạng thái giao hàng.' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/** PUT /api/wholesale/orders/:id/complete */
app.put('/api/wholesale/orders/:id/complete', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const order = await prisma.wholesaleOrder.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED', completedAt: new Date() }
    });
    res.json({ success: true, data: order, message: 'Đơn sỉ đã hoàn tất.' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/** PUT /api/wholesale/orders/:id/cancel */
app.put('/api/wholesale/orders/:id/cancel', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await prisma.wholesaleOrder.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED', notes: reason || null }
    });
    res.json({ success: true, data: order, message: 'Đã hủy đơn sỉ.' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================================
// PHASE 2B — COMMISSION PRICE RULES MANAGEMENT (Admin)
// ============================================================

/** GET /api/commission-rules */
app.get('/api/commission-rules', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const rules = await prisma.commissionPriceRule.findMany({ orderBy: [{ productType: 'asc' }, { minPrice: 'desc' }] });
    res.json({ success: true, data: rules });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/** POST /api/commission-rules */
app.post('/api/commission-rules', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { productType, minPrice, maxPrice, rate, commType, rankRequired, isActive, note } = req.body;
    if (!productType || !commType) {
      return res.status(400).json({ success: false, message: 'productType và commType là bắt buộc.' });
    }
    const rule = await prisma.commissionPriceRule.create({
      data: { productType, minPrice: minPrice || null, maxPrice: maxPrice || null, rate: rate || null, commType, rankRequired: rankRequired || null, isActive: isActive !== false, note: note || null }
    });
    res.json({ success: true, data: rule });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/** PUT /api/commission-rules/:id */
app.put('/api/commission-rules/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { minPrice, maxPrice, rate, commType, rankRequired, isActive, note } = req.body;
    const rule = await prisma.commissionPriceRule.update({
      where: { id: req.params.id },
      data: {
        ...(minPrice !== undefined && { minPrice }),
        ...(maxPrice !== undefined && { maxPrice }),
        ...(rate !== undefined && { rate }),
        ...(commType && { commType }),
        ...(rankRequired !== undefined && { rankRequired }),
        ...(isActive !== undefined && { isActive }),
        ...(note !== undefined && { note })
      }
    });
    res.json({ success: true, data: rule });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/** GET /api/commissions/preview — Preview commission for a hypothetical order */
app.get('/api/commissions/preview', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { ctvUserId, serviceId, amount, qty } = req.query;
    if (!ctvUserId || !serviceId || !amount) {
      return res.status(400).json({ success: false, message: 'ctvUserId, serviceId, amount required.' });
    }
    const ctv = await prisma.user.findUnique({
      where: { userId: ctvUserId },
      include: { parent: { include: { parent: true } } }
    });
    const svc = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!ctv || !svc) return res.status(404).json({ success: false, message: 'User hoặc Service không tồn tại.' });
    const orderAmount = parseFloat(amount);
    const preview = [];
    const ambassadorActive = isActiveAmbassador(ctv);
    if (ambassadorActive) {
      const rule = await getRetailCommRule(svc.productType || 'SERVICE', svc.price, 'AMBASSADOR');
      if (rule && rule.rate) {
        preview.push({ receiver: ctv.name, type: rule.commType, rate: rule.rate, amount: orderAmount * rule.rate, policyRef: 'AM-02' });
      }
      if (ctv.parent && isActiveAmbassador(ctv.parent)) {
        preview.push({ receiver: ctv.parent.name, type: 'DISTRIBUTION_PARTNER', rate: 0.10, amount: orderAmount * 0.10, policyRef: 'AM-03' });
      }
    }
    res.json({ success: true, data: preview });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});


// GET /api/s-points/:userId
app.get('/api/s-points/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.role !== 'admin' && req.user.role !== 'accountant' && req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Khong co quyen xem diem S tai khoan nay.' });
    }
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { userId: true, fullName: true, sPoints: true, rank: true, rankStatus: true, totalMachinesBought: true }
    });
    if (!user) return res.status(404).json({ success: false, message: 'Khong tim thay nguoi dung.' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/s-points/:userId/history
app.get('/api/s-points/:userId/history', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.role !== 'admin' && req.user.role !== 'accountant' && req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Khong co quyen xem lich su diem S nay.' });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const [total, transactions] = await Promise.all([
      prisma.sPointTransaction.count({ where: { userId } }),
      prisma.sPointTransaction.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, skip, take: limit })
    ]);
    res.json({ success: true, data: transactions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/rank/info/:userId
app.get('/api/rank/info/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.role !== 'admin' && req.user.role !== 'accountant' && req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Khong co quyen truy cap thong tin cap bac nay.' });
    }
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { userId: true, fullName: true, tier: true, rank: true, rankStatus: true, rankAchievedAt: true, sPoints: true, totalMachinesBought: true, wholesaleEligible: true, regionCode: true }
    });
    if (!user) return res.status(404).json({ success: false, message: 'Khong tim thay nguoi dung.' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/services/product-types  (admin only)
app.get('/api/services/product-types', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const services = await prisma.service.findMany({ select: { id: true, name: true, productType: true, price: true, listPrice: true } });
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/services/:id/product-type  (admin only)
app.put('/api/services/:id/product-type', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { productType, listPrice } = req.body;
    const allowed = ['MACHINE', 'SUPPLY', 'SERVICE', null];
    if (!allowed.includes(productType)) {
      return res.status(400).json({ success: false, message: 'productType khong hop le. Chap nhan: MACHINE, SUPPLY, SERVICE, hoac null.' });
    }
    const updated = await prisma.service.update({
      where: { id: req.params.id },
      data: { productType: productType || null, listPrice: listPrice !== undefined ? parseFloat(listPrice) : undefined }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================================
// PHASE 2C — ADMIN: POLICY CONFIG MANAGEMENT
// =============================================================================

/** GET /api/policy-config — List all policy config entries */
app.get('/api/policy-config', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const configs = await prisma.systemPolicyConfig.findMany({ orderBy: { key: 'asc' } });
    res.json({ success: true, data: configs });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/** PUT /api/policy-config/:key — Admin update a single policy value */
app.put('/api/policy-config/:key', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    if (value === undefined || value === null) {
      return res.status(400).json({ success: false, message: 'value is required' });
    }
    // Invalidate policy cache on update
    _policyCache = null;
    const updated = await prisma.systemPolicyConfig.update({
      where: { key },
      data: {
        value: String(value),
        updatedBy: req.user.userId || req.user.id,
        updatedAt: new Date(),
      },
    });
    console.log(`[POLICY UPDATE] ${key} = ${value} by ${req.user.userId || req.user.id}`);
    res.json({ success: true, data: updated });
  } catch (e) {
    if (e.code === 'P2025') {
      return res.status(404).json({ success: false, message: `Policy key "${req.params.key}" not found` });
    }
    res.status(500).json({ success: false, error: e.message });
  }
});

// =============================================================================
// PHASE 2C — NETWORK TREE API (v2.2: sponsorUserId, depth-limited)
// =============================================================================

/**
 * GET /api/network-tree/:userId — Get F1 and F2 of a given user (by userId display code)
 * SPEC v2.2: F0/F1/F2 are relative — this returns the sponsor chain UP from this user's perspective
 * plus their direct F1 downline (for dashboard display)
 */
app.get('/api/network-tree/:userId', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    if (req.user.role !== 'admin' && req.user.id !== targetUserId) {
      return res.status(403).json({ success: false, message: 'Khong co quyen.' });
    }

    const user = await prisma.user.findUnique({
      where: { userId: targetUserId },
      select: { id: true, userId: true, businessId: true, rank: true, sponsorUserId: true, fullName: true }
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // F1 sponsor of this user (depth 1 UP)
    const sponsorF1 = user.sponsorUserId
      ? await prisma.user.findUnique({
          where: { id: user.sponsorUserId },
          select: { id: true, userId: true, businessId: true, rank: true, fullName: true, sponsorUserId: true }
        })
      : null;

    // F2 sponsor (depth 2 UP)
    const sponsorF2 = sponsorF1?.sponsorUserId
      ? await prisma.user.findUnique({
          where: { id: sponsorF1.sponsorUserId },
          select: { id: true, userId: true, businessId: true, rank: true, fullName: true }
        })
      : null;

    // Direct F1 downline of this user (sponsorUserId = user.id, with businessId)
    const directF1Downline = await prisma.user.findMany({
      where: { sponsorUserId: user.id, businessId: { not: null } },
      select: { id: true, userId: true, businessId: true, rank: true, fullName: true },
    });

    res.json({
      success: true,
      data: {
        self: { userId: user.userId, businessId: user.businessId, rank: user.rank, fullName: user.fullName },
        sponsorF1: sponsorF1
          ? { userId: sponsorF1.userId, businessId: sponsorF1.businessId, rank: sponsorF1.rank, fullName: sponsorF1.fullName }
          : null,
        sponsorF2: sponsorF2
          ? { userId: sponsorF2.userId, businessId: sponsorF2.businessId, rank: sponsorF2.rank, fullName: sponsorF2.fullName }
          : null,
        directF1Downline,
        note: 'F0/F1/F2 are relative per SPEC v3.0. This shows sponsor chain UP and direct downline DOWN.'
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// =============================================================================
// PHASE 2C — SYSTEM PARTICIPATION (isSystemParticipant)
// SPEC v3.0 §III.3: Audit trail bắt buộc — không sửa âm thầm
// =============================================================================

/**
 * POST /api/users/:userId/join-system
 * Tích "THAM GIA HỆ THỐNG" cho user.
 * Actor: admin hoặc ctv (nếu là sponsor của user đó).
 * Body: { sponsorUserId?: string (internal id), reason?: string }
 */
app.post('/api/users/:userId/join-system', authenticateToken, requireRole(['admin', 'ctv']), async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const { sponsorUserId, reason } = req.body;

    const target = await prisma.user.findUnique({ where: { userId: targetUserId } });
    if (!target) return res.status(404).json({ success: false, message: 'Khong tim thay user.' });

    if (target.isSystemParticipant) {
      return res.status(400).json({ success: false, message: 'User da tham gia he thong.' });
    }

    // Resolve sponsor: use provided sponsorUserId or actor's id (for CTV)
    let resolvedSponsorId = sponsorUserId || null;
    if (req.user.role === 'ctv' && !sponsorUserId) {
      resolvedSponsorId = req.user.id; // CTV tự làm sponsor
    }

    const now = new Date();
    const updated = await prisma.user.update({
      where: { userId: targetUserId },
      data: {
        isSystemParticipant: true,
        participantAt: now,
        ...(resolvedSponsorId && { sponsorUserId: resolvedSponsorId }),
      },
    });

    // Ghi AuditLog theo SPEC v3.0 §III.3
    await prisma.customerAuditLog.create({
      data: {
        customerId: target.id, // dùng user.id làm ref (có thể tạo UserAuditLog riêng sau)
        action: 'JOIN_SYSTEM',
        details: JSON.stringify({
          targetUserId: targetUserId,
          oldValue: { isSystemParticipant: false },
          newValue: { isSystemParticipant: true, participantAt: now.toISOString() },
          sponsorId: resolvedSponsorId || null,
          actor: req.user.userId || req.user.id,
          reason: reason || null,
          timestamp: now.toISOString(),
        }),
        userId: req.user.userId || req.user.id,
      },
    });

    console.log(`[JOIN_SYSTEM] User ${targetUserId} joined by ${req.user.userId}. sponsorId=${resolvedSponsorId}`);
    res.json({ success: true, message: `User ${targetUserId} da tham gia he thong.`, data: sanitizeUser(updated) });
  } catch (e) {
    console.error('[JOIN_SYSTEM ERROR]', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// =============================================================================
// PHASE 2C — COMMISSION POINTS AUDIT (Product / Service)
// SPEC v3.0 §IX.3: ghi log mỗi lần Admin thay đổi commissionPoints
// =============================================================================

/**
 * GET /api/service-commission-audit/:serviceId
 * Xem lịch sử thay đổi commissionPoints của service
 */
app.get('/api/service-commission-audit/:serviceId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const logs = await prisma.customerAuditLog.findMany({
      where: {
        customerId: req.params.serviceId,
        action: 'UPDATE_COMMISSION_POINTS',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: logs });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// START SERVER
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[SECURE BACKEND ENGINE] Running on http://localhost:${PORT}`);
  });
}

module.exports = app;
// =============================================================================
// PHASE 2C - COMMISSION ENGINE V3
// =============================================================================
async function createCommissionsForOrder_v3(orderId) {
  await prisma.$transaction(async (tx) => {
    // 1. IDEMPOTENCY GUARD
    const alreadyProcessed = await tx.commissionProcessing.findUnique({
      where: { orderId }
    });
    if (alreadyProcessed) return;

    // 2. Load order + orderer + customer
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        customer: {
          select: { sponsorUserId: true, linkedUserId: true }
        }
      }
    });
    if (!order || order.status !== 'COMPLETED') return;

    const orderer = order.ordererUserId
      ? await tx.user.findUnique({
          where: { id: order.ordererUserId },
          select: { id: true, userId: true, businessId: true, rank: true, isSystemParticipant: true, qualifyingPoints: true, sponsorUserId: true }
        })
      : null;

    // Customer member (User có linkedUserId)
    const customerMember = order.customer.linkedUserId
      ? await tx.user.findUnique({
          where: { id: order.customer.linkedUserId },
          select: { id: true, userId: true, businessId: true, rank: true, isSystemParticipant: true, qualifyingPoints: true, sponsorUserId: true }
        })
      : null;

    const isSelfPurchase = order.purchaseType === 'SELF_PURCHASE';

    // Qualifying Member
    const qualifyingMember = isSelfPurchase ? orderer : customerMember;

    // Order total commission points
    const orderTotalCP = order.items.reduce((s, i) => s + (i.lineCommissionPts || 0), 0);
    const policyVersion = '1.0.0';

    // 3. CREATE MARKER (before commission creation)
    await tx.commissionProcessing.create({
      data: { orderId: order.id, status: 'COMPLETED', policyVersion }
    });

    const commissions = [];

    if (orderTotalCP > 0) {
      // Load policy rates from DB
      const getPolicyRate = async (key) => {
        const cfg = await tx.systemPolicyConfig.findUnique({ where: { key } });
        return cfg ? parseFloat(cfg.value) : null;
      };

      // ─── NHÁNH A: SELF TRANSACTION ───────────────────────────
      if (isSelfPurchase && orderer?.businessId) {
        const ruleKey = `${orderer.rank}_SELF_BUY`;
        const rate = await getPolicyRate(ruleKey);
        if (rate !== null) {
          commissions.push({
            orderId: order.id, receiverId: orderer.userId,
            amount: 0, type: 'POINT_COMMISSION', status: 'PENDING',
            role: 'SELF', ruleKey, policyVersion, rateSnapshot: rate,
            basePoints: orderTotalCP,
            earnedPoints: orderTotalCP * rate,
            earnedMoney: orderTotalCP * rate * 1000
          });
        }
      }

      // ─── NHÁNH B: DIRECT CUSTOMER / SPLIT ─────────────────────
      if (!isSelfPurchase && order.customer.sponsorUserId) {
        const directSponsor = await tx.user.findUnique({
          where: { id: order.customer.sponsorUserId },
          select: { id: true, userId: true, businessId: true, rank: true, status: true }
        });

        if (directSponsor?.businessId && directSponsor.status === 'ACTIVE') {
          const threshold = await getPolicyRate('AMBASSADOR_THRESHOLD') || 5000;
          const currentQP = qualifyingMember ? qualifyingMember.qualifyingPoints : 0;
          const customerHasId = customerMember?.businessId != null;

          // SPLIT ELIGIBLE: all 6 conditions
          const splitEligible = (
            qualifyingMember !== null &&
            qualifyingMember.isSystemParticipant === true &&
            qualifyingMember.businessId === null &&
            orderTotalCP > 0 &&
            (currentQP + orderTotalCP) >= threshold
          );

          if (splitEligible) {
            // SPLIT thay thế DIRECT_NO_ID
            const remaining = threshold - currentQP;
            let qualifyingPart, excessPart;
            if (remaining <= 0) {
              qualifyingPart = 0; excessPart = orderTotalCP;
            } else if (orderTotalCP <= remaining) {
              qualifyingPart = orderTotalCP; excessPart = 0;
            } else {
              qualifyingPart = remaining; excessPart = orderTotalCP - remaining;
            }
            const qRate = await getPolicyRate('AMBASSADOR_QUALIFYING_PORTION') || 0.20;
            const eRate = await getPolicyRate('AMBASSADOR_EXCESS_PORTION') || 0.10;
            if (qualifyingPart > 0) {
              commissions.push({
                orderId: order.id, receiverId: directSponsor.userId,
                amount: 0, type: 'POINT_COMMISSION', status: 'PENDING',
                role: 'QUALIFYING_SPLIT', ruleKey: 'AMBASSADOR_QUALIFYING_PORTION',
                policyVersion, rateSnapshot: qRate, basePoints: qualifyingPart,
                earnedPoints: qualifyingPart * qRate,
                earnedMoney: qualifyingPart * qRate * 1000
              });
            }
            if (excessPart > 0) {
              commissions.push({
                orderId: order.id, receiverId: directSponsor.userId,
                amount: 0, type: 'POINT_COMMISSION', status: 'PENDING',
                role: 'EXCESS_SPLIT', ruleKey: 'AMBASSADOR_EXCESS_PORTION',
                policyVersion, rateSnapshot: eRate, basePoints: excessPart,
                earnedPoints: excessPart * eRate,
                earnedMoney: excessPart * eRate * 1000
              });
            }
          } else {
            // DIRECT bình thường
            const ruleKey = customerHasId
              ? `${directSponsor.rank}_DIRECT_WITH_ID`
              : `${directSponsor.rank}_DIRECT_NO_ID`;
            const rate = await getPolicyRate(ruleKey);
            if (rate !== null) {
              commissions.push({
                orderId: order.id, receiverId: directSponsor.userId,
                amount: 0, type: 'POINT_COMMISSION', status: 'PENDING',
                role: customerHasId ? 'DIRECT_WITH_ID' : 'DIRECT_NO_ID',
                ruleKey, policyVersion, rateSnapshot: rate,
                basePoints: orderTotalCP,
                earnedPoints: orderTotalCP * rate,
                earnedMoney: orderTotalCP * rate * 1000
              });
            }
          }
        }
      }

      // ─── NHÁNH C: UPSTREAM PURCHASE ───────────────────────────
      // Chỉ khi customerMember có businessId
      const upstreamBase = isSelfPurchase ? orderer : customerMember;
      if (upstreamBase?.businessId) {
        // Depth-1
        const upD1 = upstreamBase.sponsorUserId
          ? await tx.user.findUnique({
              where: { id: upstreamBase.sponsorUserId },
              select: { id: true, userId: true, businessId: true, rank: true, status: true, sponsorUserId: true }
            })
          : null;
        if (upD1?.businessId && upD1.status === 'ACTIVE') {
          const rk1 = `${upD1.rank}_F1_PURCHASE`;
          const r1 = await getPolicyRate(rk1);
          if (r1 !== null) {
            commissions.push({
              orderId: order.id, receiverId: upD1.userId,
              amount: 0, type: 'POINT_COMMISSION', status: 'PENDING',
              role: 'UPSTREAM_D1', ruleKey: rk1, policyVersion, rateSnapshot: r1,
              basePoints: orderTotalCP,
              earnedPoints: orderTotalCP * r1,
              earnedMoney: orderTotalCP * r1 * 1000
            });
          }
          // Depth-2
          const upD2 = upD1.sponsorUserId
            ? await tx.user.findUnique({
                where: { id: upD1.sponsorUserId },
                select: { id: true, userId: true, businessId: true, rank: true, status: true }
              })
            : null;
          if (upD2?.businessId && upD2.status === 'ACTIVE') {
            const rk2 = `${upD2.rank}_F2_PURCHASE`;
            const r2 = await getPolicyRate(rk2);
            if (r2 !== null) {
              commissions.push({
                orderId: order.id, receiverId: upD2.userId,
                amount: 0, type: 'POINT_COMMISSION', status: 'PENDING',
                role: 'UPSTREAM_D2', ruleKey: rk2, policyVersion, rateSnapshot: r2,
                basePoints: orderTotalCP,
                earnedPoints: orderTotalCP * r2,
                earnedMoney: orderTotalCP * r2 * 1000
              });
            }
          }
        }
      }
    } // end if orderTotalCP > 0

    // 4. CREATE COMMISSIONS
    if (commissions.length > 0) {
      await tx.commission.createMany({ data: commissions });
    }

    // 5. QUALIFYING POINTS (customerMember, không phải orderer)
    if (
      qualifyingMember !== null &&
      qualifyingMember.isSystemParticipant === true &&
      qualifyingMember.businessId === null
    ) {
      await tx.user.update({
        where: { id: qualifyingMember.id },
        data: { qualifyingPoints: { increment: orderTotalCP } }
      });

      const freshQM = await tx.user.findUnique({
        where: { id: qualifyingMember.id },
        select: { qualifyingPoints: true, businessId: true, userId: true }
      });

      // 6. AMBASSADOR ACTIVATION
      const thresholdObj = await tx.systemPolicyConfig.findUnique({ where: { key: 'AMBASSADOR_THRESHOLD' } });
      const thresh = thresholdObj ? parseFloat(thresholdObj.value) : 5000;

      if (freshQM.businessId === null && freshQM.qualifyingPoints >= thresh) {
        // Generate Business ID
        const seq = await tx.businessIdSequence.update({
          where: { id: 1 },
          data: { nextVal: { increment: 1 } },
          select: { nextVal: true }
        });
        const newBusinessId = `WK-${seq.nextVal}`;

        await tx.user.update({
          where: { id: qualifyingMember.id },
          data: {
            businessId: newBusinessId,
            rank: 'AMBASSADOR',
            rankAchievedAt: new Date(),
            rankStatus: 'ACTIVE_RANK'
          }
        });
        await tx.rankHistory.create({
          data: {
            userId: freshQM.userId,
            fromRank: 'CUSTOMER',
            toRank: 'AMBASSADOR',
            toStatus: 'ACTIVE_RANK',
            reason: 'AUTO_QUALIFYING_POINTS',
            triggeredBy: 'SYSTEM'
          }
        });
      }
    }

  }, {
    isolationLevel: 'Serializable',
    maxWait: 5000,
    timeout: 10000
  });
}
