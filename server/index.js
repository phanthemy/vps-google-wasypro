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

    let sponsorUser = null;
    if (req.user.role === 'admin' || req.user.role === 'accountant') {
      if (sourceCtvId && sourceCtvId.trim()) {
        sponsorUser = await prisma.user.findFirst({
          where: { OR: [{ userId: sourceCtvId.trim() }, { id: sourceCtvId.trim() }] }
        });
      }
    }
    if (!sponsorUser) {
      sponsorUser = await prisma.user.findFirst({
        where: { OR: [{ id: req.user.id }, { userId: req.user.id }] }
      });
    }

    const validCtvId = sponsorUser ? sponsorUser.userId : req.user.id;
    const sponsorUserId = sponsorUser ? sponsorUser.id : null;

    const existing = await prisma.customer.findFirst({
      where: { phone, sourceCtvId: validCtvId }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Khách hàng này đã được đăng ký trong danh sách của bạn.' });
    }

    // Check if customer already has a User account
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    const linkedUserId = existingUser ? existingUser.id : null;

    const customer = await prisma.customer.create({
      data: {
        fullName,
        phone,
        sourceCtvId: validCtvId,
        sponsorUserId,
        linkedUserId,
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

    // Auto-create customer account with secure password if not existing
    if (!existingUser) {
      let isUnique = false;
      let genId = '';
      while (!isUnique) {
        genId = 'C' + Math.floor(100 + Math.random() * 900);
        const check = await prisma.user.findUnique({ where: { userId: genId } });
        if (!check) isUnique = true;
      }

      const defaultHashed = await bcrypt.hash('123456', 10);
      const newUser = await prisma.user.create({
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
      await prisma.customer.update({
        where: { id: customer.id },
        data: { linkedUserId: newUser.id }
      }).catch(() => {});
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

    // Phase 2C-4: Orderer is strictly from JWT authentication session
    const ordererUserId = req.user.dbId || req.user.id;

    for (const item of items) {
      const hasService = !!item.serviceId;
      const hasProduct = !!item.productId;

      // Invariant 1: Exactly 1 source (serviceId XOR productId)
      if ((hasService && hasProduct) || (!hasService && !hasProduct)) {
        return res.status(400).json({
          success: false,
          message: 'Mỗi mục đơn hàng phải có chính xác một nguồn (serviceId HOẶC productId, không được có cả hai hoặc không có nguồn nào).'
        });
      }

      const qty = item.qty ? Math.max(1, parseInt(item.qty, 10)) : 1;
      let itemAmount = 0;
      let unitCommissionPts = 0;
      let serviceId = null;
      let productId = null;

      if (hasService) {
        const svc = await prisma.service.findUnique({ where: { id: item.serviceId }, include: { category: true } });
        if (!svc) return res.status(400).json({ success: false, message: `Dịch vụ/Sản phẩm ${item.serviceId} không tồn tại` });
        serviceId = svc.id;
        itemAmount = Number(item.amount) || (svc.price * qty);
        unitCommissionPts = Math.round(Number(svc.commissionPoints || 0));
      } else {
        const prod = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!prod) return res.status(400).json({ success: false, message: `Sản phẩm ${item.productId} không tồn tại` });
        productId = prod.id;
        itemAmount = Number(item.amount) || (prod.price * qty);
        unitCommissionPts = Math.round(Number(prod.commissionPoints || 0));
      }

      totalAmount += itemAmount;
      const lineCommissionPts = unitCommissionPts * qty;

      itemsData.push({
        serviceId,
        productId,
        amount: itemAmount,
        qty,
        unitCommissionPts,
        lineCommissionPts
      });
    }

    // Phase 2C-4: SELF purchase is strictly determined by Customer.linkedUserId === ordererUserId (NOT phone!)
    const isSelf = !!(customer.linkedUserId && customer.linkedUserId === ordererUserId);
    const purchaseType = isSelf ? 'SELF_PURCHASE' : 'CUSTOMER_PURCHASE';

    const order = await prisma.order.create({
      data: {
        customerId,
        totalAmount,
        status: 'COMPLETED',
        orderType: 'RETAIL',
        isSelfBuy: isSelf,
        purchaseType,
        ordererUserId,
        items: {
          create: itemsData.map(i => ({
            serviceId: i.serviceId,
            productId: i.productId,
            amount: i.amount,
            qty: i.qty,
            unitCommissionPts: i.unitCommissionPts,
            lineCommissionPts: i.lineCommissionPts
          }))
        }
      }
    });

    // Phase 2C Unified Order Settlement (idempotent, atomic transaction)
    let settlementResult = null;
    try {
      settlementResult = await executeOrderSettlement(order.id);
    } catch (settleErr) {
      console.error('[SETTLEMENT ERROR] order', order.id, settleErr.message);
    }

    res.json({
      success: true,
      data: order,
      settlement: settlementResult,
      commissions: settlementResult?.createdCommissions || []
    });
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
    const { name, group, price, commissionPoints, categoryName, description, imageUrl, reason } = req.body;
    const cp = commissionPoints !== undefined ? Math.max(0, Math.round(Number(commissionPoints))) : 0;
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
    const s = await prisma.service.create({
      data: { name, group, price: Number(price), commissionPoints: cp, categoryId: cat.id, description, imageUrl }
    });
    if (cp > 0) {
      await prisma.commissionPointAuditLog.create({
        data: {
          itemType: 'SERVICE',
          itemId: s.id,
          itemName: s.name,
          oldValue: null,
          newValue: cp,
          actor: req.user?.userId || req.user?.email || 'ADMIN',
          reason: reason || 'INITIAL_SERVICE_CREATION'
        }
      }).catch(e => console.error('[AUDIT ERROR]', e.message));
    }
    res.json({ success: true, data: s });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/services/:id', authenticateToken, requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    let { price, commissionPoints, description, imageUrl, reason } = req.body;
    const updateData = {};
    if (price !== undefined) updateData.price = Number(price);
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    let oldService = null;
    if (commissionPoints !== undefined) {
      const newCP = Math.max(0, Math.round(Number(commissionPoints)));
      oldService = await prisma.service.findUnique({ where: { id: req.params.id } });
      if (oldService && oldService.commissionPoints !== newCP) {
        updateData.commissionPoints = newCP;
      }
    }

    const s = await prisma.service.update({
      where: { id: req.params.id },
      data: updateData
    });

    if (updateData.commissionPoints !== undefined && oldService) {
      await prisma.commissionPointAuditLog.create({
        data: {
          itemType: 'SERVICE',
          itemId: s.id,
          itemName: s.name,
          oldValue: oldService.commissionPoints,
          newValue: updateData.commissionPoints,
          actor: req.user?.userId || req.user?.email || 'ADMIN',
          reason: reason || 'ADMIN_UPDATE_COMMISSION_POINTS'
        }
      }).catch(e => console.error('[AUDIT ERROR]', e.message));
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
    const { title, slug, categoryId, price, originalPrice, image, gallery, description, specs, isHot, isNew, stock, commissionPoints, reason } = req.body;
    const cp = commissionPoints !== undefined ? Math.max(0, Math.round(Number(commissionPoints))) : 0;
    const product = await prisma.product.create({
      data: {
        title,
        slug,
        categoryId,
        price: Number(price || 0),
        commissionPoints: cp,
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

    if (cp > 0) {
      await prisma.commissionPointAuditLog.create({
        data: {
          itemType: 'PRODUCT',
          itemId: product.id,
          itemName: product.title,
          oldValue: null,
          newValue: cp,
          actor: req.user?.userId || req.user?.email || 'ADMIN',
          reason: reason || 'INITIAL_PRODUCT_CREATION'
        }
      }).catch(e => console.error('[AUDIT ERROR]', e.message));
    }
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

    let oldProduct = null;
    if (req.body.commissionPoints !== undefined) {
      const newCP = Math.max(0, Math.round(Number(req.body.commissionPoints)));
      oldProduct = await prisma.product.findUnique({ where: { id: req.params.id } });
      if (oldProduct && oldProduct.commissionPoints !== newCP) {
        data.commissionPoints = newCP;
      }
    }

    const updated = await prisma.product.update({ where: { id: req.params.id }, data });

    if (data.commissionPoints !== undefined && oldProduct) {
      await prisma.commissionPointAuditLog.create({
        data: {
          itemType: 'PRODUCT',
          itemId: updated.id,
          itemName: updated.title,
          oldValue: oldProduct.commissionPoints,
          newValue: data.commissionPoints,
          actor: req.user?.userId || req.user?.email || 'ADMIN',
          reason: req.body.reason || 'ADMIN_UPDATE_COMMISSION_POINTS'
        }
      }).catch(e => console.error('[AUDIT ERROR]', e.message));
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


// ================= PHASE 2A: S-POINTS & RANK FOUNDATION API =================

// HELPER: Award S-Points passively after order completion
// Only awards if service.productType = 'MACHINE' (per spec)
// If productType is null, no points are awarded (safe default ? pending MAU_THUAN_04 decision)
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


/**
 * Phase 2C Unified Order Settlement Orchestrator (FINAL SPEC v3.6)
 *
 * UNIFIED TRANSACTION BOUNDARY:
 * All operations run inside ONE atomic prisma.$transaction:
 * 1. Idempotency Marker (CommissionProcessing table)
 * 2. Resolve Parties (Orderer, Customer, Qualifying Member, Direct Sponsor, Upstream)
 * 3. Calculate & persist Commission records (SELF, DIRECT/SPLIT, UPSTREAM) with all 6 snapshot fields
 * 4. Award S-Points & Qualifying Points (SPointTransaction)
 * 5. Ambassador Activation (BusinessIdSequence WK-NNNNN, rank -> AMBASSADOR, RankHistory)
 *
 * ATOMIC GUARANTEE:
 * - If Commission calculation/write fails -> points, Business ID, rank, and RankHistory ROLL BACK.
 * - If Activation/sequence fails -> Commission records ROLL BACK.
 * - Retry same order -> CommissionProcessing prevents double execution.
 */
/**
 * Normalize rank to policy prefix:
 * AMBASSADOR -> 'AMBASSADOR'
 * SALES_MANAGER / MANAGER -> 'MANAGER'
 * SALES_DIRECTOR / DIRECTOR -> 'DIRECTOR'
 */
function normalizeRankPrefix(rank) {
  if (!rank) return null;
  const upper = String(rank).toUpperCase().trim();
  if (upper === 'AMBASSADOR') return 'AMBASSADOR';
  if (upper === 'SALES_MANAGER' || upper === 'MANAGER') return 'MANAGER';
  if (upper === 'SALES_DIRECTOR' || upper === 'DIRECTOR') return 'DIRECTOR';
  return null;
}

/**
 * Phase 2C-6: Core Commission Calculation Engine (FINAL SPEC v3.6)
 * Strictly calculates & inserts Commission records inside the active prisma transaction:
 * - SELF: for qualifyingMember when isSelf (Ambassador: 20%, Manager: 25%, Director: 30%)
 * - DIRECT / SPLIT: for customer.sponsorUserId
 *   * If Customer not in system -> DIRECT_NO_ID
 *   * If Customer in system, no ID:
 *     - If orderTotalCP + currentQP < 5000 -> DIRECT_NO_ID
 *     - If orderTotalCP + currentQP >= 5000 -> SPLIT (qualifyingPart: 20%, excessPart: 10%)
 *   * If Customer already has ID -> DIRECT_WITH_ID (10%)
 * - UPSTREAM (D1 & D2):
 *   * For qualifyingMember's sponsor chain (D1 = parent, D2 = parent of parent)
 *   * Does NOT skip unranked sponsors
 *   * D1: Manager F1 purchase = 10%
 *   * D2: Manager F2 purchase = 5%
 *   * NOT_CONFIGURED rates -> 0 commissions created
 *   * Depth >= 3 -> NO commission
 * - Integer points & VND arithmetic:
 *   * earnedPoints = Math.round(basePoints * rateSnapshot)
 *   * earnedMoney = earnedPoints * 1000
 * - Mandatory 6 snapshot fields recorded on every Commission
 */
async function calculateAndCreateCommissions(tx, context) {
  const {
    order,
    orderTotalCP,
    orderer,
    customer,
    qualifyingMember,
    directSponsor,
    isSelf,
    priorQP,
    priorBusinessId,
    isParticipant,
    threshold,
    policyMap,
    policyVersion,
    activated,
  } = context;

  if (orderTotalCP <= 0) {
    return [];
  }

  const createdCommissions = [];

  function getPolicyRate(key) {
    const val = policyMap[key];
    if (!val || val === 'NOT_CONFIGURED') return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  }

  async function createCommissionRecord({ receiver, role, ruleKey, rateSnapshot, basePoints, type, metadata }) {
    if (!receiver || !ruleKey || !rateSnapshot || rateSnapshot <= 0 || basePoints <= 0) {
      return null;
    }
    const earnedPoints = Math.round(basePoints * rateSnapshot);
    const earnedMoney = Math.round(earnedPoints * 1000);
    if (earnedPoints <= 0 && earnedMoney <= 0) {
      return null;
    }

    const comm = await tx.commission.create({
      data: {
        orderId: order.id,
        receiverId: receiver.userId,
        amount: earnedMoney,
        type: type || 'DIRECT',
        status: 'PENDING',
        rateSnapshot,
        rankSnapshot: receiver.rank || null,
        baseAmount: Math.round(basePoints * 1000),
        policyRef: ruleKey,
        ruleKey,
        policyVersion,
        role,
        basePoints: Math.round(basePoints),
        earnedPoints,
        earnedMoney,
        metadata: metadata ? JSON.stringify(metadata) : null,
      }
    });
    createdCommissions.push(comm);
    return comm;
  }

  // -------------------------------------------------------------
  // 1. SELF COMMISSION
  // -------------------------------------------------------------
  // SELF only when Customer.linkedUserId == Orderer.id
  // Receiver = Orderer (Customer Member)
  // Ambassador SELF = 20%, Manager SELF = 25%, Director SELF = 30%
  if (isSelf && orderer) {
    const effectiveRank = (activated && isSelf) ? 'AMBASSADOR' : orderer.rank;
    const rankPrefix = normalizeRankPrefix(effectiveRank);

    if (rankPrefix) {
      const selfRuleKey = rankPrefix + '_SELF_BUY';
      const selfRate = getPolicyRate(selfRuleKey);
      if (selfRate) {
        await createCommissionRecord({
          receiver: orderer,
          role: 'SELF',
          ruleKey: selfRuleKey,
          rateSnapshot: selfRate,
          basePoints: orderTotalCP,
          type: 'SELF',
          metadata: { isSelf: true, rank: effectiveRank },
        });
      }
    }
  }

  // -------------------------------------------------------------
  // 2. DIRECT / SPLIT COMMISSION
  // -------------------------------------------------------------
  // DIRECT receiver = Customer.sponsorUserId (NEVER Orderer.sponsorUserId)
  // Only applies if directSponsor exists
  if (!isSelf && directSponsor) {
    const sponsorRank = directSponsor.rank || (directSponsor.role === 'ctv' ? 'AMBASSADOR' : null);
    const sponsorPrefix = normalizeRankPrefix(sponsorRank);
    if (sponsorPrefix) {
      // Check SPLIT conditions:
      // - CUSTOMER_PURCHASE (!isSelf)
      // - qualifyingMember != null
      // - isSystemParticipant = true
      // - businessId = null (prior to this order)
      // - orderTotalCP > 0
      // - priorQP + orderTotalCP >= threshold
      const isSplitEligible = !isSelf &&
        qualifyingMember &&
        isParticipant &&
        !priorBusinessId &&
        orderTotalCP > 0 &&
        (priorQP + orderTotalCP >= threshold);

      if (isSplitEligible) {
        // SPLIT replaces DIRECT_NO_ID completely (NO DIRECT_NO_ID created!)
        const qualifyingPart = Math.max(0, threshold - priorQP);
        const excessPart = Math.max(0, orderTotalCP - qualifyingPart);

        // Rates:
        // qualifying rate: 20% (Ambassador), or sponsor's DIRECT_NO_ID
        // excess rate: 10% (Ambassador/Manager/Director), or sponsor's DIRECT_WITH_ID
        const qualifyingRate = getPolicyRate(sponsorPrefix + '_QUALIFYING_SPLIT') || getPolicyRate(sponsorPrefix + '_DIRECT_NO_ID') || 0.20;
        const excessRate = getPolicyRate(sponsorPrefix + '_EXCESS_SPLIT') || getPolicyRate(sponsorPrefix + '_DIRECT_WITH_ID') || 0.10;

        if (qualifyingPart > 0) {
          await createCommissionRecord({
            receiver: directSponsor,
            role: 'DIRECT_SPONSOR',
            ruleKey: sponsorPrefix + '_QUALIFYING_SPLIT',
            rateSnapshot: qualifyingRate,
            basePoints: qualifyingPart,
            type: 'SPLIT',
            metadata: {
              splitType: 'QUALIFYING',
              threshold,
              priorQP,
              qualifyingPart,
            }
          });
        }

        if (excessPart > 0) {
          await createCommissionRecord({
            receiver: directSponsor,
            role: 'DIRECT_SPONSOR',
            ruleKey: sponsorPrefix + '_EXCESS_SPLIT',
            rateSnapshot: excessRate,
            basePoints: excessPart,
            type: 'SPLIT',
            metadata: {
              splitType: 'EXCESS',
              threshold,
              priorQP,
              excessPart,
            }
          });
        }
      } else {
        // NON-SPLIT: Either DIRECT_WITH_ID or DIRECT_NO_ID
        const hasId = qualifyingMember && (priorBusinessId || qualifyingMember.businessId);

        if (hasId) {
          // Customer has ID -> DIRECT_WITH_ID
          const directRuleKey = sponsorPrefix + '_DIRECT_WITH_ID';
          const directRate = getPolicyRate(directRuleKey);
          if (directRate) {
            await createCommissionRecord({
              receiver: directSponsor,
              role: 'DIRECT_SPONSOR',
              ruleKey: directRuleKey,
              rateSnapshot: directRate,
              basePoints: orderTotalCP,
              type: 'DIRECT',
              metadata: { hasId: true },
            });
          }
        } else {
          // Customer has NO ID:
          // - either retail customer (qualifyingMember == null)
          // - or not system participant
          // - or system participant who did not cross threshold (priorQP + orderTotalCP < threshold)
          const directRuleKey = sponsorPrefix + '_DIRECT_NO_ID';
          const directRate = getPolicyRate(directRuleKey);
          if (directRate) {
            await createCommissionRecord({
              receiver: directSponsor,
              role: 'DIRECT_SPONSOR',
              ruleKey: directRuleKey,
              rateSnapshot: directRate,
              basePoints: orderTotalCP,
              type: 'DIRECT',
              metadata: { hasId: false },
            });
          }
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 3. UPSTREAM COMMISSION (Depth-1 & Depth-2)
  // -------------------------------------------------------------
  // Chỉ xét sponsor chain của Customer Member / Qualifying Member.
  // Depth-1 và Depth-2 ONLY. Không skip sponsor chưa có businessId.
  // Rate NOT_CONFIGURED -> không tạo Commission record.
  const memberForUpstream = isSelf ? orderer : qualifyingMember;

  if (memberForUpstream) {
    // Traverse Upstream:
    // Depth-1
    let d1User = null;
    if (memberForUpstream.parentId) {
      d1User = await tx.user.findUnique({ where: { userId: memberForUpstream.parentId } });
    } else if (customer && customer.sponsorUserId) {
      d1User = directSponsor || (await tx.user.findUnique({ where: { id: customer.sponsorUserId } }));
    }

    if (d1User) {
      const d1Rank = d1User.rank || (d1User.role === 'ctv' ? 'AMBASSADOR' : null);
      const d1Prefix = normalizeRankPrefix(d1Rank);
      if (d1Prefix) {
        const d1RuleKey = d1Prefix === 'DIRECTOR' ? 'DIRECTOR_F1' : (isSelf ? (d1Prefix + '_F1_PURCHASE') : (d1Prefix + '_F1_SELL_TO_CUSTOMER_NO_ID'));
        const d1Rate = getPolicyRate(d1RuleKey);
        if (d1Rate) {
          await createCommissionRecord({
            receiver: d1User,
            role: 'UPSTREAM_D1',
            ruleKey: d1RuleKey,
            rateSnapshot: d1Rate,
            basePoints: orderTotalCP,
            type: 'OVERRIDE_F1',
            metadata: { depth: 1, buyerUserId: memberForUpstream.userId },
          });
        }
      }

      // Depth-2: parent of Depth-1. Do NOT skip even if d1User has no businessId!
      let d2User = null;
      if (d1User.parentId) {
        d2User = await tx.user.findUnique({ where: { userId: d1User.parentId } });
      }

      if (d2User) {
        const d2Rank = d2User.rank || (d2User.role === 'ctv' ? 'AMBASSADOR' : null);
        const d2Prefix = normalizeRankPrefix(d2Rank);
        if (d2Prefix) {
          const d2RuleKey = d2Prefix === 'DIRECTOR' ? 'DIRECTOR_F2' : (isSelf ? (d2Prefix + '_F2_PURCHASE') : (d2Prefix + '_F2'));
          const d2Rate = getPolicyRate(d2RuleKey);
          if (d2Rate) {
            await createCommissionRecord({
              receiver: d2User,
              role: 'UPSTREAM_D2',
              ruleKey: d2RuleKey,
              rateSnapshot: d2Rate,
              basePoints: orderTotalCP,
              type: 'OVERRIDE_F2',
              metadata: { depth: 2, buyerUserId: memberForUpstream.userId },
            });
          }
        }
      }

      // Depth-3+ is NEVER processed: "Depth-1 và Depth-2 בלבד. F3 không commission."
    }
  }

  return createdCommissions;
}

/**
 * Phase 2C Unified Order Settlement Orchestrator (FINAL SPEC v3.6)
 *
 * UNIFIED TRANSACTION BOUNDARY:
 * All operations run inside ONE atomic prisma.$transaction:
 * 1. Idempotency Marker (CommissionProcessing table)
 * 2. Resolve Parties (Orderer, Customer, Qualifying Member, Direct Sponsor, Upstream)
 * 3. Calculate & persist Commission records (SELF, DIRECT/SPLIT, UPSTREAM) with all 6 snapshot fields
 * 4. Award S-Points & Qualifying Points (SPointTransaction)
 * 5. Ambassador Activation (BusinessIdSequence WK-NNNNN, rank -> AMBASSADOR, RankHistory)
 *
 * ATOMIC GUARANTEE:
 * - If Commission calculation/write fails -> points, Business ID, rank, and RankHistory ROLL BACK.
 * - If Activation/sequence fails -> Commission records ROLL BACK.
 * - Retry same order -> CommissionProcessing prevents double execution.
 */
async function executeOrderSettlement(orderId, options = {}) {
  // Idempotency check 1: Outside transaction
  const existingProcessing = await prisma.commissionProcessing.findUnique({
    where: { orderId }
  });
  if (existingProcessing) {
    return {
      success: true,
      alreadyProcessed: true,
      message: 'Order settlement already completed (idempotent guard)',
      processing: existingProcessing,
    };
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Idempotency marker inside transaction
    const processing = await tx.commissionProcessing.create({
      data: {
        orderId,
        status: 'COMPLETED',
        policyVersion: '1.0.0',
      }
    });

    // 2. Load Order & Attributions
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        customer: {
          include: {
            sponsorUser: true,
            linkedUser: true,
          }
        },
        orderer: true,
      }
    });

    if (!order) throw new Error('Order ' + orderId + ' not found');

    const orderer = order.orderer || (order.ordererUserId ? await tx.user.findUnique({ where: { id: order.ordererUserId } }) : null);
    const customer = order.customer;
    const qualifyingMember = customer.linkedUser || null;
    const isSelf = !!(qualifyingMember && orderer && qualifyingMember.id === orderer.id);

    let directSponsor = customer.sponsorUser || null;
    if (!directSponsor && customer.sponsorUserId) {
      directSponsor = await tx.user.findUnique({ where: { id: customer.sponsorUserId } });
    }

    // 3. S-Points & Qualifying Points
    const orderTotalCP = order.items.reduce((sum, item) => sum + Math.round(item.lineCommissionPts || 0), 0);
    let pointsAwarded = 0;
    let activated = false;
    let allocatedBusinessId = null;

    // Load Policy Configs
    const configs = await tx.systemPolicyConfig.findMany();
    const policyMap = Object.fromEntries(configs.map(c => [c.key, c.value]));
    const policyVersion = policyMap['POLICY_VERSION'] || '1.0.0';
    const threshold = parseInt(policyMap['AMBASSADOR_THRESHOLD'] || '5000', 10);

    // Track qualifyingMember state BEFORE points awarded (for SPLIT eligibility)
    let priorQP = 0;
    let priorBusinessId = null;
    let isParticipant = false;

    if (qualifyingMember) {
      const freshQM = await tx.user.findUnique({ where: { id: qualifyingMember.id } });
      if (freshQM) {
        priorQP = freshQM.qualifyingPoints || 0;
        priorBusinessId = freshQM.businessId || null;
        isParticipant = !!freshQM.isSystemParticipant;
      }
    }

    if (orderTotalCP > 0 && qualifyingMember) {
      const currentUser = await tx.user.findUnique({ where: { id: qualifyingMember.id } });
      const isQualifying = !!currentUser.isSystemParticipant;
      const newQualifyingPoints = isQualifying
        ? Math.round((currentUser.qualifyingPoints || 0) + orderTotalCP)
        : Math.round(currentUser.qualifyingPoints || 0);
      const newSPoints = Math.round((currentUser.sPoints || 0) + orderTotalCP);

      await tx.sPointTransaction.create({
        data: {
          userId: currentUser.userId,
          orderId: order.id,
          points: orderTotalCP,
          type: 'EARN',
          isQualifying,
          snapshotBalance: newSPoints,
          policyVersion,
          description: 'Tích lũy điểm xét Ambassador từ đơn hàng #' + order.id,
        }
      });
      pointsAwarded = orderTotalCP;

      // 4. Ambassador Activation
      const userUpdateData = {
        sPoints: newSPoints,
        qualifyingPoints: newQualifyingPoints,
      };

      if (currentUser.isSystemParticipant && !currentUser.businessId && newQualifyingPoints >= threshold) {
        const seq = await tx.businessIdSequence.findUnique({ where: { id: 1 } });
        const currentSeqVal = seq ? seq.nextVal : 10001;
        allocatedBusinessId = 'WK-' + currentSeqVal;

        await tx.businessIdSequence.update({
          where: { id: 1 },
          data: { nextVal: currentSeqVal + 1 },
        });

        userUpdateData.businessId = allocatedBusinessId;
        userUpdateData.rank = 'AMBASSADOR';
        userUpdateData.rankStatus = 'ACTIVE_RANK';
        userUpdateData.rankAchievedAt = new Date();
        userUpdateData.rankActivationMethod = 'AUTO_SPOINT_THRESHOLD';
        userUpdateData.rankActivatedBy = 'SYSTEM';

        await tx.rankHistory.create({
          data: {
            userId: currentUser.userId,
            fromRank: currentUser.rank || 'CUSTOMER',
            toRank: 'AMBASSADOR',
            fromStatus: currentUser.rankStatus || 'NOT_QUALIFIED',
            toStatus: 'ACTIVE_RANK',
            reason: 'AUTO_SPOINT_THRESHOLD',
            triggeredBy: 'SYSTEM',
            metadata: JSON.stringify({
              orderId: order.id,
              qualifyingPoints: newQualifyingPoints,
              threshold,
              allocatedBusinessId,
              activatedAt: new Date().toISOString(),
            }),
          }
        });
        activated = true;
      }

      await tx.user.update({
        where: { id: currentUser.id },
        data: userUpdateData,
      });
    }

    // 5. Commission Calculation & Creation inside the SAME transaction boundary
    let createdCommissions = [];
    const commContext = {
      order,
      orderTotalCP,
      orderer,
      customer,
      qualifyingMember,
      directSponsor,
      isSelf,
      priorQP,
      priorBusinessId,
      isParticipant,
      threshold,
      policyMap,
      policyVersion,
      activated,
      allocatedBusinessId,
    };

    if (typeof options.commissionHandler === 'function') {
      createdCommissions = await options.commissionHandler(tx, commContext);
    } else {
      createdCommissions = await calculateAndCreateCommissions(tx, commContext);
    }

    return {
      success: true,
      orderId: order.id,
      pointsAwarded,
      activated,
      allocatedBusinessId,
      createdCommissions,
      processingId: processing.id,
    };
  });
}
// Keep backwards-compatible helper alias
async function processOrderPointsAndActivation(orderId) {
  return await executeOrderSettlement(orderId);
}

// Endpoint to trigger/inspect order settlement
app.post('/api/orders/:id/process-activation', authenticateToken, async (req, res) => {
  try {
    const result = await executeOrderSettlement(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


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


// Export app with attached helper functions for testing and backwards compatibility
app.executeOrderSettlement = executeOrderSettlement;
app.calculateAndCreateCommissions = calculateAndCreateCommissions;
app.processOrderPointsAndActivation = processOrderPointsAndActivation;
app.normalizeRankPrefix = normalizeRankPrefix;

module.exports = app;
module.exports.app = app;
module.exports.executeOrderSettlement = executeOrderSettlement;
module.exports.calculateAndCreateCommissions = calculateAndCreateCommissions;
module.exports.processOrderPointsAndActivation = processOrderPointsAndActivation;
module.exports.normalizeRankPrefix = normalizeRankPrefix;

// START SERVER
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('[SECURE BACKEND ENGINE] Running on port ' + PORT);
  });
}
