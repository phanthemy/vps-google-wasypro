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
  if (
    req.path === '/api/auth/login' ||
    req.path === '/api/auth/logout' ||
    req.path === '/api/auth/register' ||
    req.path === '/api/orders/website' ||   // Public order form
    req.path === '/api/leads' ||              // Public consultation form — accepts guest + logged-in users
    req.path === '/api/users/me/join-system' || // CTV portal — same-origin cookie POST
    req.path === '/api/users/me/avatar'       // CTV portal avatar upload
  ) {
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

// Trust proxy (behind Nginx reverse proxy)
app.set('trust proxy', 1);

// Rate limiters
const authLimiter = rateLimit({
  validate: false,
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
  max: parseInt(process.env.RATE_LIMIT_MAX || '30', 10), // 30 attempts
  message: { success: false, message: 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau 15 phút.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordLimiter = rateLimit({
  validate: false,
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
      userId: user.userId,
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
    // DISABLED: frontend has no UI for forced password change — users get stuck
    if (false && user.mustChangePassword) {
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
        // Check if user has NPP registration
        const nppReg = await prisma.nppRegistration.findFirst({ 
          where: { userId: user.id, status: { in: ['PENDING', 'APPROVED'] } } 
        });
    res.json({
      success: true,
      requirePasswordChange: user.mustChangePassword,
      data: {
        id: user.userId,
        role: user.role,
        fullName: user.fullName,
        tier: user.tier,
        phone: user.phone,
        mustChangePassword: user.mustChangePassword,
        isSystemParticipant: user.isSystemParticipant,
        participantAt: user.participantAt,
        qualifyingPoints: user.qualifyingPoints ?? 0,
        sPoints: user.sPoints ?? 0,
        businessId: user.businessId ?? null,
        rank: user.rank ?? null,
        rankStatus: user.rankStatus ?? null,
        isNpp: user.isNpp ?? false,
        hasNppRegistration: !!nppReg,
        avatarUrl: user.avatarUrl ?? null,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ trong quá trình xử lý đăng nhập.' });
  }
});

// AUTH ME (Session Status) — returns fresh data from DB
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const lookupId = req.user.userId || req.user.id;
    const user = await prisma.user.findFirst({ where: { OR: [{ userId: lookupId }, { id: lookupId }] } });
    if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
        const nppRegMe = await prisma.nppRegistration.findFirst({ where: { userId: user.id, status: { in: ['PENDING', 'APPROVED'] } } });
    res.json({
      success: true,
      data: {
        id: user.userId,
        role: user.role,
        fullName: user.fullName,
        tier: user.tier,
        phone: user.phone,
        mustChangePassword: user.mustChangePassword,
        isSystemParticipant: user.isSystemParticipant,
        participantAt: user.participantAt,
        qualifyingPoints: user.qualifyingPoints ?? 0,
        sPoints: user.sPoints ?? 0,
        businessId: user.businessId ?? null,
        rank: user.rank ?? null,
        rankStatus: user.rankStatus ?? null,
        isNpp: user.isNpp ?? false,
        hasNppRegistration: !!nppRegMe,
        avatarUrl: user.avatarUrl ?? null,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

// LOGOUT (Clear Cookies)
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('auth_token', { path: '/' });
  res.clearCookie('csrf_token', { path: '/' });
  res.json({ success: true, message: 'Đã đăng xuất thành công.' });
});


// ─── AVATAR UPLOAD ────────────────────────────────────────────────────────────
const multer = require('multer');
const sharp = require('sharp');
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Chỉ chấp nhận file ảnh.'));
    cb(null, true);
  },
});
app.use('/api/users/me/avatar', (req, res, next) => {
  // Allow multipart for avatar endpoints — skip CSRF check for file upload
  if (['POST','DELETE'].includes(req.method)) return next();
  next();
});

// POST /api/users/me/avatar — Upload ảnh đại diện (chỉ CTV isSystemParticipant)
app.post('/api/users/me/avatar', authenticateToken, avatarUpload.single('avatar'), async (req, res) => {
  try {
    const lookupId = req.user.userId || req.user.id;
    const user = await prisma.user.findFirst({ where: { OR: [{ userId: lookupId }, { id: lookupId }] } });
    if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
    if (!user.isSystemParticipant) {
      return res.status(403).json({ success: false, message: 'Chỉ CTV đã tham gia hệ thống mới có thể cài ảnh đại diện.' });
    }
    if (!req.file) return res.status(400).json({ success: false, message: 'Vui lòng chọn file ảnh.' });

    const avatarsDir = path.join(__dirname, '../public/uploads/avatars');
    if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

    const filename = `${user.userId}_${Date.now()}.webp`;
    const outputPath = path.join(avatarsDir, filename);

    await sharp(req.file.buffer)
      .resize(300, 300, { fit: 'cover', position: 'center' })
      .webp({ quality: 85 })
      .toFile(outputPath);

    const avatarUrl = `/uploads/avatars/${filename}`;

    // Xóa ảnh cũ nếu có
    if (user.avatarUrl) {
      const oldPath = path.join(__dirname, '..', 'public', user.avatarUrl);
      if (fs.existsSync(oldPath)) { try { fs.unlinkSync(oldPath); } catch (_) {} }
    }

    await prisma.user.update({ where: { userId: user.userId }, data: { avatarUrl } });
    console.log(`[AVATAR] ${user.userId} → ${filename}`);
    res.json({ success: true, avatarUrl, message: 'Cập nhật ảnh đại diện thành công.' });
  } catch (err) {
    console.error('[AVATAR]', err.message);
    res.status(500).json({ success: false, message: err.message || 'Lỗi máy chủ.' });
  }
});

// DELETE /api/users/me/avatar — Xóa ảnh đại diện
app.delete('/api/users/me/avatar', authenticateToken, async (req, res) => {
  try {
    const lookupId = req.user.userId || req.user.id;
    const user = await prisma.user.findFirst({ where: { OR: [{ userId: lookupId }, { id: lookupId }] } });
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy.' });
    if (user.avatarUrl) {
      const oldPath = path.join(__dirname, '..', 'public', user.avatarUrl);
      if (fs.existsSync(oldPath)) { try { fs.unlinkSync(oldPath); } catch (_) {} }
    }
    await prisma.user.update({ where: { userId: user.userId }, data: { avatarUrl: null } });
    res.json({ success: true, message: 'Đã xóa ảnh đại diện.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

// ─── SELF REGISTRATION (public — no auth required) ───────────────────────────
// POST /api/auth/register
// Creates a User account (role=ctv, isSystemParticipant=false by default).
// refCode → parentId (sponsor). No business rights until "THAM GIA HỆ THỐNG".
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    let { fullName, phone, password, refCode, joinSystem, nppPackageId } = req.body;
    if (!fullName || !fullName.trim()) return res.status(400).json({ success: false, message: 'Vui lòng nhập họ tên.' });
    if (!phone || !phone.trim()) return res.status(400).json({ success: false, message: 'Vui lòng nhập số điện thoại.' });

    phone = phone.trim();
    fullName = fullName.trim();
    const rawPwd = (password && password.trim()) ? password.trim() : '123456';
    const willJoinSystem = !!joinSystem; // true if user chose CTV at registration
    const wantNpp = !!req.body.registerNpp || !!nppPackageId;
    if (willJoinSystem && wantNpp) {
      return res.status(400).json({ success: false, message: "CTV và NPP không thể chọn cùng lúc. Vui lòng chọn một." });
    }

    // Check duplicate phone
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Số điện thoại này đã được đăng ký. Vui lòng đăng nhập.' });
    }

    // Resolve sponsor from refCode
    let parentId = null;
    if (refCode && refCode.trim()) {
      const sponsor = await prisma.user.findUnique({ where: { userId: refCode.trim() } });
      if (sponsor) parentId = sponsor.userId;
    }

    // Generate userId: prefix U + 3 digits
    let generatedId = '', isUnique = false;
    while (!isUnique) {
      generatedId = 'U' + Math.floor(100 + Math.random() * 900);
      const check = await prisma.user.findUnique({ where: { userId: generatedId } });
      if (!check) isUnique = true;
    }

    const hashedPassword = await bcrypt.hash(rawPwd, 10);
    const now = new Date();
    const newUser = await prisma.user.create({
      data: {
        userId: generatedId,
        fullName,
        phone,
        password: hashedPassword,
        tier: 'NONE',
        role: 'ctv',
        parentId,
        mustChangePassword: false,
        isSystemParticipant: willJoinSystem,
        participantAt: willJoinSystem ? now : null,
        qualifyingPoints: 0,
        sPoints: 0,
      }
    });

    // Auto-create linked Customer if joining system at registration
    if (willJoinSystem) {
      try {
        // sponsorUserId = parent (người giới thiệu), NOT self
        let regSponsorId = null;
        if (newUser.parentId) {
          const parentUser = await prisma.user.findFirst({ where: { userId: newUser.parentId } });
          if (parentUser) regSponsorId = parentUser.id;
        }
        await prisma.customer.create({
          data: {
            fullName,
            phone,
            sourceCtvId: generatedId,
            sponsorUserId: regSponsorId,
            linkedUserId: newUser.id,
            status: 'NEW',
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          }
        });
        console.log(`[REGISTER] Created self-linked Customer for ${generatedId} (sponsor: ${newUser.parentId || 'NONE'})`);
      } catch (e) { console.error('[REGISTER] Customer create error:', e.message); }
    }

    console.log(`[REGISTER] ${generatedId} ${fullName} (${phone}) joinSystem=${willJoinSystem}`);


    // ─── NPP Registration (if registerNpp or nppPackageId) ───
    let hasNppRegistration = false;
    if (wantNpp) {
      try {
        let validPackageId = null;
        if (nppPackageId) {
          const pkg = await prisma.nppPackage.findUnique({ where: { id: nppPackageId } });
          if (pkg && pkg.isActive) validPackageId = pkg.id;
          else console.warn(`[REGISTER] Invalid/inactive package: ${nppPackageId}`);
        }
        await prisma.nppRegistration.create({
          data: {
            userId: newUser.id,
            packageId: validPackageId,
            status: 'PENDING',
          }
        });
        hasNppRegistration = true;
        console.log(`[REGISTER] NPP registration created for ${generatedId}, package: ${validPackageId || 'NONE'}`);
      } catch (nppErr) { console.error('[REGISTER] NPP registration error:', nppErr.message); }
    }
      } catch (nppErr) { console.error('[REGISTER] NPP registration error:', nppErr.message); }
    }


    // Auto-login: set session cookie so user is logged in immediately
    const token = jwt.sign(
      { id: newUser.userId, userId: newUser.userId, dbId: newUser.id, role: newUser.role, fullName: newUser.fullName, phone: newUser.phone, tier: newUser.tier, parentId: newUser.parentId, mustChangePassword: false },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    res.cookie('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công! Vui lòng đăng nhập.',
      data: {
        id: newUser.userId,
        fullName: newUser.fullName,
        phone: newUser.phone,
        isSystemParticipant: newUser.isSystemParticipant,
        participantAt: newUser.participantAt,
        businessId: null,
        rank: null,
        hasNppRegistration: hasNppRegistration,
        isNpp: false,
      }
    });
  } catch (err) {
    console.error('[REGISTER]', err.message);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ. Vui lòng thử lại.' });
  }
});

// ─── THAM GIA HỆ THỐNG (authenticated user self-opts-in) ─────────────────────
// POST /api/users/me/join-system
// Sets isSystemParticipant=true, records participantAt.
// Idempotent: calling twice is safe — second call returns 200 with no change.
app.post('/api/users/me/join-system', authenticateToken, async (req, res) => {
  try {
    const lookupId = req.user.userId || req.user.id;
    const user = await prisma.user.findFirst({ where: { OR: [{ userId: lookupId }, { id: lookupId }] } });
    if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });

    // Idempotent guard
    if (user.isSystemParticipant) {
      return res.json({
        success: true,
        alreadyJoined: true,
        message: 'Bạn đã tham gia hệ thống từ trước.',
        data: {
          isSystemParticipant: true,
          participantAt: user.participantAt,
          qualifyingPoints: user.qualifyingPoints ?? 0,
        }
      });
    }

    const now = new Date();
    const updated = await prisma.user.update({
      where: { userId: user.userId },
      data: {
        isSystemParticipant: true,
        participantAt: now,
      }
    });

    console.log(`[JOIN-SYSTEM] ${user.userId} (${user.fullName}) joined at ${now.toISOString()}`);

    // Create linked Customer record for SELF_PURCHASE (hidden from admin customer list)
    let linkedCustomer = await prisma.customer.findFirst({ where: { linkedUserId: user.id } });
    if (!linkedCustomer) {
      linkedCustomer = await prisma.customer.findFirst({ where: { phone: user.phone, linkedUserId: null } });
      if (linkedCustomer) {
        await prisma.customer.update({
          where: { id: linkedCustomer.id },
          data: { linkedUserId: user.id, sponsorUserId: user.parentId ? (await prisma.user.findFirst({ where: { userId: user.parentId } }))?.id || null : null }
        });
        console.log(`[JOIN-SYSTEM] Linked existing Customer ${linkedCustomer.id} to ${user.userId}`);
      } else {
        const joinSponsor = user.parentId ? (await prisma.user.findFirst({ where: { userId: user.parentId } })) : null;
        linkedCustomer = await prisma.customer.create({
          data: {
            fullName: user.fullName,
            phone: user.phone,
            sourceCtvId: user.userId,
            sponsorUserId: joinSponsor?.id || null,
            linkedUserId: user.id,
            status: 'NEW',
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          }
        });
        console.log(`[JOIN-SYSTEM] Created self-linked Customer ${linkedCustomer.id} for ${user.userId}`);
      }
    }


    res.json({
      success: true,
      alreadyJoined: false,
      message: 'Đã tham gia hệ thống thành công! Các điểm tích lũy từ đơn hàng tiếp theo sẽ được tính vào mốc 5.000 CP.',
      data: {
        isSystemParticipant: true,
        participantAt: updated.participantAt,
        qualifyingPoints: updated.qualifyingPoints ?? 0,
        businessId: updated.businessId ?? null,
        rank: updated.rank ?? null,
      }
    });
  } catch (err) {
    console.error('[JOIN-SYSTEM]', err.message);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ. Vui lòng thử lại.' });
  }
});

// 2. CONFIG COMMISSION MATRIX
// @deprecated — Legacy config.json routes (CTV Portal legacy only).
// Commission Engine v3.6 does NOT read config.json — it reads SystemPolicyConfig (DB).
// Use /api/admin/policy for authoritative policy management.
app.get('/api/config', authenticateToken, (req, res) => {
  res.set('X-Deprecated', 'true; use /api/admin/policy');
  res.json({ success: true, data: getCommissionRates() });
});

// @deprecated — writes to config.json which Commission Engine v3.6 does NOT read.
app.post('/api/config', authenticateToken, requireRole(['admin']), (req, res) => {
  res.set('X-Deprecated', 'true; use PUT /api/admin/policy/:key');
  try {
    const newRates = req.body;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(newRates, null, 2));
    res.json({ success: true, data: newRates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── ADMIN POLICY CONFIGURATION (SystemPolicyConfig) ────────────────────────

// GET /api/policy/active — active policy for CTV and members
app.get('/api/policy/active', authenticateToken, async (req, res) => {
  try {
    const configs = await prisma.systemPolicyConfig.findMany({ orderBy: { key: 'asc' } });
    const policyMap = Object.fromEntries(configs.map(c => [c.key, c.value]));
    const version = policyMap['POLICY_VERSION'] || '1.0.0';
    res.json({
      success: true,
      data: configs.map(c => ({
        key: c.key,
        value: c.value,
        description: c.description,
        version: c.version,
        updatedAt: c.updatedAt
      })),
      policyMap,
      version
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Không thể tải cấu hình chính sách.' });
  }
});

// GET /api/admin/policy — list all 16 policy keys
app.get('/api/admin/policy', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const configs = await prisma.systemPolicyConfig.findMany({ orderBy: { key: 'asc' } });
    res.json({ success: true, data: configs.map(c => ({
      key: c.key,
      value: c.value,
      description: c.description,
      version: c.version,
      updatedBy: c.updatedBy,
      updatedAt: c.updatedAt,
      status: c.value === 'NOT_CONFIGURED' ? 'NOT_CONFIGURED' : 'ACTIVE'
    })) });
  } catch (err) {
    console.error('[ADMIN POLICY GET]', err.message);
    res.status(500).json({ success: false, message: 'Không thể tải cấu hình policy.' });
  }
});

// GET /api/admin/policy/:key/history — audit log for a specific key
app.get('/api/admin/policy/:key/history', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { key } = req.params;
    const policy = await prisma.systemPolicyConfig.findUnique({ where: { key } });
    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy key không tồn tại.' });
    }
    const logs = await prisma.systemPolicyAuditLog.findMany({
      where: { key },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json({ success: true, key, data: logs.map(l => ({
      oldValue: l.oldValue,
      newValue: l.newValue,
      version: l.version,
      updatedBy: l.updatedBy,
      reason: l.reason,
      createdAt: l.createdAt
    })) });
  } catch (err) {
    console.error('[ADMIN POLICY HISTORY]', err.message);
    res.status(500).json({ success: false, message: 'Không thể tải lịch sử policy.' });
  }
});

// PUT /api/admin/policy/:key — update a policy key (admin only, atomic, audited)
app.put('/api/admin/policy/:key', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { key } = req.params;
    const { value, reason } = req.body;

    // 1. POLICY_VERSION: system-managed only
    if (key === 'POLICY_VERSION') {
      return res.status(403).json({
        success: false,
        error: 'KEY_NOT_EDITABLE',
        message: 'POLICY_VERSION được quản lý tự động bởi hệ thống. Không thể sửa trực tiếp.'
      });
    }

    // 2. Reason bắt buộc
    if (!reason || String(reason).trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'REASON_REQUIRED',
        message: 'Vui lòng nhập lý do thay đổi policy.'
      });
    }

    // 3. Value bắt buộc
    if (value === undefined || value === null || String(value).trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'VALUE_REQUIRED',
        message: 'Vui lòng nhập giá trị mới.'
      });
    }

    // 4. Validate value theo loại key
    const strVal = String(value).trim();
    let validatedValue;

    if (key === 'AMBASSADOR_THRESHOLD') {
      const intVal = parseInt(strVal, 10);
      if (isNaN(intVal) || intVal <= 0 || String(intVal) !== strVal) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_POLICY_VALUE',
          message: 'AMBASSADOR_THRESHOLD phải là số nguyên dương (VD: 5000).'
        });
      }
      validatedValue = String(intVal);
    } else if (strVal === 'NOT_CONFIGURED') {
      validatedValue = 'NOT_CONFIGURED';
    } else {
      const floatVal = parseFloat(strVal);
      if (isNaN(floatVal) || floatVal < 0 || floatVal > 1) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_POLICY_VALUE',
          message: 'Tỉ lệ commission phải từ 0.00 đến 1.00 (VD: 0.20 = 20%), hoặc "NOT_CONFIGURED".'
        });
      }
      validatedValue = String(floatVal);
    }

    // 5. Kiểm tra key tồn tại
    const existing = await prisma.systemPolicyConfig.findUnique({ where: { key } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Policy key không tồn tại.' });
    }

    // 6. Load POLICY_VERSION để bump minor
    const versionRecord = await prisma.systemPolicyConfig.findUnique({ where: { key: 'POLICY_VERSION' } });
    const currentVersion = versionRecord ? versionRecord.value : '1.0.0';
    const parts = currentVersion.split('.').map(Number);
    parts[1] = (parts[1] || 0) + 1;
    const newVersion = parts.join('.');
    const updatedBy = req.user.id;

    // 7. Atomic transaction: update policy + audit + version bump
    const updated = await prisma.$transaction(async (tx) => {
      const updatedPolicy = await tx.systemPolicyConfig.update({
        where: { key },
        data: { value: validatedValue, updatedBy, version: newVersion }
      });
      await tx.systemPolicyAuditLog.create({
        data: {
          policyId: existing.id,
          key,
          oldValue: existing.value,
          newValue: validatedValue,
          version: newVersion,
          updatedBy,
          reason: String(reason).trim()
        }
      });
      if (versionRecord) {
        await tx.systemPolicyConfig.update({
          where: { key: 'POLICY_VERSION' },
          data: { value: newVersion, updatedBy }
        });
        await tx.systemPolicyAuditLog.create({
          data: {
            policyId: versionRecord.id,
            key: 'POLICY_VERSION',
            oldValue: currentVersion,
            newValue: newVersion,
            version: newVersion,
            updatedBy,
            reason: `Auto-bump from ${key} change by ${updatedBy}`
          }
        });
      }
      return updatedPolicy;
    }, { isolationLevel: 'Serializable' });

    console.log(`[ADMIN POLICY] ${updatedBy} updated ${key}: ${existing.value} → ${validatedValue} (v${newVersion})`);
    res.json({
      success: true,
      data: {
        key: updated.key,
        oldValue: existing.value,
        newValue: updated.value,
        version: newVersion,
        updatedBy,
        updatedAt: updated.updatedAt
      }
    });
  } catch (err) {
    console.error('[ADMIN POLICY PUT]', err.message);
    res.status(500).json({ success: false, message: 'Không thể cập nhật policy. Vui lòng thử lại.' });
  }
});



// ═══════════════════════════════════════════════════════════════
// 3B. PERIOD LIFECYCLE — Commission Period + Policy per Period
// ═══════════════════════════════════════════════════════════════

// 15 standard policy keys seeded into each period
const PERIOD_POLICY_KEYS = [
  { key: 'AMBASSADOR_SELF_BUY',              description: 'Đại Sứ — Tự mua' },
  { key: 'AMBASSADOR_DIRECT_NO_ID',          description: 'Đại Sứ — Bán cho khách chưa có ID' },
  { key: 'AMBASSADOR_DIRECT_WITH_ID',        description: 'Đại Sứ — Bán cho khách đã có ID' },
  { key: 'AMBASSADOR_F1',                   description: 'Đại Sứ — Upstream từ F1 (D1) (10%)' },
  { key: 'AMBASSADOR_F2',                   description: 'Đại Sứ — Upstream từ F2 (D2) (5%)' },
  { key: 'AMBASSADOR_THRESHOLD',             description: 'Ngưỡng điểm tích lũy (Qualifying Points)' },
  { key: 'MANAGER_SELF_BUY',                 description: 'Trưởng nhóm — Tự mua' },
  { key: 'MANAGER_DIRECT_NO_ID',             description: 'Trưởng nhóm — Bán cho khách chưa có ID' },
  { key: 'MANAGER_DIRECT_WITH_ID',           description: 'Trưởng nhóm — Bán cho khách đã có ID' },
  { key: 'MANAGER_F1_PURCHASE',              description: 'Trưởng nhóm — F1 tự mua' },
  { key: 'MANAGER_F2_PURCHASE',              description: 'Trưởng nhóm — F2 tự mua' },
  { key: 'MANAGER_F1_SELL_TO_CUSTOMER_NO_ID', description: 'Trưởng nhóm — Khi F1 bán cho khách mới chưa ID (5%)' },
  { key: 'DIRECTOR_SELF_BUY',                description: 'Quản lý — Tự mua' },
  { key: 'DIRECTOR_DIRECT_NO_ID',            description: 'Quản lý — Bán cho khách chưa có ID' },
  { key: 'DIRECTOR_DIRECT_WITH_ID',          description: 'Quản lý — Bán cho khách đã có ID' },
  { key: 'DIRECTOR_F1',                      description: 'Quản lý — F1 (D1)' },
  { key: 'DIRECTOR_F2',                      description: 'Quản lý — F2 (D2)' },
];

const PERIOD_THRESHOLD_KEYS = new Set(['AMBASSADOR_THRESHOLD']);
const PERIOD_READ_ONLY_KEYS = new Set(['POLICY_VERSION']);

function parsePeriodPolicyVersion(versionStr) {
  // Format: "09/2026-v3" => extract number 3
  const m = versionStr && versionStr.match(/-v(\d+)$/);
  return m ? parseInt(m[1], 10) : 1;
}

function nextPeriodPolicyVersion(periodName, currentVersion) {
  const n = parsePeriodPolicyVersion(currentVersion);
  return `${periodName}-v${n + 1}`;
}

async function getOpenPeriod() {
  return prisma.commissionPeriod.findFirst({ where: { status: 'OPEN' }, orderBy: { createdAt: 'desc' } });
}

async function seedPeriodPolicies(tx, periodId, periodName, copyFromPeriodId) {
  const initialVersion = `${periodName}-v1`;
  let sourceMap = {};

  if (copyFromPeriodId) {
    const sourcePolicies = await tx.periodPolicyConfig.findMany({ where: { periodId: copyFromPeriodId } });
    sourceMap = Object.fromEntries(sourcePolicies.map(p => [p.key, p.value]));
  } else {
    // Default: copy from SystemPolicyConfig if exists, else NOT_CONFIGURED
    const sysPolicies = await tx.systemPolicyConfig.findMany();
    sourceMap = Object.fromEntries(sysPolicies.map(p => [p.key, p.value]));
  }

  const rows = PERIOD_POLICY_KEYS.map(({ key, description }) => ({
    id: require('crypto').randomBytes(12).toString('base64url'),
    periodId,
    key,
    value: sourceMap[key] !== undefined ? sourceMap[key] : 'NOT_CONFIGURED',
    description,
    version: initialVersion,
    updatedAt: new Date(),
    effectiveFrom: new Date(),
  }));

  for (const row of rows) {
    await tx.periodPolicyConfig.create({ data: row });
  }
  return initialVersion;
}

// ── GET /api/admin/periods ─────────────────────────────────────
app.get('/api/admin/periods', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const periods = await prisma.commissionPeriod.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { orders: true, commissions: true } },
        closeAudit: true,
      }
    });
    const data = periods.map(p => ({
      id: p.id,
      periodName: p.periodName,
      startAt: p.startAt,
      endAt: p.endAt,
      status: p.status,
      createdAt: p.createdAt,
      createdBy: p.createdBy,
      closedAt: p.closedAt,
      closedBy: p.closedBy,
      totalOrders: p._count.orders,
      totalCommissions: p._count.commissions,
      closeAudit: p.closeAudit,
    }));
    res.json({ success: true, data });
  } catch (err) {
    console.error('[ADMIN PERIODS GET]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/periods/current ─ CTV xem kỳ hoa hồng hiện tại ──
app.get('/api/periods/current', authenticateToken, async (req, res) => {
  try {
    const period = await getOpenPeriod();
    if (!period) {
      return res.json({ success: true, data: null, message: 'Chưa có kỳ hoa hồng nào đang mở.' });
    }
    res.json({
      success: true,
      data: {
        id: period.id,
        periodName: period.periodName,
        startAt: period.startAt,
        endAt: period.endAt,
        status: period.status,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/admin/periods ────────────────────────────────────
app.post('/api/admin/periods', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { periodName, startAt, endAt, copyFromPeriodId } = req.body;
    if (!periodName || !startAt || !endAt) {
      return res.status(400).json({ success: false, message: 'Thiếu periodName, startAt hoặc endAt.' });
    }

    // Chỉ cho 1 OPEN period tại 1 thời điểm
    const existing = await getOpenPeriod();
    if (existing) {
      return res.status(409).json({ success: false, error: 'OPEN_PERIOD_EXISTS', message: `Đã có kỳ ${existing.periodName} đang mở. Vui lòng chốt kỳ hiện tại trước khi tạo kỳ mới.` });
    }

    const period = await prisma.$transaction(async (tx) => {
      const p = await tx.commissionPeriod.create({
        data: {
          periodName,
          startAt: new Date(startAt),
          endAt: new Date(endAt),
          status: 'OPEN',
          createdBy: req.user.id,
        }
      });
      await seedPeriodPolicies(tx, p.id, periodName, copyFromPeriodId || null);
      return p;
    });

    res.status(201).json({ success: true, data: period, message: `Đã tạo kỳ ${periodName}.` });
  } catch (err) {
    console.error('[ADMIN PERIODS POST]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/periods/:periodId ──────────────────────────
app.get('/api/admin/periods/:periodId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { periodId } = req.params;
    const period = await prisma.commissionPeriod.findUnique({
      where: { id: periodId },
      include: {
        policies: { orderBy: { key: 'asc' } },
        closeAudit: true,
        _count: { select: { orders: true, commissions: true } },
      }
    });
    if (!period) return res.status(404).json({ success: false, message: 'Kỳ không tồn tại.' });

    // Aggregate commission stats
    const commAgg = await prisma.commission.aggregate({
      where: { periodId },
      _sum: { earnedPoints: true, earnedMoney: true },
      _count: { id: true },
    });

    res.json({
      success: true,
      data: {
        ...period,
        totalOrders: period._count.orders,
        totalCommissions: period._count.commissions,
        totalEarnedPoints: commAgg._sum.earnedPoints || 0,
        totalEarnedMoney: commAgg._sum.earnedMoney || 0,
      }
    });
  } catch (err) {
    console.error('[ADMIN PERIODS GET/:id]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/admin/periods/:periodId/close ────────────────────
app.post('/api/admin/periods/:periodId/close', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { periodId } = req.params;
    const { confirmPhrase } = req.body;

    const period = await prisma.commissionPeriod.findUnique({ where: { id: periodId } });
    if (!period) return res.status(404).json({ success: false, message: 'Kỳ không tồn tại.' });
    if (period.status !== 'OPEN') {
      return res.status(409).json({ success: false, error: 'PERIOD_NOT_OPEN', message: 'Kỳ này không ở trạng thái OPEN.' });
    }

    const expectedPhrase = `CHỐT KỲ ${period.periodName}`;
    if (!confirmPhrase || confirmPhrase.trim() !== expectedPhrase) {
      return res.status(400).json({ success: false, error: 'CONFIRM_MISMATCH', message: `Cụm xác nhận không đúng. Vui lòng nhập: "${expectedPhrase}"` });
    }

    // Compute summary
    const orderCount = await prisma.order.count({ where: { periodId } });
    const commAgg = await prisma.commission.aggregate({
      where: { periodId },
      _sum: { earnedPoints: true, earnedMoney: true },
      _count: { id: true },
    });

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.commissionPeriod.update({
        where: { id: periodId },
        data: { status: 'CLOSED', closedAt: now, closedBy: req.user.id }
      });
      await tx.periodCloseAudit.create({
        data: {
          periodId,
          closedBy: req.user.id,
          closedAt: now,
          oldStatus: 'OPEN',
          newStatus: 'CLOSED',
          totalOrders: orderCount,
          totalCommissions: commAgg._count.id || 0,
          totalEarnedPoints: commAgg._sum.earnedPoints || 0,
          totalEarnedMoney: commAgg._sum.earnedMoney || 0,
          metadata: JSON.stringify({ closedByRole: req.user.role }),
        }
      });
    });

    res.json({
      success: true,
      message: `Đã chốt kỳ ${period.periodName}.`,
      data: {
        periodId,
        periodName: period.periodName,
        status: 'CLOSED',
        closedAt: now,
        closedBy: req.user.id,
        totalOrders: orderCount,
        totalCommissions: commAgg._count.id || 0,
        totalEarnedPoints: commAgg._sum.earnedPoints || 0,
        totalEarnedMoney: commAgg._sum.earnedMoney || 0,
      }
    });
  } catch (err) {
    console.error('[ADMIN PERIODS CLOSE]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/periods/:periodId/policy ───────────────────
app.get('/api/admin/periods/:periodId/policy', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { periodId } = req.params;
    const period = await prisma.commissionPeriod.findUnique({ where: { id: periodId } });
    if (!period) return res.status(404).json({ success: false, message: 'Kỳ không tồn tại.' });

    const policies = await prisma.periodPolicyConfig.findMany({
      where: { periodId },
      orderBy: { key: 'asc' }
    });

    const data = policies.map(p => ({
      ...p,
      status: p.value === 'NOT_CONFIGURED' ? 'NOT_CONFIGURED' : 'ACTIVE',
      readOnly: period.status === 'CLOSED',
    }));

    res.json({ success: true, data, periodStatus: period.status });
  } catch (err) {
    console.error('[ADMIN PERIOD POLICY GET]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/periods/:periodId/policy/:key/history ──────
app.get('/api/admin/periods/:periodId/policy/:key/history', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { periodId, key } = req.params;
    const logs = await prisma.periodPolicyAuditLog.findMany({
      where: { periodId, key },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/admin/periods/:periodId/policy/:key ──────────────
app.put('/api/admin/periods/:periodId/policy/:key', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { periodId, key } = req.params;
    const { value, reason } = req.body;

    if (PERIOD_READ_ONLY_KEYS.has(key)) {
      return res.status(403).json({ success: false, error: 'KEY_NOT_EDITABLE', message: 'Không thể sửa key này trực tiếp.' });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, error: 'REASON_REQUIRED', message: 'Vui lòng nhập lý do thay đổi.' });
    }

    const period = await prisma.commissionPeriod.findUnique({ where: { id: periodId } });
    if (!period) return res.status(404).json({ success: false, message: 'Kỳ không tồn tại.' });
    if (period.status === 'CLOSED') {
      return res.status(403).json({ success: false, error: 'PERIOD_CLOSED', message: 'Kỳ đã chốt — không thể sửa policy.' });
    }

    const policy = await prisma.periodPolicyConfig.findUnique({ where: { periodId_key: { periodId, key } } });
    if (!policy) return res.status(404).json({ success: false, message: 'Policy key không tồn tại trong kỳ này.' });

    // Validate value
    if (value !== 'NOT_CONFIGURED') {
      if (PERIOD_THRESHOLD_KEYS.has(key)) {
        const n = parseInt(value, 10);
        if (isNaN(n) || n <= 0 || String(n) !== String(value).trim()) {
          return res.status(400).json({ success: false, error: 'INVALID_POLICY_VALUE', message: 'AMBASSADOR_THRESHOLD phải là số nguyên dương.' });
        }
      } else {
        const n = parseFloat(value);
        if (isNaN(n) || n < 0 || n > 1) {
          return res.status(400).json({ success: false, error: 'INVALID_POLICY_VALUE', message: 'Tỉ lệ phải từ 0.00 đến 1.00 hoặc "NOT_CONFIGURED".' });
        }
      }
    }

    const newVersion = nextPeriodPolicyVersion(period.periodName, policy.version);
    const now = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const upd = await tx.periodPolicyConfig.update({
        where: { periodId_key: { periodId, key } },
        data: { value: String(value), version: newVersion, updatedBy: req.user.id, effectiveFrom: now, updatedAt: now }
      });
      await tx.periodPolicyAuditLog.create({
        data: {
          policyId: policy.id,
          periodId,
          key,
          oldValue: policy.value,
          newValue: String(value),
          version: newVersion,
          updatedBy: req.user.id,
          reason: reason.trim(),
          effectiveFrom: now,
          updatedAt: now,
        }
      });
      return upd;
    });

    res.json({ success: true, data: { ...updated, status: updated.value === 'NOT_CONFIGURED' ? 'NOT_CONFIGURED' : 'ACTIVE' } });
  } catch (err) {
    console.error('[ADMIN PERIOD POLICY PUT]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/periods/:periodId/commissions ──────────────
app.get('/api/admin/periods/:periodId/commissions', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { periodId } = req.params;
    const commissions = await prisma.commission.findMany({
      where: { periodId },
      include: {
        receiver: { select: { userId: true, fullName: true, rank: true } },
        order: { include: { customer: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: commissions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── CTV Policy Endpoints ──────────────────────────────────────

// Map rank to relevant policy key prefixes
function getPolicyKeysForRank(rank) {
  const r = (rank || '').toUpperCase();
  const keys = [];
  if (r.includes('AMBASSADOR') || r === 'AMBASSADOR') {
    keys.push('AMBASSADOR_SELF_BUY', 'AMBASSADOR_DIRECT_NO_ID', 'AMBASSADOR_DIRECT_WITH_ID', 'AMBASSADOR_F1', 'AMBASSADOR_F2', 'AMBASSADOR_THRESHOLD');
  } else if (r.includes('SALES_MANAGER') || r === 'SALES_MANAGER') {
    keys.push('MANAGER_SELF_BUY', 'MANAGER_DIRECT_NO_ID', 'MANAGER_DIRECT_WITH_ID',
              'MANAGER_F1_PURCHASE', 'MANAGER_F2_PURCHASE', 'MANAGER_F1_SELL_TO_CUSTOMER_NO_ID');
  } else if (r.includes('SALES_DIRECTOR') || r === 'SALES_DIRECTOR') {
    keys.push('DIRECTOR_SELF_BUY', 'DIRECTOR_DIRECT_NO_ID', 'DIRECTOR_DIRECT_WITH_ID', 'DIRECTOR_F1', 'DIRECTOR_F2');
  } else {
    // Default: all keys visible
    keys.push(...PERIOD_POLICY_KEYS.map(p => p.key));
  }
  return keys;
}

// GET /api/policy/current — CTV xem policy kỳ hiện tại
app.get('/api/policy/current', authenticateToken, async (req, res) => {
  try {
    const openPeriod = await getOpenPeriod();
    if (!openPeriod) {
      return res.json({ success: true, noPeriod: true, message: 'Hiện chưa có kỳ hoa hồng nào đang mở.' });
    }

    const allPolicies = await prisma.periodPolicyConfig.findMany({
      where: { periodId: openPeriod.id },
      orderBy: { key: 'asc' }
    });

    // For CTV: filter by rank; for admin: show all
    const userRank = req.user.role === 'ctv' ? (await prisma.user.findUnique({ where: { id: req.user.dbId }, select: { rank: true } }))?.rank : null;
    const relevantKeys = userRank ? getPolicyKeysForRank(userRank) : PERIOD_POLICY_KEYS.map(p => p.key);

    const policies = allPolicies
      .filter(p => relevantKeys.includes(p.key))
      .map(p => ({
        key: p.key,
        value: p.value,
        description: p.description,
        status: p.value === 'NOT_CONFIGURED' ? 'NOT_CONFIGURED' : 'ACTIVE',
        version: p.version,
        effectiveFrom: p.effectiveFrom,
        updatedAt: p.updatedAt,
      }));

    res.json({
      success: true,
      data: {
        period: {
          id: openPeriod.id,
          periodName: openPeriod.periodName,
          startAt: openPeriod.startAt,
          endAt: openPeriod.endAt,
          status: openPeriod.status,
        },
        policies,
        userRank,
      }
    });
  } catch (err) {
    console.error('[POLICY CURRENT]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/policy/history — CTV xem lịch sử kỳ
app.get('/api/policy/history', authenticateToken, async (req, res) => {
  try {
    const periods = await prisma.commissionPeriod.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        closeAudit: true,
        _count: { select: { orders: true, commissions: true } },
      }
    });

    // For CTV: compute their own commission per period
    const userId = req.user.dbId || req.user.id; // receiverId in DB
    const commAgg = await prisma.commission.groupBy({
      by: ['periodId'],
      where: { receiverId: req.user.role === 'ctv' ? userId : undefined },
      _sum: { earnedPoints: true, earnedMoney: true },
      _count: { id: true },
    });
    const commMap = Object.fromEntries(commAgg.map(c => [c.periodId, c]));

    const data = periods.map(p => ({
      id: p.id,
      periodName: p.periodName,
      startAt: p.startAt,
      endAt: p.endAt,
      status: p.status,
      createdAt: p.createdAt,
      closedAt: p.closedAt,
      totalOrders: p._count.orders,
      myEarnedPoints: commMap[p.id]?._sum?.earnedPoints || 0,
      myEarnedMoney: commMap[p.id]?._sum?.earnedMoney || 0,
      myCommissions: commMap[p.id]?._count?.id || 0,
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/policy/:periodId — xem policy của 1 kỳ cụ thể
app.get('/api/policy/:periodId', authenticateToken, async (req, res) => {
  try {
    const { periodId } = req.params;
    const period = await prisma.commissionPeriod.findUnique({ where: { id: periodId } });
    if (!period) return res.status(404).json({ success: false, message: 'Kỳ không tồn tại.' });

    const policies = await prisma.periodPolicyConfig.findMany({
      where: { periodId },
      orderBy: { key: 'asc' }
    });

    const userRank = req.user.role === 'ctv' ? (await prisma.user.findUnique({ where: { id: req.user.dbId }, select: { rank: true } }))?.rank : null;
    const relevantKeys = (userRank && req.user.role === 'ctv') ? getPolicyKeysForRank(userRank) : PERIOD_POLICY_KEYS.map(p => p.key);

    const data = policies
      .filter(p => relevantKeys.includes(p.key))
      .map(p => ({ ...p, status: p.value === 'NOT_CONFIGURED' ? 'NOT_CONFIGURED' : 'ACTIVE' }));

    res.json({
      success: true,
      data,
      period: { id: period.id, periodName: period.periodName, status: period.status, startAt: period.startAt, endAt: period.endAt },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/policy/:periodId/changes — policy change log for a period (CTV)
app.get('/api/policy/:periodId/changes', authenticateToken, async (req, res) => {
  try {
    const { periodId } = req.params;
    const logs = await prisma.periodPolicyAuditLog.findMany({
      where: { periodId },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



// 3. DASHBOARD STATS
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    const isGlobal = req.user.role === 'admin' || req.user.role === 'accountant';

    if (isGlobal) {
      const totalDirector = await prisma.user.count({ where: { rank: 'DIRECTOR', role: 'ctv' } });
      const totalManager = await prisma.user.count({ where: { rank: 'MANAGER', role: 'ctv' } });
      const totalAmbassador = await prisma.user.count({ where: { rank: 'AMBASSADOR', role: 'ctv' } });
      const totalSalesAgg = await prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: 'COMPLETED' }
      });
      return res.json({
        success: true,
        data: {
          totalDirector,
          totalManager,
          totalAmbassador,
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

    // CTV list: ONLY isSystemParticipant=true (đã tham gia hệ thống CTV)
    let userFilter = { role: 'ctv', isSystemParticipant: true };
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
        userId: u.userId,
        name: u.fullName,
        fullName: u.fullName,
        phone: u.phone,
        tier: u.tier,
        role: u.role,
        rank: u.rank,
        rankStatus: u.rankStatus,
        businessId: u.businessId,
        isSystemParticipant: !!u.isSystemParticipant,
        participantAt: u.participantAt,
        qualifyingPoints: u.qualifyingPoints || 0,
        sPoints: u.sPoints || 0,
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

// MEMBERS LIST — Tài khoản thành viên thường (chưa tham gia CTV)
app.get('/api/users/members', authenticateToken, requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    const members = await prisma.user.findMany({
      where: {
        role: 'ctv',           // chỉ lấy user tự đăng ký portal
        isSystemParticipant: false, // chưa tham gia CTV
      },
      orderBy: { createdAt: 'desc' },
      include: {
        parent: { select: { fullName: true, userId: true } },
        _count: { select: { createdOrders: true } },
      }
    });

    res.json({
      success: true,
      data: members.map(u => ({
        id: u.id,
        userId: u.userId,
        fullName: u.fullName,
        phone: u.phone,
        role: u.role,
        isSystemParticipant: false,
        createdAt: u.createdAt,
        parentId: u.parentId || null,
        parent: u.parent ? `${u.parent.fullName} (${u.parent.userId})` : 'Trực tiếp Công ty',
        orderCount: u._count.createdOrders,
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PROMOTE TO CTV — Admin nâng tài khoản thành viên lên CTV
app.post('/api/admin/users/:userId/promote-to-ctv', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });
    if (user.isSystemParticipant) return res.status(400).json({ success: false, message: 'Tài khoản này đã là CTV.' });

    const now = new Date();
    const updated = await prisma.user.update({
      where: { userId },
      data: {
        isSystemParticipant: true,
        participantAt: now,
      }
    });

    res.json({
      success: true,
      message: `Đã nâng ${updated.fullName} lên CTV.`,
      data: {
        userId: updated.userId,
        fullName: updated.fullName,
        isSystemParticipant: true,
        participantAt: now,
      }
    });
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
        mustChangePassword: false /* AUTO-DISABLED: no frontend UI yet */
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
        mustChangePassword: false /* AUTO-DISABLED: no frontend UI yet */
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
    const tempPassword = crypto.randomBytes(3).toString('hex') + 'Aa1!';
    const hashed = await bcrypt.hash(tempPassword, 10);

    await prisma.user.update({
      where: { userId: id },
      data: { password: hashed, mustChangePassword: false /* AUTO-DISABLED: no frontend UI yet */ }
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

/**
 * DELETE /api/admin/users/:userId — Xóa hoàn toàn 1 user (CTV/thành viên)
 * Xóa tất cả data liên quan: commissions, orders, customers, points, rank
 * Admin only.
 */
app.delete('/api/admin/users/:userId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findFirst({ where: { OR: [{ userId }, { id: userId }] } });
    if (!user) return res.status(404).json({ success: false, message: 'User không tồn tại.' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Không thể xóa tài khoản admin.' });

    console.log('[DELETE USER]', user.userId, user.fullName, 'by', req.user.id);
    const r = {};

    // 1. Delete commissions where user is receiver
    try { r.commissionsReceived = (await prisma.commission.deleteMany({ where: { receiverId: user.userId } })).count; } catch(e) { r.commissionsReceived = 0; }

    // 2. Delete commissions on user's orders
    const userOrders = await prisma.order.findMany({ where: { ordererUserId: user.id }, select: { id: true } });
    const orderIds = userOrders.map(o => o.id);
    if (orderIds.length > 0) {
      try { r.commissionsOnOrders = (await prisma.commission.deleteMany({ where: { orderId: { in: orderIds } } })).count; } catch(e) { r.commissionsOnOrders = 0; }
      try { r.commissionProcessing = (await prisma.commissionProcessing.deleteMany({ where: { orderId: { in: orderIds } } })).count; } catch(e) { r.commissionProcessing = 0; }
      try { r.sPointTx = (await prisma.sPointTransaction.deleteMany({ where: { orderId: { in: orderIds } } })).count; } catch(e) { r.sPointTx = 0; }
    }

    // 3. Delete user's SPoint transactions (non-order linked)
    try { r.sPointTxUser = (await prisma.sPointTransaction.deleteMany({ where: { userId: user.userId } })).count; } catch(e) { r.sPointTxUser = 0; }

    // 4. Delete order items then orders
    if (orderIds.length > 0) {
      try { r.orderItems = (await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } })).count; } catch(e) { r.orderItems = 0; }
      try { r.orders = (await prisma.order.deleteMany({ where: { id: { in: orderIds } } })).count; } catch(e) { r.orders = 0; }
    }

    // 5. Delete customer audit logs + customers linked to this user
    const userCustomers = await prisma.customer.findMany({ where: { OR: [{ linkedUserId: user.id }, { sponsorUserId: user.id }] }, select: { id: true } });
    const custIds = userCustomers.map(c => c.id);
    if (custIds.length > 0) {
      try { r.customerAuditLog = (await prisma.customerAuditLog.deleteMany({ where: { customerId: { in: custIds } } })).count; } catch(e) { r.customerAuditLog = 0; }
      // Unlink sponsor from other customers (don't delete them)
      try { r.sponsorUnlinked = (await prisma.customer.updateMany({ where: { sponsorUserId: user.id }, data: { sponsorUserId: null } })).count; } catch(e) { r.sponsorUnlinked = 0; }
      // Delete self-linked customers
      try { r.customers = (await prisma.customer.deleteMany({ where: { linkedUserId: user.id } })).count; } catch(e) { r.customers = 0; }
    }

    // 6. Delete rank history
    try { r.rankHistory = (await prisma.rankHistory.deleteMany({ where: { userId: user.userId } })).count; } catch(e) { r.rankHistory = 0; }

    // 7. Unlink children (set parentId = null for downlines)
    try { r.childrenUnlinked = (await prisma.user.updateMany({ where: { parentId: user.userId }, data: { parentId: null } })).count; } catch(e) { r.childrenUnlinked = 0; }

    // 8. Delete the user
    try { await prisma.user.delete({ where: { id: user.id } }); r.userDeleted = true; } catch(e) { r.userDeleted = 'FAILED: ' + e.message; }

    console.log('[DELETE USER] Done:', JSON.stringify(r));
    res.json({ success: true, summary: r });
  } catch(e) {
    console.error('[DELETE USER]', e);
    res.status(500).json({ success: false, message: e.message });
  }
});


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

    // Fetch self-linked customers separately (sourceCtvId may differ from userId)
    const userDbIds = users.map(u => u.id);
    const selfLinkedCustomers = await prisma.customer.findMany({
      where: { linkedUserId: { in: userDbIds } },
      include: { orders: { where: { status: 'COMPLETED' }, select: { totalAmount: true } } }
    });
    const selfCustMap = {};
    selfLinkedCustomers.forEach(c => { if (c.linkedUserId) selfCustMap[c.linkedUserId] = c; });

    const userMap = {};
    users.forEach(u => {
      const selfCustomer = selfCustMap[u.id];
      const selfSales = selfCustomer 
        ? selfCustomer.orders.reduce((sum, o) => sum + o.totalAmount, 0)
        : 0;
      userMap[u.userId] = {
        id: u.userId,
        name: u.fullName,
        tier: u.tier,
        rank: u.rank,
        businessId: u.businessId,
        totalSales: selfSales,
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
      // Exclude CTV's own self-linked Customer record (for SELF_PURCHASE only)
      // This prevents CTV from seeing themselves in the "Khách Hàng" dropdown
      whereFilter.NOT = { linkedUserId: req.user.dbId };
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
          mustChangePassword: false /* AUTO-DISABLED: no frontend UI yet */
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
          mustChangePassword: false /* AUTO-DISABLED: no frontend UI yet */
        }
      });
    } else {
      let dataToUpdate = { role: 'ctv', tier: targetTier, mustChangePassword: false /* AUTO-DISABLED: no frontend UI yet */ };
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
    const { ctvUserId, ordererUserId } = req.query;
    let whereFilter = {};

    if (req.user.role === 'ctv') {
      // CTV chỉ thấy orders liên quan đến CTV và downline
      const downline = await getDownlineUserIds(req.user.id);
      const allowedCtvIds = [req.user.id, ...Array.from(downline)];
      whereFilter = {
        customer: { sourceCtvId: { in: allowedCtvIds } }
      };
    } else {
      // Admin/accountant: có thể filter theo CTV hoặc orderer
      if (ctvUserId) {
        whereFilter = { customer: { sourceCtvId: ctvUserId } };
      } else if (ordererUserId) {
        whereFilter = { ordererUserId };
      }
    }

    const orders = await prisma.order.findMany({
      where: whereFilter,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          include: { sourceCtv: { select: { userId: true, fullName: true, phone: true, tier: true, rank: true, businessId: true } } }
        },
        orderer: { select: { userId: true, fullName: true, phone: true, role: true } },
        items: {
          include: {
            service: true,
            product: { select: { id: true, title: true, price: true, commissionPoints: true } }
          }
        },
        commissions: {
          select: { type: true, receiverId: true, earnedMoney: true, earnedPoints: true, ruleKey: true, status: true }
        },
        period: { select: { id: true, periodName: true, status: true } }
      }
    });

    // Attach linked WebsiteOrder info (customer name/phone from website form)
    const orderIds = orders.map(o => o.id);
    const linkedWOs = await prisma.websiteOrder.findMany({
      where: { shadowOrderId: { in: orderIds } },
      select: { shadowOrderId: true, customerName: true, customerPhone: true, id: true }
    });
    const woMap = {};
    for (const wo of linkedWOs) { if (wo.shadowOrderId) woMap[wo.shadowOrderId] = wo; }
    
    const enriched = orders.map(o => ({
      ...o,
      websiteCustomer: woMap[o.id] || null,
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE ORDER — Phase 2D: Purchase Subject Validation
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    // ─── PHASE 2D: PURCHASE SUBJECT VALIDATION ─────────────────────────────
    // purchaseSubject from client is INTENT only. Backend validates and computes truth.
    // Refs: PHASE 2D SPEC v1

    let { customerId, purchaseSubject, items, shippingAddress, recipientPhone, recipientEmail, contactHotline } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Đơn hàng phải có ít nhất một sản phẩm/dịch vụ.' });
    }

    // Step 1: Validate purchaseSubject is declared
    if (!purchaseSubject || !['SELF', 'CUSTOMER'].includes(purchaseSubject)) {
      return res.status(400).json({ success: false, error: 'INVALID_PURCHASE_SUBJECT',
        message: 'purchaseSubject phải là "SELF" hoặc "CUSTOMER".' });
    }

    // Step 2: Orderer is strictly from JWT — never from client payload
    const ordererUserId = req.user.dbId || req.user.id;

    let customer;

    if (purchaseSubject === 'SELF') {
      // ── SELF PURCHASE ────────────────────────────────────────────────────
      // Find or auto-create linked Customer for self-purchase
      customer = await prisma.customer.findFirst({
        where: { linkedUserId: ordererUserId }
      });
      if (!customer) {
        // Auto-create linked Customer (fallback for users who joined before this feature)
        const ordererUser = await prisma.user.findUnique({ where: { id: ordererUserId } });
        if (!ordererUser || !ordererUser.isSystemParticipant) {
          return res.status(400).json({ success: false, error: 'NOT_PARTICIPANT',
            message: 'Bạn chưa tham gia chương trình CTV. Vui lòng tham gia trước.' });
        }
        const orderSponsor = ordererUser.parentId ? (await prisma.user.findFirst({ where: { userId: ordererUser.parentId } })) : null;
        customer = await prisma.customer.create({
          data: {
            fullName: ordererUser.fullName,
            phone: ordererUser.phone,
            sourceCtvId: ordererUser.userId,
            sponsorUserId: orderSponsor?.id || null,
            linkedUserId: ordererUser.id,
            status: 'NEW',
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          }
        });
        console.log(`[ORDER] Auto-created self-linked Customer ${customer.id} for ${ordererUser.userId}`);
      }
      // If client also sent customerId, it must match
      if (customerId && customerId !== customer.id) {
        return res.status(400).json({ success: false, error: 'SELF_PURCHASE_CUSTOMER_MISMATCH',
          message: 'customerId không khớp với hồ sơ khách hàng của bạn.' });
      }
      customerId = customer.id;

    } else {
      // ── CUSTOMER PURCHASE ────────────────────────────────────────────────
      if (!customerId) {
        return res.status(400).json({ success: false, error: 'CUSTOMER_ID_REQUIRED',
          message: 'Vui lòng chọn khách hàng.' });
      }
      customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!customer) {
        return res.status(404).json({ success: false, error: 'CUSTOMER_NOT_FOUND',
          message: 'Không tìm thấy thông tin khách hàng.' });
      }
      if (!customer.sponsorUserId) {
        return res.status(400).json({ success: false, error: 'CUSTOMER_NO_SPONSOR',
          message: 'Khách hàng này chưa có sponsor. Vui lòng cập nhật thông tin trước khi tạo đơn.' });
      }
      // Cannot use CUSTOMER subject to buy for own linked customer — must use SELF
      if (customer.linkedUserId && customer.linkedUserId === ordererUserId) {
        return res.status(400).json({ success: false, error: 'SELF_PURCHASE_USE_SELF_SUBJECT',
          message: 'Đây là tài khoản của bạn. Vui lòng chọn "Tự mua" thay vì "Khách hàng".' });
      }
    }

    // Step 3: Server computes purchaseType — never trust client for this
    const isSelf = !!(customer.linkedUserId && customer.linkedUserId === ordererUserId);
    const purchaseType = isSelf ? 'SELF_PURCHASE' : 'CUSTOMER_PURCHASE';

    // Step 4: Final cross-check — client intent must match server truth
    const clientIntendedSelf = (purchaseSubject === 'SELF');
    if (clientIntendedSelf !== isSelf) {
      return res.status(400).json({ success: false, error: 'PURCHASE_SUBJECT_MISMATCH',
        message: 'purchaseSubject không khớp với dữ liệu thực tế. Vui lòng làm mới trang và thử lại.' });
    }

    // CTV permission check (downline restriction for CUSTOMER purchases)
    if (req.user.role === 'ctv' && !isSelf) {
      const downline = await getDownlineUserIds(req.user.id);
      if (customer.sourceCtvId !== req.user.userId && !downline.has(customer.sourceCtvId)) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền tạo đơn cho khách hàng của CTV khác.' });
      }
    }
    // ─── END PHASE 2D VALIDATION ──────────────────────────────────────────

    // Build order items
    let totalAmount = 0;
    const itemsData = [];

    for (const item of items) {
      const hasService = !!item.serviceId;
      const hasProduct = !!item.productId;

      if ((hasService && hasProduct) || (!hasService && !hasProduct)) {
        return res.status(400).json({
          success: false,
          message: 'Mỗi mục đơn hàng phải có chính xác một nguồn (serviceId HOẶC productId).'
        });
      }

      const qty = item.qty ? Math.max(1, parseInt(item.qty, 10)) : 1;
      let itemAmount = 0;
      let unitCommissionPts = 0;
      let serviceId = null;
      let productId = null;

      if (hasService) {
        const svc = await prisma.service.findUnique({ where: { id: item.serviceId } });
        if (!svc) return res.status(400).json({ success: false, message: `Dịch vụ ${item.serviceId} không tồn tại` });
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

      itemsData.push({ serviceId, productId, amount: itemAmount, qty, unitCommissionPts, lineCommissionPts });
    }

    // Period Lifecycle: Assign order to current OPEN period (lenient — null if no OPEN period)
    const openPeriodForOrder = await prisma.commissionPeriod.findFirst({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' }
    });
    const orderPeriodId = openPeriodForOrder ? openPeriodForOrder.id : null;

    const order = await prisma.order.create({
      data: {
        customerId,
        totalAmount,
        status: 'NEW',
        orderType: 'RETAIL',
        isSelfBuy: isSelf,
        purchaseType,
        ordererUserId,
        periodId: orderPeriodId,
        shippingAddress: shippingAddress || null,
        recipientPhone: recipientPhone || null,
        recipientEmail: recipientEmail || null,
        contactHotline: contactHotline || null, // Period Lifecycle
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

    // Settlement DEFERRED — only runs when admin marks order as COMPLETED
    // CTV Portal orders follow the same lifecycle as Website Orders:
    // NEW → CONFIRMED → SHIPPING → COMPLETED (settlement) | CANCELLED (reversal)

    res.json({
      success: true,
      data: order,
      settlement: null,
      commissions: [],
      periodId: orderPeriodId,
      message: 'Đơn hàng đã tạo thành công. Chờ admin xác nhận và hoàn thành để tính hoa hồng.',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ctv/customers — CTV creates a new customer
 * If joinCTV=true → creates User + Customer (downline of CTV)
 * If joinCTV=false → creates Customer only (regular customer of CTV)
 */
app.post('/api/ctv/customers', authenticateToken, async (req, res) => {
  try {
    const { fullName, phone, joinCTV } = req.body;
    if (!fullName?.trim() || !phone?.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên và SĐT.' });
    }

    const lookupId = req.user.userId || req.user.id;
    const ctvUser = await prisma.user.findFirst({ where: { OR: [{ userId: lookupId }, { id: lookupId }] } });
    if (!ctvUser) return res.status(404).json({ success: false, message: 'Không tìm thấy CTV.' });

    // Check duplicate phone in Customer
    const existingCustomer = await prisma.customer.findFirst({ where: { phone: phone.trim() } });
    if (existingCustomer) {
      return res.status(400).json({ success: false, message: 'SĐT này đã có trong hệ thống.', customer: existingCustomer });
    }

    let newUser = null;
    let customer;

    if (joinCTV) {
      // Check duplicate phone in User
      const existingUser = await prisma.user.findUnique({ where: { phone: phone.trim() } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'SĐT này đã đăng ký tài khoản.' });
      }

      // Generate userId
      let generatedId = '', isUnique = false;
      while (!isUnique) {
        generatedId = 'U' + Math.floor(100 + Math.random() * 900);
        const check = await prisma.user.findUnique({ where: { userId: generatedId } });
        if (!check) isUnique = true;
      }

      // Create User (downline of CTV)
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('123456', 10);
      newUser = await prisma.user.create({
        data: {
          userId: generatedId,
          fullName: fullName.trim(),
          phone: phone.trim(),
          password: hashedPassword,
          tier: 'NONE',
          role: 'ctv',
          parentId: ctvUser.userId,
          isSystemParticipant: true,
          participantAt: new Date(),
          qualifyingPoints: 0,
          sPoints: 0,
        }
      });
      console.log('[CTV CREATE CUSTOMER] Created User', generatedId, 'as downline of', ctvUser.userId);

      // Create Customer (linked to new user, sponsored by CTV)
      customer = await prisma.customer.create({
        data: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          sourceCtvId: ctvUser.userId,
          sponsorUserId: ctvUser.id,
          linkedUserId: newUser.id,
          status: 'NEW',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        }
      });
      console.log('[CTV CREATE CUSTOMER] Created CTV Customer', customer.id, 'linked to', generatedId);
    } else {
      // Create Customer only (not joining CTV system)
      customer = await prisma.customer.create({
        data: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          sourceCtvId: ctvUser.userId,
          sponsorUserId: ctvUser.id,
          linkedUserId: null,
          status: 'NEW',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        }
      });
      console.log('[CTV CREATE CUSTOMER] Created regular Customer', customer.id, 'for CTV', ctvUser.userId);
    }

    res.status(201).json({
      success: true,
      customer,
      user: newUser ? { userId: newUser.userId, fullName: newUser.fullName } : null,
      message: joinCTV
        ? 'Đã tạo khách hàng + tài khoản CTV. Mật khẩu mặc định: 123456'
        : 'Đã tạo khách hàng thành công.',
    });
  } catch(e) {
    console.error('[CTV CREATE CUSTOMER]', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * PUT /api/admin/orders/:id/status
 * Admin — update CTV Order status + trigger settlement/reversal
 * Same lifecycle as Website Orders: NEW → CONFIRMED → SHIPPING → COMPLETED | CANCELLED
 */
app.put('/api/admin/orders/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'accountant') {
      return res.status(403).json({ success: false, message: 'Không có quyền.' });
    }
    const { status } = req.body;
    const validStatuses = ['NEW', 'DEPOSIT', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ.' });
    }

    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại.' });

    if (order.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Đơn đã hủy, không thể thay đổi.' });
    }

    // Forward-only: cannot go backward (except CANCELLED which can come from any status)
    if (status !== 'CANCELLED') {
      const ORDER_FLOW = ['NEW', 'DEPOSIT', 'CONFIRMED', 'SHIPPING', 'COMPLETED'];
      const currentIdx = ORDER_FLOW.indexOf(order.status);
      const targetIdx = ORDER_FLOW.indexOf(status);
      // Allow skipping (e.g. NEW → CONFIRMED), but not going backward
      if (currentIdx >= 0 && targetIdx >= 0 && targetIdx <= currentIdx) {
        return res.status(400).json({ success: false, 
          message: `Không thể chuyển từ ${order.status} về ${status}. Chỉ được chuyển tiến hoặc hủy.` });
      }
    }

    if (order.status === 'COMPLETED' && status !== 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Đơn đã hoàn thành. Chỉ có thể hủy.' });
    }

    // Build update data — include deposit info if transitioning to DEPOSIT
    const updateData = { status };
    if (status === 'DEPOSIT') {
      const { depositAmount, depositNote } = req.body;
      if (depositAmount && Number(depositAmount) > 0) {
        updateData.depositAmount = Number(depositAmount);
        updateData.depositAt = new Date().toISOString();
        if (depositNote) updateData.depositNote = depositNote;
      }
    }

    await prisma.order.update({ where: { id: req.params.id }, data: updateData });
    console.log('[ORDER STATUS]', req.params.id, order.status, '→', status, 
      status === 'DEPOSIT' ? `(deposit: ${updateData.depositAmount || 0})` : '');

    let settlementResult = null;
    let reversalResult = null;

    // SETTLEMENT: runs when entering COMPLETED
    if (status === 'COMPLETED') {
      try {
        settlementResult = await executeOrderSettlement(req.params.id);
        console.log('[ORDER LIFECYCLE] Settlement:', settlementResult?.createdCommissions?.length || 0, 'commissions');
      } catch (e) {
        console.error('[ORDER LIFECYCLE] Settlement error:', e.message);
      }
    }

    // REVERSAL: runs when LEAVING COMPLETED (cancel, return, or any backward change)
    // This ensures CP/SP/commissions are always reversed when order is no longer complete
    if (order.status === 'COMPLETED' && status !== 'COMPLETED') {
      try {
        reversalResult = await reverseOrderSettlement(req.params.id, req.user);
        console.log('[ORDER LIFECYCLE] Reversal (left COMPLETED):', JSON.stringify(reversalResult));
      } catch (e) {
        console.error('[ORDER LIFECYCLE] Reversal error:', e.message);
      }
    }

    // SYNC: If this CTV order is a shadow of a WebsiteOrder, sync status back
    try {
      const linkedWO = await prisma.websiteOrder.findFirst({ where: { shadowOrderId: req.params.id } });
      if (linkedWO && linkedWO.status !== status) {
        await prisma.websiteOrder.update({ where: { id: linkedWO.id }, data: { status } });
        console.log('[ORDER SYNC] CTV Order', req.params.id, '→ WebsiteOrder', linkedWO.id, '= status:', status);
      }
    } catch(syncErr) { console.error('[ORDER SYNC] CTV→Website sync error:', syncErr.message); }

    res.json({
      success: true,
      settlement: settlementResult ? { commissions: settlementResult.createdCommissions?.length || 0 } : null,
      reversal: reversalResult || null,
    });
  } catch (err) {
    console.error('[ORDER STATUS]', err.message);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});




// ════════════════════════════════════════════════════
// LEADS (Đơn Tư Vấn) CRUD
// ════════════════════════════════════════════════════

/**
 * GET /api/leads — List all leads (admin only)
 */
app.get('/api/leads', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: leads });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

/**
 * POST /api/leads — Create a new lead (public — from website contact form)
 */
app.post('/api/leads', async (req, res) => {
  try {
    const { customerName, phone, email, message, address, productName } = req.body;
    if (!customerName || !phone) {
      return res.status(400).json({ success: false, message: 'Tên và SĐT là bắt buộc' });
    }
    const lead = await prisma.lead.create({
      data: { customerName, phone, email: email || null, message: message || null, address: address || null, productName: productName || null }
    });
    res.json({ success: true, data: lead });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

/**
 * PUT /api/leads/:id/status — Update lead status (admin only)
 */
app.put('/api/leads/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const { status } = req.body;
    const valid = ['new', 'contacted', 'completed', 'cancelled'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: 'Status không hợp lệ: ' + valid.join(', ') });
    }
    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json({ success: true, data: lead });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

/**
 * DELETE /api/leads/:id — Delete a lead (admin only)
 */
app.delete('/api/leads/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    await prisma.lead.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

/**
 * POST /api/admin/reset-orders
 * Reset Orders only — keeps users, CTV, members
 */
app.post('/api/admin/reset-orders', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Super Admin only' });
    const { confirm } = req.body;
    if (confirm !== 'RESET_ORDERS') return res.status(400).json({ success: false, message: 'Nhập RESET_ORDERS' });

    console.log('[RESET ORDERS] by', req.user.id, new Date().toISOString());
    const r = {};
    try { r.commissionProcessing = (await prisma.commissionProcessing.deleteMany({})).count; } catch(e) { r.commissionProcessing = 0; }
    try { r.commissions = (await prisma.commission.deleteMany({})).count; } catch(e) { r.commissions = 0; }
    try { r.commissionPointAudit = (await prisma.commissionPointAuditLog.deleteMany({})).count; } catch(e) { r.commissionPointAudit = 0; }
    try { r.orderItems = (await prisma.orderItem.deleteMany({})).count; } catch(e) { r.orderItems = 0; }
    try { r.orders = (await prisma.order.deleteMany({})).count; } catch(e) { r.orders = 0; }
    try { r.websiteOrders = (await prisma.websiteOrder.deleteMany({})).count; } catch(e) { r.websiteOrders = 0; }
    try { r.sPointTx = (await prisma.sPointTransaction.deleteMany({})).count; } catch(e) { r.sPointTx = 0; }
    try { r.rankHistory = (await prisma.rankHistory.deleteMany({})).count; } catch(e) { r.rankHistory = 0; }
    
    // Clean audit + period data + reset BID sequence
    try { r.customerAuditLog = (await prisma.customerAuditLog.deleteMany({})).count; } catch(e) { r.customerAuditLog = 0; }
    try { r.periodCloseAudit = (await prisma.periodCloseAudit.deleteMany({})).count; } catch(e) { r.periodCloseAudit = 0; }
    try { r.periodPolicyAudit = (await prisma.periodPolicyAuditLog.deleteMany({})).count; } catch(e) { r.periodPolicyAudit = 0; }
    try { r.periodPolicyConfig = (await prisma.periodPolicyConfig.deleteMany({})).count; } catch(e) { r.periodPolicyConfig = 0; }
    try { r.commissionPeriods = (await prisma.commissionPeriod.deleteMany({})).count; } catch(e) { r.commissionPeriods = 0; }
    try { await prisma.businessIdSequence.update({ where: { id: 1 }, data: { nextVal: 10001 } }); r.bidSequenceReset = true; } catch(e) { r.bidSequenceReset = false; }
    
    // Reverse QP/SP on all users
    const allU = await prisma.user.findMany({ select: { id: true } });
    for (const u of allU) {
      try {
        await prisma.user.update({ where: { id: u.id }, data: { 
            qualifyingPoints: 0, sPoints: 0, totalMachinesBought: 0, wholesaleEligible: false,
            rank: null, rankStatus: null, rankAchievedAt: null, rankActivationMethod: null, rankActivatedBy: null,
            tier: 'NONE', businessId: null
          } });
      } catch(e) {}
    }
    r.usersPointsReset = allU.length;
    
    res.json({ success: true, summary: r });
  } catch(e) { console.error('[RESET ORDERS]', e); res.status(500).json({ success: false, message: e.message }); }
});

/**
 * POST /api/admin/reset-ctv
 * Reset CTV/Ambassador — keeps user accounts, customer profiles
 */
app.post('/api/admin/reset-ctv', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Super Admin only' });
    const { confirm } = req.body;
    if (confirm !== 'RESET_CTV') return res.status(400).json({ success: false, message: 'Nhập RESET_CTV' });

    console.log('[RESET CTV] by', req.user.id, new Date().toISOString());
    const r = {};
    
    // Delete commission data
    try { r.commissionProcessing = (await prisma.commissionProcessing.deleteMany({})).count; } catch(e) { r.commissionProcessing = 0; }
    try { r.commissions = (await prisma.commission.deleteMany({})).count; } catch(e) { r.commissions = 0; }
    try { r.commissionPointAudit = (await prisma.commissionPointAuditLog.deleteMany({})).count; } catch(e) { r.commissionPointAudit = 0; }
    try { r.sPointTx = (await prisma.sPointTransaction.deleteMany({})).count; } catch(e) { r.sPointTx = 0; }
    try { r.rankHistory = (await prisma.rankHistory.deleteMany({})).count; } catch(e) { r.rankHistory = 0; }
    
    // Reset all non-admin users: rank, sponsor, qualification, wallet
    const allU = await prisma.user.findMany({ where: { role: { not: 'admin' } }, select: { id: true } });
    let resetCount = 0;
    for (const u of allU) {
      try {
        await prisma.user.update({
          where: { id: u.id },
          data: {
            qualifyingPoints: 0, sPoints: 0, rank: null, rankStatus: null, rankAchievedAt: null,
            rankActivationMethod: null, rankActivatedBy: null, tier: 'NONE',
            businessId: null, // GIỮ isSystemParticipant=true — CTV vẫn là CTV sau reset
            totalMachinesBought: 0, wholesaleEligible: false, parentId: null,
          }
        });
        resetCount++;
      } catch(e) {}
    }
    r.usersReset = resetCount;
    
    res.json({ success: true, summary: r });
  } catch(e) { console.error('[RESET CTV]', e); res.status(500).json({ success: false, message: e.message }); }
});

/**
 * POST /api/admin/reset-members
 * Reset Members — deletes non-admin users + customers
 */
app.post('/api/admin/reset-members', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Super Admin only' });
    const { confirm } = req.body;
    if (confirm !== 'RESET_MEMBERS') return res.status(400).json({ success: false, message: 'Nhập RESET_MEMBERS' });

    console.log('[RESET MEMBERS] by', req.user.id, new Date().toISOString());
    const r = {};
    
    // Must delete related data first (FK constraints)
    try { r.commissionProcessing = (await prisma.commissionProcessing.deleteMany({})).count; } catch(e) { r.commissionProcessing = 0; }
    try { r.commissions = (await prisma.commission.deleteMany({})).count; } catch(e) { r.commissions = 0; }
    try { r.commissionPointAudit = (await prisma.commissionPointAuditLog.deleteMany({})).count; } catch(e) { r.commissionPointAudit = 0; }
    try { r.orderItems = (await prisma.orderItem.deleteMany({})).count; } catch(e) { r.orderItems = 0; }
    try { r.orders = (await prisma.order.deleteMany({})).count; } catch(e) { r.orders = 0; }
    try { r.sPointTx = (await prisma.sPointTransaction.deleteMany({})).count; } catch(e) { r.sPointTx = 0; }
    try { r.rankHistory = (await prisma.rankHistory.deleteMany({})).count; } catch(e) { r.rankHistory = 0; }
    try { r.customerAuditLog = (await prisma.customerAuditLog.deleteMany({})).count; } catch(e) { r.customerAuditLog = 0; }
    try { r.customers = (await prisma.customer.deleteMany({})).count; } catch(e) { r.customers = 0; }
    try { r.usersDeleted = (await prisma.user.deleteMany({ where: { role: { not: 'admin' } } })).count; } catch(e) { console.error('[RESET] User delete FAILED:', e.message); r.usersDeleted = 'FAILED: ' + e.message; }
    
    res.json({ success: true, summary: r });
  } catch(e) { console.error('[RESET MEMBERS]', e); res.status(500).json({ success: false, message: e.message }); }
});

/**
 * POST /api/admin/factory-reset
 * 🔥 Factory Reset — xóa MỌI dữ liệu vận hành, giữ cấu hình + admin
 *
 * ✅ DELETE (dữ liệu vận hành):
 *   CommissionProcessing, Commission, CommissionPointAuditLog,
 *   PeriodCloseAudit, PeriodPolicyAuditLog, PeriodPolicyConfig, CommissionPeriod,
 *   OrderItem, Order, WebsiteOrder,
 *   WholesaleOrderItem, WholesaleOrder,
 *   SPointTransaction, RankHistory,
 *   CustomerAuditLog, Appointment, Customer,
 *   Lead,
 *   User (role != admin),
 *   BusinessIdSequence
 *
 * ❌ KEEP (cấu hình + admin):
 *   User (role=admin), AdminUser,
 *   Product, ProductCategory,
 *   Service, ServiceCategory,
 *   CommissionPriceRule,
 *   SystemPolicyConfig, SystemPolicyAuditLog
 */
app.post('/api/admin/factory-reset', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Super Admin only' });
    const { confirm } = req.body;
    if (confirm !== 'DELETE ALL DATA') return res.status(400).json({ success: false, message: 'Nhập đúng: DELETE ALL DATA' });

    console.log('[FACTORY RESET] ⚠️ by', req.user.id, new Date().toISOString());
    const r = {};

    // ── Commission & Settlement ──
    try { r.commissionProcessing = (await prisma.commissionProcessing.deleteMany({})).count; } catch(e) { r.commissionProcessing = 0; }
    try { r.commissions          = (await prisma.commission.deleteMany({})).count; }          catch(e) { r.commissions = 0; }
    try { r.commPointAudit       = (await prisma.commissionPointAuditLog.deleteMany({})).count; } catch(e) { r.commPointAudit = 0; }

    // ── Period (Kỳ hoa hồng) ──
    try { r.periodCloseAudit  = (await prisma.periodCloseAudit.deleteMany({})).count; }    catch(e) { r.periodCloseAudit = 0; }
    try { r.periodPolicyAudit = (await prisma.periodPolicyAuditLog.deleteMany({})).count; } catch(e) { r.periodPolicyAudit = 0; }
    try { r.periodPolicy      = (await prisma.periodPolicyConfig.deleteMany({})).count; }  catch(e) { r.periodPolicy = 0; }
    try { r.periods           = (await prisma.commissionPeriod.deleteMany({})).count; }    catch(e) { r.periods = 0; }

    // ── Orders ──
    try { r.orderItems      = (await prisma.orderItem.deleteMany({})).count; }          catch(e) { r.orderItems = 0; }
    try { r.orders          = (await prisma.order.deleteMany({})).count; }              catch(e) { r.orders = 0; }
    try { r.websiteOrders   = (await prisma.websiteOrder.deleteMany({})).count; }       catch(e) { r.websiteOrders = 0; }
    try { r.wholesaleItems  = (await prisma.wholesaleOrderItem.deleteMany({})).count; } catch(e) { r.wholesaleItems = 0; }
    try { r.wholesaleOrders = (await prisma.wholesaleOrder.deleteMany({})).count; }     catch(e) { r.wholesaleOrders = 0; }

    // ── QP / SP / Rank ──
    try { r.sPointTx    = (await prisma.sPointTransaction.deleteMany({})).count; } catch(e) { r.sPointTx = 0; }
    try { r.rankHistory = (await prisma.rankHistory.deleteMany({})).count; }        catch(e) { r.rankHistory = 0; }

    // ── Customer / Consultation / Warranty ──
    try { r.customerAudit = (await prisma.customerAuditLog.deleteMany({})).count; } catch(e) { r.customerAudit = 0; }
    try { r.appointments  = (await prisma.appointment.deleteMany({})).count; }      catch(e) { r.appointments = 0; }
    try { r.customers     = (await prisma.customer.deleteMany({})).count; }         catch(e) { r.customers = 0; }
    try { r.leads         = (await prisma.lead.deleteMany({})).count; }             catch(e) { r.leads = 0; }

    // ── Users (non-admin) ──
    try { r.usersDeleted = (await prisma.user.deleteMany({ where: { role: { not: 'admin' } } })).count; } catch(e) { console.error('[RESET] User delete FAILED:', e.message); r.usersDeleted = 'FAILED: ' + e.message; }

    // ── Reset admin users (points/rank only) ──
    const admins = await prisma.user.findMany({ where: { role: 'admin' }, select: { id: true } });
    for (const u of admins) {
      try {
        await prisma.user.update({
          where: { id: u.id },
          data: {
            qualifyingPoints: 0, sPoints: 0,
            rank: null, rankStatus: null, rankAchievedAt: null,
            rankActivationMethod: null, rankActivatedBy: null,
            totalMachinesBought: 0, wholesaleEligible: false,
            businessId: null, // GIỮ isSystemParticipant=true — CTV vẫn là CTV sau reset
            parentId: null,
          }
        });
      } catch(e) {}
    }
    r.adminsReset = admins.length;

    // ── Sequences ──
    try { r.businessIdSeq = (await prisma.businessIdSequence.deleteMany({})).count; } catch(e) { r.businessIdSeq = 0; }
    // P0-4 FIX: Re-seed BusinessIdSequence after delete
    try { await prisma.businessIdSequence.create({ data: { id: 1, nextVal: 10001 } }); r.bidReseeded = true; } catch(e) { r.bidReseeded = false; }

    console.log('[FACTORY RESET] ✅ Done', JSON.stringify(r));
    res.json({ success: true, summary: r });
  } catch(e) { console.error('[FACTORY RESET]', e); res.status(500).json({ success: false, message: e.message }); }
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

/**
 * PUT /api/admin/commissions/:id/status
 * Admin/Accountant — update commission status (approve/reject/pay)
 * Valid transitions:
 *   PENDING → APPROVED, PENDING → REJECTED
 *   APPROVED → PAID, APPROVED → REJECTED
 */
app.put('/api/admin/commissions/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'accountant') {
      return res.status(403).json({ success: false, message: 'Không có quyền.' });
    }
    const { status } = req.body;
    const validStatuses = ['APPROVED', 'PAID', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ. Chọn: APPROVED, PAID, REJECTED' });
    }

    const comm = await prisma.commission.findUnique({ where: { id: req.params.id } });
    if (!comm) return res.status(404).json({ success: false, message: 'Hoa hồng không tồn tại.' });

    // Validate transitions
    const validTransitions = {
      PENDING:  ['APPROVED', 'REJECTED'],
      APPROVED: ['PAID', 'REJECTED'],
      PAID:     [], // immutable — use REVERSAL
      REJECTED: [],
      REVOKED:  [],
      COMPLETED: [],
    };
    const allowed = validTransitions[comm.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Không thể chuyển từ ' + comm.status + ' sang ' + status + '. Cho phép: ' + (allowed.join(', ') || 'không có'),
      });
    }

    const updated = await prisma.commission.update({
      where: { id: req.params.id },
      data: { status },
    });
    console.log('[COMMISSION STATUS]', comm.id, comm.status, '→', status, 'by', req.user.fullName);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[COMMISSION STATUS]', err.message);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

/**
 * PUT /api/admin/commissions/bulk-approve
 * Admin — bulk approve all PENDING commissions (optionally by periodId)
 */
app.put('/api/admin/commissions/bulk-approve', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'accountant') {
      return res.status(403).json({ success: false, message: 'Không có quyền.' });
    }
    const { periodId } = req.body;
    const where = { status: 'PENDING' };
    if (periodId) where.periodId = periodId;

    const result = await prisma.commission.updateMany({
      where,
      data: { status: 'APPROVED' },
    });
    console.log('[BULK APPROVE]', result.count, 'commissions approved', periodId ? 'for period ' + periodId : '(all)');
    res.json({ success: true, count: result.count });
  } catch (err) {
    console.error('[BULK APPROVE]', err.message);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

/**
 * PUT /api/admin/commissions/bulk-pay
 * Admin — bulk pay all APPROVED commissions (optionally by periodId)
 */
app.put('/api/admin/commissions/bulk-pay', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'accountant') {
      return res.status(403).json({ success: false, message: 'Không có quyền.' });
    }
    const { periodId } = req.body;
    const where = { status: 'APPROVED' };
    if (periodId) where.periodId = periodId;

    const result = await prisma.commission.updateMany({
      where,
      data: { status: 'PAID' },
    });
    console.log('[BULK PAY]', result.count, 'commissions paid', periodId ? 'for period ' + periodId : '(all)');
    res.json({ success: true, count: result.count });
  } catch (err) {
    console.error('[BULK PAY]', err.message);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
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
      where: { role: { in: ['admin', 'accountant'] } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: users.map(sanitizeUser) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── ADMIN CTV MANAGEMENT ─────────────────────────────────────────────────────

// GET /api/admin/ctv — CTV list with stats
app.get('/api/admin/ctv', authenticateToken, requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'ctv', isSystemParticipant: true },
      orderBy: { createdAt: 'desc' },
      include: {
        parent: { select: { userId: true, fullName: true } },
        customers: { where: { linkedUserId: null }, select: { id: true } },
        commissions: {
          where: { status: { in: ['PENDING', 'PAID'] } },
          select: { earnedMoney: true, earnedPoints: true, status: true, periodId: true }
        }
      }
    });

    const mapped = users.map(u => ({
      id: u.id,
      userId: u.userId,
      fullName: u.fullName,
      phone: u.phone,
      tier: u.tier,
      role: u.role,
      rank: u.rank,
      rankStatus: u.rankStatus,
      sPoints: u.sPoints,
      businessId: u.businessId,
      isSystemParticipant: u.isSystemParticipant,
      status: u.status,
      createdAt: u.createdAt,
      parentId: u.parentId,
      parent: u.parent ? `${u.parent.fullName} (${u.parent.userId})` : 'Trực tiếp Công ty',
      customerCount: u.customers.length,
      commissionCount: u.commissions.length,
      totalEarnedMoney: u.commissions.reduce((s, c) => s + (c.earnedMoney || 0), 0),
      totalEarnedPoints: u.commissions.reduce((s, c) => s + (c.earnedPoints || 0), 0),
      note: u.note,
    }));

    res.json({ success: true, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/ctv/:id — CTV detail: info + customers + orders + commissions
app.get('/api/admin/ctv/:id', authenticateToken, requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    const { id } = req.params; // userId (e.g. "S249") or internal cuid
    const user = await prisma.user.findFirst({
      where: { OR: [{ userId: id }, { id }] },
      include: {
        parent: { select: { userId: true, fullName: true, phone: true } },
        children: { select: { userId: true, fullName: true, phone: true, rank: true, tier: true } }
      }
    });

    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy CTV.' });

    // Customers directly registered by this CTV (exclude self-linked)
    const customers = await prisma.customer.findMany({
      where: { sourceCtvId: user.userId, linkedUserId: null },
      orderBy: { registeredAt: 'desc' },
      include: {
        sponsorUser: { select: { userId: true, fullName: true } }
      }
    });

    // Orders where this CTV was orderer OR customer belongs to this CTV
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { ordererUserId: user.id },
          { customer: { sourceCtvId: user.userId } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { fullName: true, phone: true } },
        orderer: { select: { userId: true, fullName: true } },
        items: {
          include: {
            service: { select: { name: true } },
            product: { select: { title: true, commissionPoints: true } }
          }
        },
        period: { select: { periodName: true, status: true } }
      }
    });

    // Commissions earned by this CTV
    const commissions = await prisma.commission.findMany({
      where: { receiverId: user.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true, totalAmount: true, createdAt: true,
            customer: { select: { fullName: true, phone: true } }
          }
        },
        period: { select: { periodName: true, status: true } }
      }
    });

    const ctvInfo = {
      id: user.id, userId: user.userId, fullName: user.fullName, phone: user.phone,
      tier: user.tier, rank: user.rank, rankStatus: user.rankStatus, sPoints: user.sPoints,
      businessId: user.businessId, isSystemParticipant: user.isSystemParticipant,
      status: user.status, createdAt: user.createdAt, note: user.note,
      parentId: user.parentId, parent: user.parent, directDownline: user.children
    };

    res.json({ success: true, data: { ctv: ctvInfo, customers, orders, commissions } });
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
        mustChangePassword: false /* AUTO-DISABLED: no frontend UI yet */
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
    // Orphan guard: check if service has order items before deleting
    const orderItemCount = await prisma.orderItem.count({ where: { serviceId: req.params.id } });
    if (orderItemCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa dịch vụ: đang có ${orderItemCount} đơn hàng liên quan. Hãy hủy đơn hàng trước.`
      });
    }
    // Check wholesale items
    const wholesaleCount = await prisma.wholesaleOrderItem.count({ where: { serviceId: req.params.id } });
    if (wholesaleCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa dịch vụ: đang có ${wholesaleCount} đơn sỉ liên quan.`
      });
    }
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
    // Orphan guard: check if product has order items before deleting
    const orderItemCount = await prisma.orderItem.count({ where: { productId: req.params.id } });
    if (orderItemCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa sản phẩm: đang có ${orderItemCount} đơn hàng liên quan. Hãy hủy đơn hàng trước.`
      });
    }
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
    priorRank,
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
        status: 'PAID',
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
        periodId: order.periodId || null, // Period Lifecycle: gắn commission với kỳ
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
  // BOSS RULE: SELF requires priorBusinessId (user had BID BEFORE this order).
  // Order that crosses 5000 CP threshold → promoted AFTER → NO SELF on that order.
  // Next order after promotion → SELF eligible.
  // SELF: only for orders PLACED AFTER user earned BID
  // If order was placed before BID was assigned → no SELF (regardless of approval order)
  // (orderPlacedBeforeBid moved into SELF block below for selfRecipient)
  const selfRecipient = qualifyingMember || orderer;
  const selfRecipientBID = priorBusinessId;
  const selfRecipientRankAchievedAt = selfRecipient ? selfRecipient.rankAchievedAt : null;
  const orderPlacedBeforeSelfBid = selfRecipientRankAchievedAt && order.createdAt < selfRecipientRankAchievedAt;
  if (isSelf && selfRecipient && selfRecipientBID && !orderPlacedBeforeSelfBid) {
    const effectiveRank = priorRank || orderer.rank;
    const rankPrefix = normalizeRankPrefix(effectiveRank);

    if (rankPrefix) {
      const selfRuleKey = rankPrefix + '_SELF_BUY';
      const selfRate = getPolicyRate(selfRuleKey);
      if (selfRate) {
        await createCommissionRecord({
          receiver: selfRecipient,
          role: 'SELF',
          ruleKey: selfRuleKey,
          rateSnapshot: selfRate,
          basePoints: orderTotalCP,
          type: 'SELF',
          metadata: { isSelf: true, rank: effectiveRank, orderedBy: orderer?.userId },
        });
      }
    }
  }

  // -------------------------------------------------------------
  // 2. DIRECT / SPLIT COMMISSION
  // -------------------------------------------------------------
  // DIRECT receiver = Customer.sponsorUserId (NEVER Orderer.sponsorUserId)
  // Only applies if directSponsor exists
  // DIRECT commission: sponsor gets commission when their downline buys
  // Applies to BOTH self-purchase AND customer-purchase
  // For self-purchase: directSponsor = customer.sponsorUser (same as orderer's sponsor)
  if (directSponsor) {
    const sponsorRank = directSponsor.rank || (directSponsor.role === 'ctv' ? 'AMBASSADOR' : null);
    const sponsorPrefix = normalizeRankPrefix(sponsorRank);
    if (sponsorPrefix) {
      // DIRECT COMMISSION
      // BOSS RULE (2026-09-18):
      // - Nếu tại thời điểm settlement đơn hiện tại A chưa có BID (kể cả đơn chạm/vượt 5.000 CP):
      //   F0 nhận DIRECT_NO_ID = 20% trên TOÀN BỘ CP của đơn hiện tại.
      //   Không split CP theo mốc 5.000, không có phần 10% cho phần vượt ngưỡng, không tạo type SPLIT.
      // - Nếu A đã có BID trước đơn hiện tại:
      //   F0 nhận DIRECT_WITH_ID = 10% trên TOÀN BỘ CP của đơn hiện tại.
      const hasId = Boolean(qualifyingMember && priorBusinessId);

      if (hasId) {
        // Customer / Member đã có Business ID trước đơn này -> DIRECT_WITH_ID (10%)
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
        // Customer / Member chưa có Business ID trước đơn này -> DIRECT_NO_ID (20%)
        // Áp dụng cho cả retail customer lẫn thành viên chạm/vượt ngưỡng 5.000 CP
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

  // -------------------------------------------------------------
  // 3. UPSTREAM COMMISSION (Depth-1 & Depth-2 via parentId chain)
  // -------------------------------------------------------------
  // F1 = direct parent của member trong sponsor tree (parentId)
  // F2 = parent của parent
  // Rules (boss đã chốt):
  //   Ambassador: không nhận F1/F2 upstream (không có policy key)
  //   Manager: F1 = MANAGER_F1_PURCHASE (10%), F2 = MANAGER_F2_PURCHASE (5%)
  //   Director: F1 = DIRECTOR_F1 (10%), F2 = DIRECTOR_F2 (5%)
  // Áp dụng cho MỌI trường hợp (tự mua hoặc bán cho khách)
  // KHÔNG skip sponsor chưa có businessId

  // For F1/F2: traverse upstream from the SPONSOR (not the buyer)
  // This prevents sponsor from getting BOTH DIRECT and F1
  // Self-buy: Buyer → Sponsor (DIRECT) → Sponsor's Parent (F1) → Sponsor's Grandparent (F2)
  // Customer: Buyer → Sponsor (DIRECT) → Sponsor's Parent (F1) → Sponsor's Grandparent (F2)
  const memberForUpstream = directSponsor || (isSelf ? orderer : qualifyingMember);

  // F1/F2 GATE: Only fire upstream commission when the buyer/member is
  // a system participant WITH Business ID AT TIME OF ORDER (pre-order state).
  // BOSS RULE: Order crossing threshold does NOT retroactively qualify for F1/F2.
  // Uses priorBusinessId and isParticipant from pre-order snapshot.
  if (memberForUpstream && memberForUpstream.parentId
      && isParticipant
      && priorBusinessId) {
    // --- Depth-1: parent trực tiếp của member ---
    const d1User = await tx.user.findUnique({ where: { userId: memberForUpstream.parentId } });

    if (d1User) {
      const d1Rank = d1User.rank || (d1User.role === 'ctv' ? 'AMBASSADOR' : null);
      const d1Prefix = normalizeRankPrefix(d1Rank);

      if (d1Prefix) {
        // Rule key cố định theo rank — không phụ thuộc isSelf
        let d1RuleKey = null;
        if (d1Prefix === 'DIRECTOR') d1RuleKey = 'DIRECTOR_F1';
        else if (d1Prefix === 'MANAGER') d1RuleKey = 'MANAGER_F1_PURCHASE';
        else if (d1Prefix === 'AMBASSADOR') d1RuleKey = 'AMBASSADOR_F1';
        // Boss approved: Ambassador F1=10%, F2=5% — DO NOT skip

        if (d1RuleKey) {
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
      }

      // --- Depth-2: parent của D1 ---
      if (d1User.parentId) {
        const d2User = await tx.user.findUnique({ where: { userId: d1User.parentId } });

        if (d2User) {
          const d2Rank = d2User.rank || (d2User.role === 'ctv' ? 'AMBASSADOR' : null);
          const d2Prefix = normalizeRankPrefix(d2Rank);

          if (d2Prefix) {
            let d2RuleKey = null;
            if (d2Prefix === 'DIRECTOR') d2RuleKey = 'DIRECTOR_F2';
            else if (d2Prefix === 'MANAGER') d2RuleKey = 'MANAGER_F2_PURCHASE';
            else if (d2Prefix === 'AMBASSADOR') d2RuleKey = 'AMBASSADOR_F2';
            // Boss approved: Ambassador F2=5% — DO NOT skip

            if (d2RuleKey) {
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
        }
      }

      // Depth-3+ không có commission theo spec
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
/**
 * reverseOrderSettlement — Reverse all effects of a completed settlement
 * Called when WebsiteOrder is CANCELLED after COMPLETED.
 * Reverses: QP, SP, commissions, rank (if applicable)
 */
async function reverseOrderSettlement(orderId, adminUser = {}) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { commissions: true, commissionProcessing: true, items: true },
  });
  if (!order) return { skipped: true, reason: 'Order not found' };

  // If no settlement was run, nothing to reverse
  if (!order.commissionProcessing) {
    return { skipped: true, reason: 'No settlement to reverse (order was cancelled before completion)' };
  }

  const result = { commissionsRevoked: 0, commissionsReversed: 0, pointsReversed: 0, rankRevoked: false };

  await prisma.$transaction(async (tx) => {
    // 1. Handle commissions
    for (const comm of order.commissions) {
      if (comm.status === 'PENDING' || comm.status === 'APPROVED') {
        await tx.commission.update({
          where: { id: comm.id },
          data: { status: 'REJECTED' }
        });
        result.commissionsRevoked++;
      } else if (comm.status === 'PAID') {
        // Create REVERSAL counter-record
        await tx.commission.create({
          data: {
            orderId: order.id,
            receiverId: comm.receiverId,
            amount: -comm.amount,
            type: 'REVERSAL',
            status: 'COMPLETED',
            rateSnapshot: comm.rateSnapshot,
            rankSnapshot: comm.rankSnapshot,
            basePoints: comm.basePoints ? -comm.basePoints : null,
            earnedPoints: comm.earnedPoints ? -comm.earnedPoints : null,
            earnedMoney: comm.earnedMoney ? -comm.earnedMoney : null,
            policyRef: comm.policyRef,
            ruleKey: 'REVERSAL_' + (comm.ruleKey || 'UNKNOWN'),
            role: comm.role,
            periodId: comm.periodId,
            metadata: JSON.stringify({ reversedCommissionId: comm.id, reason: 'ORDER_CANCELLED' }),
          }
        });
        result.commissionsReversed++;
      }
    }

    // 2. Reverse QP/SP via SPointTransaction
    const sptTxns = await tx.sPointTransaction.findMany({ where: { orderId } });
    for (const spt of sptTxns) {
      if (spt.type === 'EARN' && spt.points > 0) {
        // Create reversal transaction
        await tx.sPointTransaction.create({
          data: {
            userId: spt.userId,
            orderId: spt.orderId,
            points: -spt.points,
            type: 'REVERSAL',
            isQualifying: spt.isQualifying,
            snapshotBalance: 0, // will be recalculated
            policyVersion: spt.policyVersion,
          }
        });

        // Update user QP/SP
        const updateData = { sPoints: { decrement: spt.points } };
        if (spt.isQualifying) {
          updateData.qualifyingPoints = { decrement: spt.points };
        }
        await tx.user.updateMany({
          where: { userId: spt.userId },
          data: updateData,
        });
        result.pointsReversed += spt.points;

        // 3. Check if rank should be revoked (QP dropped below threshold)
        if (spt.isQualifying) {
          const user = await tx.user.findFirst({ where: { userId: spt.userId } });
          if (user && user.rank === 'AMBASSADOR' && user.qualifyingPoints < 5000) {
            // Revoke Ambassador rank + BID
            await tx.user.update({
              where: { id: user.id },
              data: {
                rank: null,
                rankStatus: null,
                businessId: null,
                rankAchievedAt: null,
                rankActivationMethod: null,
                rankActivatedBy: null,
              }
            });
            await tx.rankHistory.create({
              data: {
                userId: user.userId,
                fromRank: 'AMBASSADOR',
                toRank: null,
                reason: 'ORDER_CANCELLED_QP_BELOW_THRESHOLD',
                changedBy: 'SYSTEM',
              }
            });
            result.rankRevoked = true;
            console.log('[REVERSAL] Rank revoked for', user.userId, '— QP dropped to', user.qualifyingPoints);
          }
        }
      }
    }

    // 4. Update CommissionProcessing status
    await tx.commissionProcessing.update({
      where: { orderId },
      data: { status: 'REVERSED' }
    });

    // 5. Audit log
    await tx.customerAuditLog.create({
      data: {
        customerId: order.customerId,
        action: 'REVERSE_SETTLEMENT',
        details: JSON.stringify({
          orderId, ...result,
          reversedBy: adminUser.fullName || 'SYSTEM',
        }),
        userId: adminUser.id || 'SYSTEM',
      }
    });
  });

  return result;
}

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
        policyVersion: '1.0.0', // will be updated after policy load — kept for backward compat
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
    // buyerIsSelf = orderer IS the customer (same person, buying for themselves)
    const buyerIsSelf = !!(qualifyingMember && orderer && qualifyingMember.id === orderer.id);
    // customerIsCTV = the CUSTOMER (recipient) is a CTV participant with potential SELF eligibility
    // Used for SELF commission: CTV-A orders for CTV-B → CTV-B gets SELF
    const customerIsCTV = !!(qualifyingMember && qualifyingMember.isSystemParticipant);
    // Legacy compat: isSelf = customerIsCTV for SELF block usage
    const isSelf = customerIsCTV;

    let directSponsor = customer.sponsorUser || null;
    if (!directSponsor && customer.sponsorUserId) {
      directSponsor = await tx.user.findUnique({ where: { id: customer.sponsorUserId } });
    }
    // SAFETY: Prevent self-commission on SELF-BUY only (orderer = customer = sponsor)
    // When CTV sells to someone else (even another CTV), CTV IS the sponsor — correct
    // Only block when CTV buys for THEMSELVES and sponsor = themselves
    if (buyerIsSelf && directSponsor && orderer && directSponsor.id === orderer.id) {
      console.log('[SETTLEMENT] Blocked self-sponsor on SELF_BUY:', orderer.userId, '— set directSponsor to null');
      directSponsor = null;
    }

    // 3. S-Points & Qualifying Points
    const orderTotalCP = order.items.reduce((sum, item) => sum + Math.round(item.lineCommissionPts || 0), 0);
    let pointsAwarded = 0;
    let activated = false;
    let allocatedBusinessId = null;

    // Load Policy Configs — Period-aware (fallback to SystemPolicyConfig for legacy data)
    let configs, policyMap, policyVersion, policySetVersion;
    const orderPeriodId = order.periodId || null;

    if (orderPeriodId) {
      // NEW: Load from PeriodPolicyConfig for this period
      const periodConfigs = await tx.periodPolicyConfig.findMany({ where: { periodId: orderPeriodId } });
      configs = periodConfigs;
      policyMap = Object.fromEntries(periodConfigs.map(c => [c.key, c.value]));
      // Get period version from any config (they share the same version within a period)
      policySetVersion = periodConfigs.length > 0 ? periodConfigs[0].version : null;
      policyVersion = policySetVersion || '1.0.0';
    } else {
      // LEGACY FALLBACK: Use SystemPolicyConfig (backward compat for old orders)
      const sysConfigs = await tx.systemPolicyConfig.findMany();
      configs = sysConfigs;
      policyMap = Object.fromEntries(sysConfigs.map(c => [c.key, c.value]));
      policyVersion = policyMap['POLICY_VERSION'] || '1.0.0';
      policySetVersion = null;
    }

    const threshold = parseInt(policyMap['AMBASSADOR_THRESHOLD'] || '5000', 10);

    // Track qualifyingMember state BEFORE points awarded (for eligibility)
    // BOSS RULE: Commission eligibility = PRE-ORDER state, not POST-ORDER state.
    // Order crossing 5000 CP threshold does NOT retroactively qualify for SELF/F1/F2.
    let priorQP = 0;
    let priorBusinessId = null;
    let priorRank = null;
    let isParticipant = false;

    if (qualifyingMember) {
      const freshQM = await tx.user.findUnique({ where: { id: qualifyingMember.id } });
      if (freshQM) {
        priorQP = freshQM.qualifyingPoints || 0;
        priorBusinessId = freshQM.businessId || null;
        priorRank = freshQM.rank || null;
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

        await tx.businessIdSequence.upsert({
          where: { id: 1 },
          update: { nextVal: currentSeqVal + 1 },
          create: { id: 1, nextVal: currentSeqVal + 1 },
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

      if (activated) {
        try {
          await checkAndPromoteUplines(tx, currentUser.userId);
        } catch (promoErr) {
          console.error('[PROMOTION HOOK ERROR]', promoErr.message);
        }
      }
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
      priorRank,
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


// ============================================================
// OFFICIAL RANK PROMOTION RULES (5 F1 RULE)
// 1. AMBASSADOR -> MANAGER: 5 direct F1 with Business ID & rank AMBASSADOR
// 2. MANAGER -> DIRECTOR:    5 direct F1 with Business ID & rank MANAGER
// ============================================================
async function checkAndPromoteUplines(client, startUserId) {
  let currentUserId = startUserId;
  const promotions = [];
  const visited = new Set();

  while (currentUserId && !visited.has(currentUserId)) {
    visited.add(currentUserId);
    const user = await client.user.findUnique({ where: { userId: currentUserId } });
    if (!user || !user.parentId) break;

    const parent = await client.user.findUnique({ where: { userId: user.parentId } });
    if (!parent) break;

    const pRank = (parent.rank || '').toUpperCase();

    if (pRank === 'AMBASSADOR') {
      const qualifiedF1s = await client.user.findMany({
        where: {
          parentId: parent.userId,
          businessId: { not: null },
          rank: { in: ['AMBASSADOR', 'MANAGER', 'DIRECTOR', 'SALES_MANAGER', 'SALES_DIRECTOR'] },
          rankStatus: { in: ['ACTIVE_RANK', 'MANUAL_APPROVED'] }
        }
      });

      if (qualifiedF1s.length >= 5) {
        await client.user.update({
          where: { id: parent.id },
          data: {
            rank: 'MANAGER',
            rankStatus: 'ACTIVE_RANK',
            rankAchievedAt: new Date(),
            rankActivationMethod: 'AUTO_5_F1_AMBASSADOR',
            rankActivatedBy: 'SYSTEM'
          }
        });

        await client.rankHistory.create({
          data: {
            userId: parent.userId,
            fromRank: 'AMBASSADOR',
            toRank: 'MANAGER',
            fromStatus: parent.rankStatus || 'ACTIVE_RANK',
            toStatus: 'ACTIVE_RANK',
            reason: 'AUTO_5_F1_AMBASSADOR',
            triggeredBy: 'SYSTEM',
            metadata: JSON.stringify({
              f1Count: qualifiedF1s.length,
              f1List: qualifiedF1s.map(f => ({ userId: f.userId, businessId: f.businessId, rank: f.rank })),
              promotedAt: new Date().toISOString()
            })
          }
        });

        console.log(`[PROMOTION] User ${parent.userId} (${parent.fullName}) promoted AMBASSADOR -> MANAGER (${qualifiedF1s.length} F1 Ambassadors)`);
        promotions.push({ userId: parent.userId, from: 'AMBASSADOR', to: 'MANAGER' });
      }
    } else if (pRank === 'MANAGER' || pRank === 'SALES_MANAGER') {
      const qualifiedF1s = await client.user.findMany({
        where: {
          parentId: parent.userId,
          businessId: { not: null },
          rank: { in: ['MANAGER', 'DIRECTOR', 'SALES_MANAGER', 'SALES_DIRECTOR'] },
          rankStatus: { in: ['ACTIVE_RANK', 'MANUAL_APPROVED'] }
        }
      });

      if (qualifiedF1s.length >= 5) {
        await client.user.update({
          where: { id: parent.id },
          data: {
            rank: 'DIRECTOR',
            rankStatus: 'ACTIVE_RANK',
            rankAchievedAt: new Date(),
            rankActivationMethod: 'AUTO_5_F1_MANAGER',
            rankActivatedBy: 'SYSTEM'
          }
        });

        await client.rankHistory.create({
          data: {
            userId: parent.userId,
            fromRank: parent.rank,
            toRank: 'DIRECTOR',
            fromStatus: parent.rankStatus || 'ACTIVE_RANK',
            toStatus: 'ACTIVE_RANK',
            reason: 'AUTO_5_F1_MANAGER',
            triggeredBy: 'SYSTEM',
            metadata: JSON.stringify({
              f1Count: qualifiedF1s.length,
              f1List: qualifiedF1s.map(f => ({ userId: f.userId, businessId: f.businessId, rank: f.rank })),
              promotedAt: new Date().toISOString()
            })
          }
        });

        console.log(`[PROMOTION] User ${parent.userId} (${parent.fullName}) promoted MANAGER -> DIRECTOR (${qualifiedF1s.length} F1 Managers)`);
        promotions.push({ userId: parent.userId, from: parent.rank, to: 'DIRECTOR' });
      }
    }

    currentUserId = parent.userId;
  }

  return promotions;
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
    await checkAndPromoteUplines(prisma, userId);
  } catch (e) {
    console.error('[AMBASSADOR AUTO ERROR]', e.message);
  }
}

// ============================================================
// PHASE 2B — AMBASSADOR RANK MANAGEMENT ENDPOINTS
// ============================================================


/** GET /api/rank/promotion-progress/:userId — Get progress to next rank (5 F1 rule) */
app.get('/api/rank/promotion-progress/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { userId: userId },
          { id: userId }
        ]
      }
    });
    if (!user) return res.status(404).json({ success: false, message: 'User không tồn tại.' });

    if (req.user.role !== 'admin' && req.user.id !== user.userId) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập.' });
    }

    const rank = (user.rank || 'CUSTOMER').toUpperCase();
    const threshold = 5000;

    if (rank === 'CUSTOMER' || !user.rank) {
      const qp = Math.round(user.qualifyingPoints || 0);
      return res.json({
        success: true,
        data: {
          currentRank: 'CUSTOMER',
          nextRank: 'AMBASSADOR',
          progress: Math.min(100, Math.round((qp / threshold) * 100)),
          current: qp,
          target: threshold,
          unit: 'CP',
          description: `Tích lũy tối thiểu ${threshold.toLocaleString('vi-VN')} CP để đạt chuẩn Đại Sứ`
        }
      });
    }

    if (rank === 'AMBASSADOR') {
      const f1Ambassadors = await prisma.user.findMany({
        where: {
          parentId: user.userId,
          businessId: { not: null },
          rank: { in: ['AMBASSADOR', 'MANAGER', 'DIRECTOR', 'SALES_MANAGER', 'SALES_DIRECTOR'] },
          rankStatus: { in: ['ACTIVE_RANK', 'MANUAL_APPROVED'] }
        },
        select: { userId: true, fullName: true, phone: true, businessId: true, rank: true, rankAchievedAt: true }
      });

      const count = f1Ambassadors.length;
      const target = 5;
      return res.json({
        success: true,
        data: {
          currentRank: 'AMBASSADOR',
          nextRank: 'MANAGER',
          progress: Math.min(100, Math.round((count / target) * 100)),
          current: count,
          target: target,
          unit: 'F1 Đại sứ',
          f1List: f1Ambassadors,
          description: 'Cần đủ 5 thành viên F1 trực tiếp đạt cấp Đại sứ (có Business ID) để tự động lên Trưởng nhóm'
        }
      });
    }

    if (rank === 'MANAGER' || rank === 'SALES_MANAGER') {
      const f1Managers = await prisma.user.findMany({
        where: {
          parentId: user.userId,
          businessId: { not: null },
          rank: { in: ['MANAGER', 'DIRECTOR', 'SALES_MANAGER', 'SALES_DIRECTOR'] },
          rankStatus: { in: ['ACTIVE_RANK', 'MANUAL_APPROVED'] }
        },
        select: { userId: true, fullName: true, phone: true, businessId: true, rank: true, rankAchievedAt: true }
      });

      const count = f1Managers.length;
      const target = 5;
      return res.json({
        success: true,
        data: {
          currentRank: 'MANAGER',
          nextRank: 'DIRECTOR',
          progress: Math.min(100, Math.round((count / target) * 100)),
          current: count,
          target: target,
          unit: 'F1 Trưởng nhóm',
          f1List: f1Managers,
          description: 'Cần đủ 5 thành viên F1 trực tiếp đạt cấp Trưởng nhóm (có Business ID) để tự động lên Quản lý'
        }
      });
    }

    if (rank === 'DIRECTOR' || rank === 'SALES_DIRECTOR') {
      return res.json({
        success: true,
        data: {
          currentRank: 'DIRECTOR',
          nextRank: null,
          isMaxRank: true,
          progress: 100,
          current: 5,
          target: 5,
          unit: '',
          description: 'Bạn đã đạt cấp bậc cao nhất: Quản lý 👑'
        }
      });
    }

    return res.json({ success: true, data: { currentRank: rank, nextRank: null } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/** POST /api/rank/sync-all — Admin scan and promote all eligible users */
app.post('/api/rank/sync-all', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const allUsers = await prisma.user.findMany({
      where: { role: 'ctv' },
      select: { userId: true, rank: true, parentId: true }
    });

    let totalPromotions = [];
    for (const u of allUsers) {
      if (u.parentId) {
        const promos = await checkAndPromoteUplines(prisma, u.userId);
        if (promos.length > 0) totalPromotions.push(...promos);
      }
    }

    res.json({ success: true, count: totalPromotions.length, promotions: totalPromotions });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

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
    await checkAndPromoteUplines(prisma, targetId);
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


// ============================================================
// PHASE 3 — WEBSITE ORDER UNIFIED FLOW
// wasypro.com orders link to User identity when logged in
// ============================================================

/**
/**
 * GET /api/admin/website-orders
 * Admin/Accountant — returns all website orders
 */
app.get('/api/admin/website-orders', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'accountant') {
      return res.status(403).json({ success: false, message: 'Chỉ admin/kế toán mới có quyền xem.' });
    }
    const orders = await prisma.websiteOrder.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error('[ADMIN WEBSITE ORDERS]', err.message);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

/**
 * PUT /api/admin/website-orders/:id/status
 * Admin — update website order status + sync shadow Order + trigger settlement/reversal
 * WebsiteOrder is SOURCE OF TRUTH for order lifecycle.
 */
app.put('/api/admin/website-orders/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'accountant') {
      return res.status(403).json({ success: false, message: 'Không có quyền.' });
    }
    const { status } = req.body;
    const validStatuses = ['NEW', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ.' });
    }

    // 1. Get current WebsiteOrder
    const wo = await prisma.websiteOrder.findUnique({ where: { id: req.params.id } });
    if (!wo) return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại.' });

    // Prevent re-cancelling or re-completing
    if (wo.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Đơn hàng đã bị hủy, không thể thay đổi trạng thái.' });
    }

    // 2. Update WebsiteOrder status
    const updated = await prisma.websiteOrder.update({
      where: { id: req.params.id },
      data: { status },
    });

    // 3. Sync to shadow Order (if exists)
    let settlementResult = null;
    let reversalResult = null;

    if (wo.shadowOrderId) {
      await prisma.order.update({
        where: { id: wo.shadowOrderId },
        data: { status: status === 'CANCELLED' ? 'CANCELLED' : (status === 'COMPLETED' ? 'COMPLETED' : status) },
      });
      console.log('[ORDER SYNC] WebsiteOrder', wo.id, '→ Shadow Order', wo.shadowOrderId, '= status:', status);

      // 4. On COMPLETED → run settlement (QP + SP + Commission PENDING)
      if (status === 'COMPLETED') {
        try {
          settlementResult = await executeOrderSettlement(wo.shadowOrderId);
          console.log('[ORDER LIFECYCLE] Settlement triggered for shadow', wo.shadowOrderId,
            '→', settlementResult?.createdCommissions?.length || 0, 'commissions');
        } catch (settleErr) {
          console.error('[ORDER LIFECYCLE] Settlement error:', settleErr.message);
        }
      }

      // 5. On CANCELLED → reverse settlement if already completed
      if (status === 'CANCELLED') {
        try {
          reversalResult = await reverseOrderSettlement(wo.shadowOrderId, req.user);
          console.log('[ORDER LIFECYCLE] Reversal for shadow', wo.shadowOrderId, '→', JSON.stringify(reversalResult));
        } catch (revErr) {
          console.error('[ORDER LIFECYCLE] Reversal error:', revErr.message);
        }
      }
    }

    res.json({
      success: true,
      data: updated,
      settlement: settlementResult ? { commissions: settlementResult.createdCommissions?.length || 0, pointsAwarded: settlementResult.pointsAwarded } : null,
      reversal: reversalResult || null,
    });
  } catch (err) {
    console.error('[UPDATE WEBSITE ORDER]', err.message);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

/**
 * POST /api/orders/website
 * Public (guest) OR authenticated (user).
 * - Guest: saves customerName + customerPhone (text), no userId
 * - Auth: saves userId, sponsorUserId from user.parentId, commissionPoints from Product
 * - If user.isSystemParticipant → increments qualifyingPoints + checks 5000 CP threshold
 */
app.post('/api/orders/website', async (req, res) => {
  try {
    const { customerName, customerPhone, address, shippingAddress, recipientPhone, recipientEmail, contactHotline, message, type, productId, productTitle, productPrice, qty, refCode } = req.body;
    if (!customerPhone && !recipientPhone) return res.status(400).json({ success: false, message: 'Vui lòng nhập số điện thoại.' });

    const finalAddress = (shippingAddress || address || '').trim();
    const finalPhone = (recipientPhone || customerPhone || '').trim();
    const finalEmail = (recipientEmail || '').trim() || null;
    const finalHotline = (contactHotline || '').trim() || null;

    // Try to identify authenticated user from JWT cookie (optional — not required)
    let authedUser = null;
    try {
      const token = req.cookies?.auth_token;
      if (token) {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here');
        authedUser = await prisma.user.findUnique({ where: { userId: decoded.userId } });
      }
    } catch (_) { /* guest order */ }

    // Resolve product and commission points
    let cpSnapshot = 0;
    let resolvedProductTitle = productTitle || null;
    if (productId) {
      const prod = await prisma.product.findUnique({ where: { id: productId } });
      if (prod) {
        cpSnapshot = prod.commissionPoints || 0;
        resolvedProductTitle = resolvedProductTitle || prod.title;
      }
    }

    // Resolve sponsor
    let sponsorUserId = null;
    if (authedUser) {
      sponsorUserId = authedUser.parentId || null; // parent in sponsor tree
    } else if (refCode) {
      const sponsor = await prisma.user.findUnique({ where: { userId: refCode.trim() } });
      if (sponsor) sponsorUserId = sponsor.userId;
    }

    const totalAmount = (productPrice || 0) * (qty || 1);

    const websiteOrder = await prisma.websiteOrder.create({
      data: {
        customerName: customerName || (authedUser?.fullName) || 'Khách',
        customerPhone: finalPhone,
        address: finalAddress,
        shippingAddress: finalAddress,
        recipientPhone: finalPhone,
        recipientEmail: finalEmail,
        contactHotline: finalHotline,
        message: message || '',
        type: type || 'ORDER',
        productId: productId || null,
        productTitle: resolvedProductTitle,
        productPrice: productPrice || 0,
        qty: qty || 1,
        totalAmount,
        userId: authedUser ? authedUser.userId : null,
        sponsorUserId,
        commissionPoints: cpSnapshot,
        qualifyingPointsAwarded: false,
        isCtvOrder: !!(authedUser && authedUser.isSystemParticipant),
      }
    });

    // [REMOVED] Duplicate qualifying points + auto-promote block.
    // Settlement (executeOrderSettlement) handles points, threshold check, BID issuance,
    // and rank promotion inside the commission bridge transaction.
    // Removing prevents: (a) double qualifying points, (b) retroactive promotion before
    // commission calculation.
    // BOSS RULE: Commission eligibility = PRE-ORDER state.

    // ─── COMMISSION BRIDGE: WebsiteOrder → Commission Engine ───
    // Fires for ANY authenticated user with a valid sponsor and product with CP.
    // Commission classification is handled by the canonical engine:
    //   - Non-participant buyer → DIRECT commission to sponsor
    //   - CTV participant buyer → SELF + F1/F2 upstream
    //   - Guest / no sponsor → no bridge
    // Bridge fires if: (1) has sponsor → DIRECT/F1/F2, OR (2) is CTV → SELF
    if (authedUser && (sponsorUserId || authedUser.isSystemParticipant) && cpSnapshot > 0) {
      try {
        // 1. Find or create Customer record for this user
        let customer = await prisma.customer.findFirst({
          where: { linkedUserId: authedUser.id }
        });
        
        if (!customer) {
          // Resolve sponsor for Customer creation (may be null for top-level CTV)
          let sponsorUser = null;
          if (sponsorUserId) {
            sponsorUser = await prisma.user.findFirst({
              where: { OR: [{ id: sponsorUserId }, { userId: sponsorUserId }] }
            });
          }
          const sourceCtvUserId = sponsorUser?.userId || authedUser.userId;
          
          // Try to find existing Customer by phone+sourceCtvId (created by CTV, not yet linked)
          const existingByPhone = await prisma.customer.findFirst({
            where: { phone: authedUser.phone, sourceCtvId: sourceCtvUserId }
          });
          if (existingByPhone) {
            // Link existing Customer record to this user
            customer = await prisma.customer.update({
              where: { id: existingByPhone.id },
              data: { linkedUserId: authedUser.id, sponsorUserId: sponsorUser?.id || existingByPhone.sponsorUserId }
            });
            console.log('[COMMISSION BRIDGE] Linked existing Customer', customer.id, 'to', authedUser.userId);
          }
        }
        
        if (!customer) {
          let sponsorUser2 = null;
          if (sponsorUserId) {
            sponsorUser2 = await prisma.user.findFirst({
              where: { OR: [{ id: sponsorUserId }, { userId: sponsorUserId }] }
            });
          }
          const sourceCtvUserId2 = sponsorUser2?.userId || authedUser.userId;
          
          customer = await prisma.customer.create({
            data: {
              fullName: authedUser.fullName || customerName || 'Khách',
              phone: authedUser.phone || customerPhone,
              sourceCtvId: sourceCtvUserId2,
              sponsorUserId: sponsorUser2?.id || null,
              linkedUserId: authedUser.id,
              status: 'ARRIVED',
              expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            }
          });
          console.log('[COMMISSION BRIDGE] Created Customer', customer.id, 'for', authedUser.userId, 'sponsor:', sourceCtvUserId2);
        }

        // 2. Resolve product for order item
        const prod = productId ? await prisma.product.findUnique({ where: { id: productId } }) : null;
        const itemPrice = prod ? prod.price : (productPrice || 0);
        const itemCP = prod ? (prod.commissionPoints || 0) : cpSnapshot;
        const itemQty = qty || 1;

        // 3. Get current OPEN period
        const openPeriod = await prisma.commissionPeriod.findFirst({
          where: { status: 'OPEN' },
          orderBy: { createdAt: 'desc' }
        });

        // 4. Create shadow Order (mirrors WebsiteOrder for commission engine)
        // Status starts as NEW — settlement only runs when WebsiteOrder reaches COMPLETED
        const shadowOrder = await prisma.order.create({
          data: {
            customerId: customer.id,
            totalAmount: itemPrice * itemQty,
            status: 'NEW',
            orderType: 'RETAIL',
            isSelfBuy: !!(authedUser.isSystemParticipant && customer.linkedUserId && customer.linkedUserId === authedUser.id),
            purchaseType: (authedUser.isSystemParticipant && customer.linkedUserId && customer.linkedUserId === authedUser.id) ? 'SELF_PURCHASE' : 'CUSTOMER_PURCHASE',
            ordererUserId: authedUser.id,
            periodId: openPeriod?.id || null,
            shippingAddress: finalAddress || null,
            recipientPhone: finalPhone || null,
            recipientEmail: finalEmail || null,
            contactHotline: finalHotline || null,
            items: {
              create: [{
                productId: productId || null,
                amount: itemPrice * itemQty,
                qty: itemQty,
                unitCommissionPts: itemCP,
                lineCommissionPts: itemCP * itemQty,
              }]
            }
          }
        });
        console.log('[COMMISSION BRIDGE] Shadow Order', shadowOrder.id, 'for WebsiteOrder', websiteOrder.id);

        // 4b. Link shadow Order to WebsiteOrder + classify as CTV if participant
        await prisma.websiteOrder.update({
          where: { id: websiteOrder.id },
          data: {
            shadowOrderId: shadowOrder.id,
            isCtvOrder: !!authedUser.isSystemParticipant,
          }
        });

        // 5. Settlement DEFERRED — will run when admin marks WebsiteOrder as COMPLETED
        // executeOrderSettlement is NOT called here anymore
        console.log('[COMMISSION BRIDGE] Shadow Order created (status=NEW). Settlement deferred until COMPLETED.');
      } catch (bridgeErr) {
        // Non-fatal: commission failure should not block order
        console.error('[COMMISSION BRIDGE ERROR]', bridgeErr.message);
      }
    }

    console.log(`[WEBSITE ORDER] ${websiteOrder.customerName} (${websiteOrder.customerPhone}) userId=${authedUser?.userId || 'guest'} product=${resolvedProductTitle} total=${totalAmount}`);
    res.status(201).json({ success: true, order: { id: websiteOrder.id, status: websiteOrder.status } });
  } catch (err) {
    console.error('[WEBSITE ORDER]', err.message);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ. Vui lòng thử lại.' });
  }
});

/**
 * GET /api/orders/my
 * Authenticated — returns logged-in user's WebsiteOrders + CTV Orders
 */
app.get('/api/orders/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Admin/Accountant: return ALL orders in the system
    const isAdminRole = user.role === 'admin' || user.role === 'accountant';
    
    let websiteOrders, ctvOrders;
    
    if (isAdminRole) {
      // Admin sees everything
      websiteOrders = await prisma.websiteOrder.findMany({
        orderBy: { createdAt: 'desc' },
      });
      ctvOrders = await prisma.order.findMany({
        include: {
          items: { include: { product: true } },
          customer: true,
          orderer: { select: { userId: true, fullName: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Regular user: search by userId OR by phone (for guest orders placed before login)
      const userPhone = user.phone || user.username || '';
      const websiteOrdersById = await prisma.websiteOrder.findMany({
        where: { userId, isCtvOrder: false },
        orderBy: { createdAt: 'desc' },
      });
      
      // Also find orders placed as guest with same phone
      const websiteOrdersByPhone = userPhone ? await prisma.websiteOrder.findMany({
        where: { 
          customerPhone: userPhone,
          userId: null,  // only guest orders not already linked
        },
        orderBy: { createdAt: 'desc' },
      }) : [];
      
      // Merge and deduplicate
      const seenIds = new Set(websiteOrdersById.map(o => o.id));
      websiteOrders = [...websiteOrdersById];
      for (const wo of websiteOrdersByPhone) {
        if (!seenIds.has(wo.id)) {
          websiteOrders.push(wo);
          seenIds.add(wo.id);
          // Auto-link this guest order to the user for future queries
          await prisma.websiteOrder.update({
            where: { id: wo.id },
            data: { userId: userId }
          }).catch(() => {}); // non-critical
        }
      }
      
      // Sort combined by date
      websiteOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // CTV orders: all orders where user is orderer (CTV Portal + Website shadow orders)
      // Only include orders created after user joined CTV (participantAt)
      if (user.isSystemParticipant && user.participantAt) {
        ctvOrders = await prisma.order.findMany({
          where: {
            OR: [
              { ordererUserId: user.id },
              { customer: { linkedUserId: user.id } },
            ],
            createdAt: { gte: user.participantAt },
          },
          include: {
            items: { include: { product: true } },
            customer: true,
          },
          orderBy: { createdAt: 'desc' },
        });
      } else if (user.isSystemParticipant) {
        // Participant without participantAt (edge case) — show all orders
        ctvOrders = await prisma.order.findMany({
          where: { OR: [{ ordererUserId: user.id }, { customer: { linkedUserId: user.id } }] },
          include: {
            items: { include: { product: true } },
            customer: true,
          },
          orderBy: { createdAt: 'desc' },
        });
      } else {
        ctvOrders = [];
      }
    }

    res.json({
      success: true,
      data: {
        websiteOrders,
        ctvOrders,
        user: {
          userId: user.userId,
          fullName: user.fullName,
          isSystemParticipant: user.isSystemParticipant,
          participantAt: user.participantAt,
          qualifyingPoints: user.qualifyingPoints,
          sPoints: user.sPoints,
          businessId: user.businessId,
          rank: user.rank,
          rankStatus: user.rankStatus,
        }
      }
    });
  } catch (err) {
    console.error('[MY ORDERS]', err.message);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
});

// Export app with attached helper functions for testing and backwards compatibility
app.executeOrderSettlement = executeOrderSettlement;
app.calculateAndCreateCommissions = calculateAndCreateCommissions;
app.processOrderPointsAndActivation = processOrderPointsAndActivation;
app.normalizeRankPrefix = normalizeRankPrefix;

// ─── Phase 3.2: NPP Package Admin CRUD APIs ─────────────────────────────────

// BigInt safe serializer for API responses (NO global prototype mutation)
function serializeBigInt(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') {
    // Safe range check: Number.MAX_SAFE_INTEGER = 9007199254740991
    if (obj >= -9007199254740991n && obj <= 9007199254740991n) {
      return Number(obj);
    }
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }
  if (typeof obj === 'object' && obj instanceof Date) {
    return obj;
  }
  if (typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigInt(value);
    }
    return result;
  }
  return obj;
}

// Valid rank enums for NPP packages
const NPP_VALID_RANKS = ['AMBASSADOR', 'MANAGER', 'DIRECTOR'];

// Phase 3.2.1: Money safety helper
function floatPriceToBigInt(price) {
  if (typeof price !== 'number' || !Number.isFinite(price)) {
    throw new Error('Invalid price value: ' + price + '. Must be a finite number.');
  }
  const rounded = Math.round(price);
  if (Math.abs(price - rounded) > 0.01) {
    throw new Error('Product price ' + price + ' has fractional VND. Cannot convert to BigInt.');
  }
  return BigInt(rounded);
}

const NPP_RANK_ORDER = { AMBASSADOR: 1, MANAGER: 2, DIRECTOR: 3 };
const NPP_VALID_PACKAGE_TYPES = ['CAPITAL', 'PRODUCT_COMBO'];

function validateNppRankChange(currentRank, newRank) {
  if (!currentRank) return { allowed: true };
  const current = NPP_RANK_ORDER[currentRank];
  const target = NPP_RANK_ORDER[newRank];
  if (!current || !target) return { allowed: false, error: 'Rank không hợp lệ: ' + (currentRank || 'null') + ' hoặc ' + (newRank || 'null') };
  if (target < current) return { allowed: false, error: 'Không cho phép hạ rank từ ' + currentRank + ' xuống ' + newRank };
  if (target === current) return { allowed: true, sameRank: true };
  return { allowed: true };
}

// ── GET /api/admin/npp/packages — List all packages ──────────────────────────
app.get('/api/admin/npp/packages', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const packages = await prisma.nppPackage.findMany({
      include: {
        items: {
          include: {
            product: { select: { id: true, slug: true, title: true, price: true, image: true } }
          }
        },
        _count: { select: { purchases: true, registrations: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: serializeBigInt(packages) });
  } catch (error) {
    console.error('Error listing NPP packages:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ── GET /api/admin/npp/packages/:id — Package detail ─────────────────────────
app.get('/api/admin/npp/packages/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const pkg = await prisma.nppPackage.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          include: {
            product: { select: { id: true, slug: true, title: true, price: true, image: true, stock: true } }
          }
        },
        _count: { select: { purchases: true, registrations: true } }
      }
    });
    if (!pkg) {
      return res.status(404).json({ error: 'Không tìm thấy gói NPP' });
    }
    res.json({ success: true, data: serializeBigInt(pkg) });
  } catch (error) {
    console.error('Error getting NPP package:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});


// ── POST /api/admin/npp/packages — Create package (Phase 3.2.1: PackageType) ─
app.post('/api/admin/npp/packages', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { code, name, description, grossPrice, defaultDiscount, assignedRank, isActive, items, packageType, requiredQuantity } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Mã gói (code) là bắt buộc' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tên gói (name) là bắt buộc' });
    }

    // PackageType validation
    const pkgType = packageType || 'PRODUCT_COMBO';
    if (!NPP_VALID_PACKAGE_TYPES.includes(pkgType)) {
      return res.status(400).json({ error: 'packageType phải là CAPITAL hoặc PRODUCT_COMBO' });
    }

    let grossPriceBigInt = null;
    const discount = defaultDiscount !== undefined ? Number(defaultDiscount) : 0;

    if (pkgType === 'CAPITAL') {
      // CAPITAL: grossPrice required, no items, no requiredQuantity, discount forced 0
      if (grossPrice === undefined || grossPrice === null || grossPrice === '') {
        return res.status(400).json({ error: 'Gói CAPITAL phải có giá cố định (grossPrice)' });
      }
      try {
        grossPriceBigInt = BigInt(grossPrice);
      } catch (e) {
        return res.status(400).json({ error: 'grossPrice phải là số nguyên hợp lệ' });
      }
      if (grossPriceBigInt <= 0n) {
        return res.status(400).json({ error: 'grossPrice phải lớn hơn 0' });
      }
      if (items && items.length > 0) {
        return res.status(400).json({ error: 'Gói CAPITAL không được có sản phẩm (items)' });
      }
      if (requiredQuantity) {
        return res.status(400).json({ error: 'Gói CAPITAL không có requiredQuantity' });
      }
    } else {
      // PRODUCT_COMBO: grossPrice null, requiredQuantity required, discount valid
      if (grossPrice !== undefined && grossPrice !== null && grossPrice !== '' && grossPrice !== '0' && grossPrice !== 0) {
        return res.status(400).json({ error: 'Gói PRODUCT_COMBO không có giá cố định. Giá tính từ sản phẩm khi mua.' });
      }
      if (!requiredQuantity || parseInt(requiredQuantity) < 1) {
        return res.status(400).json({ error: 'Gói PRODUCT_COMBO phải có số lượng máy yêu cầu (requiredQuantity >= 1)' });
      }
      if (!Number.isInteger(discount) || discount < 0 || discount > 10000) {
        return res.status(400).json({ error: 'Chiết khấu phải từ 0 đến 10000 (basis points, 0-100%)' });
      }
    }

    // Rank validation
    const rank = assignedRank || 'AMBASSADOR';
    if (!NPP_VALID_RANKS.includes(rank)) {
      return res.status(400).json({ error: `assignedRank phải là một trong: ${NPP_VALID_RANKS.join(', ')}` });
    }

    // Code uniqueness
    const existingCode = await prisma.nppPackage.findUnique({ where: { code: code.trim() } });
    if (existingCode) {
      return res.status(400).json({ error: 'Mã gói đã tồn tại' });
    }

    // Validate items if provided (optional for both types)
    let itemsCreate = undefined;
    if (items && Array.isArray(items) && items.length > 0) {
      const productIds = items.map(i => i.productId).filter(Boolean);
      const uniqueProductIds = new Set(productIds);
      if (uniqueProductIds.size !== productIds.length) {
        return res.status(400).json({ error: 'Không được có sản phẩm trùng lặp trong gói' });
      }
      const products = await prisma.product.findMany({
        where: { id: { in: Array.from(uniqueProductIds) } },
        select: { id: true }
      });
      const foundProductIds = new Set(products.map(p => p.id));
      for (const pid of uniqueProductIds) {
        if (!foundProductIds.has(pid)) {
          return res.status(400).json({ error: `Sản phẩm không tồn tại: ${pid}` });
        }
      }
      itemsCreate = {
        create: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity !== undefined ? Number(item.quantity) : 1,
          note: item.note || null
        }))
      };
    }

    const result = await prisma.nppPackage.create({
      data: {
        code: code.trim(),
        name: name.trim(),
        description: description || null,
        grossPrice: grossPriceBigInt,
        defaultDiscount: pkgType === 'CAPITAL' ? 0 : discount,
        assignedRank: rank,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        packageType: pkgType,
        requiredQuantity: pkgType === 'PRODUCT_COMBO' ? parseInt(requiredQuantity) : null,
        ...(itemsCreate ? { items: itemsCreate } : {}),
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, slug: true, title: true, price: true, image: true } }
          }
        }
      }
    });

    res.json({ success: true, message: 'Tạo gói NPP thành công', data: serializeBigInt(result) });
  } catch (error) {
    console.error('Error creating NPP package:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ── PUT /api/admin/npp/packages/:id — Update package (Phase 3.2.1) ───────────
app.put('/api/admin/npp/packages/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.nppPackage.findUnique({
      where: { id },
      include: { _count: { select: { purchases: true } } }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy gói NPP' });
    }

    const updateData = {};
    const { code, name, description, grossPrice, defaultDiscount, assignedRank, isActive, items, packageType, requiredQuantity } = req.body;

    // Determine effective packageType
    const effectiveType = packageType || existing.packageType || 'PRODUCT_COMBO';
    if (packageType && !NPP_VALID_PACKAGE_TYPES.includes(packageType)) {
      return res.status(400).json({ error: 'packageType phải là CAPITAL hoặc PRODUCT_COMBO' });
    }
    if (packageType) updateData.packageType = packageType;

    if (code !== undefined) {
      if (!code.trim()) return res.status(400).json({ error: 'Mã gói không được rỗng' });
      if (code.trim() !== existing.code) {
        const dup = await prisma.nppPackage.findUnique({ where: { code: code.trim() } });
        if (dup) return res.status(400).json({ error: 'Mã gói đã tồn tại' });
      }
      updateData.code = code.trim();
    }
    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ error: 'Tên gói không được rỗng' });
      updateData.name = name.trim();
    }
    if (description !== undefined) updateData.description = description || null;

    // grossPrice handling based on effective type
    if (effectiveType === 'CAPITAL') {
      if (grossPrice !== undefined) {
        try {
          const gp = BigInt(grossPrice);
          if (gp <= 0n) return res.status(400).json({ error: 'grossPrice phải lớn hơn 0' });
          updateData.grossPrice = gp;
        } catch (e) {
          return res.status(400).json({ error: 'grossPrice phải là số nguyên hợp lệ' });
        }
      }
      updateData.requiredQuantity = null;
      if (defaultDiscount !== undefined) updateData.defaultDiscount = 0;
    } else {
      // PRODUCT_COMBO
      updateData.grossPrice = null;
      if (requiredQuantity !== undefined) {
        const rq = parseInt(requiredQuantity);
        if (!rq || rq < 1) return res.status(400).json({ error: 'requiredQuantity phải >= 1' });
        updateData.requiredQuantity = rq;
      }
      if (defaultDiscount !== undefined) {
        const disc = Number(defaultDiscount);
        if (!Number.isInteger(disc) || disc < 0 || disc > 10000) {
          return res.status(400).json({ error: 'Chiết khấu phải từ 0 đến 10000 BPS' });
        }
        updateData.defaultDiscount = disc;
      }
    }

    if (assignedRank !== undefined) {
      if (!NPP_VALID_RANKS.includes(assignedRank)) {
        return res.status(400).json({ error: `assignedRank phải là một trong: ${NPP_VALID_RANKS.join(', ')}` });
      }
      updateData.assignedRank = assignedRank;
    }
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    // Items update (replace all)
    if (items !== undefined) {
      if (effectiveType === 'CAPITAL' && items && items.length > 0) {
        return res.status(400).json({ error: 'Gói CAPITAL không được có sản phẩm' });
      }
      await prisma.nppPackageItem.deleteMany({ where: { packageId: id } });
      if (items && Array.isArray(items) && items.length > 0) {
        const productIds = items.map(i => i.productId).filter(Boolean);
        const uniqueProductIds = new Set(productIds);
        const products = await prisma.product.findMany({
          where: { id: { in: Array.from(uniqueProductIds) } },
          select: { id: true }
        });
        const foundIds = new Set(products.map(p => p.id));
        for (const pid of uniqueProductIds) {
          if (!foundIds.has(pid)) return res.status(400).json({ error: `Sản phẩm không tồn tại: ${pid}` });
        }
        await prisma.nppPackageItem.createMany({
          data: items.map(item => ({
            packageId: id,
            productId: item.productId,
            quantity: item.quantity !== undefined ? Number(item.quantity) : 1,
            note: item.note || null
          }))
        });
      }
    }

    const updated = await prisma.nppPackage.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: { select: { id: true, slug: true, title: true, price: true, image: true } }
          }
        }
      }
    });

    res.json({ success: true, message: 'Cập nhật gói NPP thành công', data: serializeBigInt(updated) });
  } catch (error) {
    console.error('Error updating NPP package:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ── PATCH /api/admin/npp/packages/:id/status — Activate/Deactivate ───────────
app.patch('/api/admin/npp/packages/:id/status', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    if (isActive === undefined) {
      return res.status(400).json({ error: 'isActive là bắt buộc' });
    }
    const existing = await prisma.nppPackage.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy gói NPP' });
    }
    const updated = await prisma.nppPackage.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
      include: {
        items: {
          include: {
            product: { select: { id: true, slug: true, title: true, price: true, image: true } }
          }
        }
      }
    });
    const statusText = updated.isActive ? 'kích hoạt' : 'vô hiệu hóa';
    res.json({ success: true, message: `Gói NPP đã được ${statusText}`, data: serializeBigInt(updated) });
  } catch (error) {
    console.error('Error updating NPP package status:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ── DELETE /api/admin/npp/packages/:id — Delete ──────────────────────────────
app.delete('/api/admin/npp/packages/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.nppPackage.findUnique({
      where: { id },
      include: { _count: { select: { purchases: true } } }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy gói NPP' });
    }
    if (existing._count.purchases > 0) {
      return res.status(400).json({
        error: `Không thể xóa gói NPP đã có ${existing._count.purchases} đơn hàng. Hãy vô hiệu hóa thay vì xóa.`
      });
    }
    await prisma.$transaction([
      prisma.nppRegistration.deleteMany({ where: { packageId: id } }),
      prisma.nppPackageItem.deleteMany({ where: { packageId: id } }),
      prisma.nppPackage.delete({ where: { id } })
    ]);
    res.json({ success: true, message: 'Đã xóa gói NPP' });
  } catch (error) {
    console.error('Error deleting NPP package:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ─── Phase 3.2.1: NPP Registration + Activation Foundation ──────────────────


// GET /api/npp/packages/available-public — Public endpoint for registration form (no auth required)
app.get('/api/npp/packages/available-public', async (req, res) => {
  try {
    const packages = await prisma.nppPackage.findMany({
      where: { isActive: true },
      select: {
        id: true, code: true, name: true, description: true,
        grossPrice: true, defaultDiscount: true, assignedRank: true,
        packageType: true, requiredQuantity: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: packages.map(p => serializeBigInt(p)) });
  } catch (e) {
    console.error('GET /api/npp/packages/available-public error:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/npp/packages/available — User-facing active packages
app.get('/api/npp/packages/available', authenticateToken, async (req, res) => {
  try {
    const packages = await prisma.nppPackage.findMany({
      where: { isActive: true },
      select: {
        id: true, code: true, name: true, description: true,
        grossPrice: true, defaultDiscount: true, assignedRank: true,
        packageType: true, requiredQuantity: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: packages.map(p => serializeBigInt(p)) });
  } catch (e) {
    console.error('GET /api/npp/packages/available error:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/npp/register — User registers NPP intent
app.post('/api/npp/register', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.dbId || req.user.id;
    const { packageId } = req.body;

    if (!packageId) return res.status(400).json({ error: 'packageId là bắt buộc' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isNpp) return res.status(400).json({ error: 'Bạn đã là NPP ACTIVE. Không cần đăng ký.' });

    const pkg = await prisma.nppPackage.findUnique({ where: { id: packageId } });
    if (!pkg) return res.status(404).json({ error: 'Gói NPP không tồn tại' });
    if (!pkg.isActive) return res.status(400).json({ error: 'Gói NPP đã ngừng hoạt động' });

    // Single active registration enforcement
    const existingReg = await prisma.nppRegistration.findFirst({
      where: { userId, status: { in: ['PENDING', 'APPROVED'] } },
    });

    let replacedId = null;
    if (existingReg) {
      if (existingReg.packageId === packageId) {
        return res.json({
          success: true,
          message: 'Bạn đã đăng ký gói này. Đang chờ xử lý.',
          data: serializeBigInt(existingReg),
        });
      }
      await prisma.nppRegistration.update({
        where: { id: existingReg.id },
        data: {
          status: 'REPLACED',
          cancelReason: 'Đổi sang gói ' + pkg.code,
          updatedAt: new Date(),
        },
      });
      replacedId = existingReg.id;
    }

    const reg = await prisma.nppRegistration.create({
      data: {
        userId,
        packageId,
        status: 'PENDING',
        updatedAt: new Date(),
      },
    });

    const message = replacedId
      ? 'Đã đổi đăng ký sang gói ' + pkg.name + '. Đăng ký cũ đã được hủy.'
      : 'Đã đăng ký NPP. Vui lòng chờ xử lý.';

    res.json({ success: true, message, data: serializeBigInt(reg) });
  } catch (e) {
    console.error('POST /api/npp/register error:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/npp/my-registration — User views own registration
app.get('/api/npp/my-registration', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.dbId || req.user.id;
    const active = await prisma.nppRegistration.findFirst({
      where: { userId, status: { in: ['PENDING', 'APPROVED'] } },
      include: { package: true },
      orderBy: { createdAt: 'desc' },
    });
    const history = await prisma.nppRegistration.findMany({
      where: { userId, status: { in: ['CANCELLED', 'REPLACED', 'CONVERTED'] } },
      include: { package: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    res.json({
      success: true,
      data: {
        active: active ? serializeBigInt(active) : null,
        history: history.map(r => serializeBigInt(r)),
      },
    });
  } catch (e) {
    console.error('GET /api/npp/my-registration error:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/npp/grant — Admin grants NPP directly
app.post('/api/admin/npp/grant', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { userId, packageId, assignedRank, reason, note, paymentStatus } = req.body;
    const adminUserId = req.user.userId || req.user.id;

    if (!userId) return res.status(400).json({ error: 'userId là bắt buộc' });
    if (!assignedRank) return res.status(400).json({ error: 'assignedRank là bắt buộc' });
    if (!NPP_VALID_RANKS.includes(assignedRank)) {
      return res.status(400).json({ error: 'assignedRank phải là: ' + NPP_VALID_RANKS.join(', ') });
    }
    if (!reason || !reason.trim()) return res.status(400).json({ error: 'Lý do (reason) là bắt buộc cho Admin Grant' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let pkg = null;
    if (packageId) {
      pkg = await prisma.nppPackage.findUnique({ where: { id: packageId } });
      if (!pkg) return res.status(404).json({ error: 'Package not found' });
    }

    const rankCheck = validateNppRankChange(user.rank, assignedRank);
    if (!rankCheck.allowed) {
      return res.status(400).json({ error: rankCheck.error });
    }
    if (user.isNpp && rankCheck.sameRank) {
      return res.status(400).json({
        error: 'User đã là NPP ACTIVE với rank ' + user.rank + '. Không có upgrade khả dụng.',
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Allocate BID if needed
      let allocatedBid = null;
      if (!user.businessId) {
        await tx.$executeRaw`UPDATE BusinessIdSequence SET nextVal = nextVal + 1 WHERE id = 1`;
        const seqRow = await tx.businessIdSequence.findUnique({ where: { id: 1 } });
        const bidValue = seqRow.nextVal - 1;
        allocatedBid = 'WK-' + String(bidValue).padStart(5, '0');
      }

      // 2. Update User
      const userUpdate = {
        isNpp: true,
        nppActivationSource: 'ADMIN_GRANT',
        nppActivatedBy: adminUserId,
        rank: assignedRank,
        rankStatus: 'ACTIVE_RANK',
      };
      if (!user.nppActivatedAt) userUpdate.nppActivatedAt = new Date();
      if (allocatedBid) userUpdate.businessId = allocatedBid;

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: userUpdate,
      });

      // 3. Close existing active RankHistory (only if rank changes)
      if (user.rank && user.rank !== assignedRank) {
        const userIdStr = user.userId;
        await tx.$executeRawUnsafe(
          `UPDATE RankHistory SET effectiveTo = datetime('now') WHERE userId = ? AND effectiveTo IS NULL`,
          userIdStr
        );
      }

      // 4. Create RankHistory (only if rank changes)
      let rankHistoryRecord = null;
      if (!rankCheck.sameRank) {
        rankHistoryRecord = await tx.rankHistory.create({
          data: {
            userId: user.userId,
            fromRank: user.rank || null,
            toRank: assignedRank,
            fromStatus: user.rankStatus || null,
            toStatus: 'ACTIVE_RANK',
            reason: 'ADMIN_GRANT_NPP',
            triggeredBy: adminUserId,
            metadata: JSON.stringify({
              adminGrant: true,
              reason: reason.trim(),
              note: note || null,
              packageCode: pkg ? pkg.code : null,
            }),
            effectiveFrom: new Date(),
            effectiveTo: null,
          },
        });
      }

      // 5. Create NppActivation audit trail
      const activation = await tx.nppActivation.create({
        data: {
          userId,
          source: 'ADMIN_GRANT',
          packageId: packageId || null,
          purchaseId: null,
          assignedRank,
          previousRank: user.rank || null,
          allocatedBid,
          activatedBy: adminUserId,
          reason: reason.trim(),
          note: note || null,
          paymentStatus: paymentStatus || 'UNPAID',
        },
      });

      return { user: updatedUser, activation, allocatedBid };
    });

    res.json({
      success: true,
      message: 'Đã cấp NPP cho ' + user.fullName,
      data: {
        userId: result.user.id,
        fullName: result.user.fullName,
        businessId: result.user.businessId,
        rank: result.user.rank,
        isNpp: result.user.isNpp,
        nppActivationSource: result.user.nppActivationSource,
        activation: serializeBigInt(result.activation),
      },
    });
  } catch (e) {
    console.error('POST /api/admin/npp/grant error:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/npp/registrations — Admin list registrations
app.get('/api/admin/npp/registrations', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;

    const registrations = await prisma.nppRegistration.findMany({
      where,
      include: {
        user: { select: { id: true, userId: true, fullName: true, phone: true, isNpp: true, businessId: true, rank: true } },
        package: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: registrations.map(r => serializeBigInt(r)) });
  } catch (e) {
    console.error('GET /api/admin/npp/registrations error:', e);
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/admin/npp/registrations/:id/status — Admin approve/cancel
app.patch('/api/admin/npp/registrations/:id/status', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancelReason } = req.body;

    if (!status || !['APPROVED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Status phải là APPROVED hoặc CANCELLED' });
    }

    const reg = await prisma.nppRegistration.findUnique({ where: { id } });
    if (!reg) return res.status(404).json({ error: 'Registration not found' });
    if (!['PENDING', 'APPROVED'].includes(reg.status)) {
      return res.status(400).json({ error: 'Registration status hiện tại là ' + reg.status + '. Không thể thay đổi.' });
    }

    const updateData = { status, updatedAt: new Date() };
    if (status === 'CANCELLED' && cancelReason) updateData.cancelReason = cancelReason;

    const updated = await prisma.nppRegistration.update({ where: { id }, data: updateData });
    const statusText = status === 'APPROVED' ? 'duyệt' : 'hủy';
    res.json({ success: true, message: 'Đã ' + statusText + ' đăng ký NPP', data: serializeBigInt(updated) });
  } catch (e) {
    console.error('PATCH /api/admin/npp/registrations/:id/status error:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/npp/activations — Admin activation history
app.get('/api/admin/npp/activations', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const activations = await prisma.nppActivation.findMany({
      include: {
        user: { select: { id: true, userId: true, fullName: true, phone: true, businessId: true, rank: true } },
        package: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: activations.map(a => serializeBigInt(a)) });
  } catch (e) {
    console.error('GET /api/admin/npp/activations error:', e);
    res.status(500).json({ error: e.message });
  }
});

// ─── End Phase 3.2.1 ─────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 3.3: NPP Purchase Flow APIs
// ═══════════════════════════════════════════════════════════════════════════════

const NPP_PURCHASE_FLOW = ['NEW', 'DEPOSIT', 'CONFIRMED', 'SHIPPING', 'COMPLETED'];

function generatePurchaseCode() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `NPP-${yy}${mm}-${rand}`;
}

// POST /api/admin/npp/purchases — Create purchase from approved registration
app.post('/api/admin/npp/purchases', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { registrationId, items } = req.body;
    if (!registrationId) return res.status(400).json({ success: false, message: 'registrationId required' });

    // 1. Find registration
    const reg = await prisma.nppRegistration.findUnique({
      where: { id: registrationId },
      include: { package: true, user: true },
    });
    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });
    if (reg.status !== 'APPROVED') return res.status(400).json({ success: false, message: `Registration status is ${reg.status}, must be APPROVED` });

    // 2. Check no existing purchase for this registration
    const existingPurchase = await prisma.nppPurchase.findFirst({ where: { registrationId } });
    if (existingPurchase) return res.status(400).json({ success: false, message: 'Purchase already exists for this registration' });

    const pkg = reg.package;
    if (!pkg.isActive) return res.status(400).json({ success: false, message: 'Package is inactive' });

    let grossPrice, discountRateBps, discountAmount, netPayableAmount;
    let purchaseItems = [];
    let packageSnapshotData;

    if (pkg.packageType === 'CAPITAL') {
      // CAPITAL: fixed grossPrice, no products, no discount
      if (!pkg.grossPrice || pkg.grossPrice <= 0n) return res.status(400).json({ success: false, message: 'CAPITAL package has no valid grossPrice' });
      grossPrice = pkg.grossPrice;
      discountRateBps = 0;
      discountAmount = 0n;
      netPayableAmount = grossPrice;
      packageSnapshotData = { packageCode: pkg.code, name: pkg.name, type: 'CAPITAL', grossPrice: grossPrice.toString() };

    } else if (pkg.packageType === 'PRODUCT_COMBO') {
      // PRODUCT_COMBO: user selects products
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'PRODUCT_COMBO requires items: [{ productId, quantity }]' });
      }

      // Validate total quantity
      const totalQty = items.reduce((s, i) => s + (i.quantity || 0), 0);
      if (totalQty !== pkg.requiredQuantity) {
        return res.status(400).json({ success: false, message: `Total quantity must be exactly ${pkg.requiredQuantity}, got ${totalQty}` });
      }

      // Fetch products and calculate
      const productIds = [...new Set(items.map(i => i.productId))];
      const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
      const productMap = {};
      products.forEach(p => { productMap[p.id] = p; });

      grossPrice = 0n;
      for (const item of items) {
        if (!item.productId || !item.quantity || item.quantity < 1) {
          return res.status(400).json({ success: false, message: 'Each item must have productId and quantity >= 1' });
        }
        const product = productMap[item.productId];
        if (!product) return res.status(400).json({ success: false, message: `Product ${item.productId} not found` });
        if (product.price <= 0) return res.status(400).json({ success: false, message: `Product ${product.title} has invalid price` });

        const unitPrice = floatPriceToBigInt(product.price);
        const lineTotal = unitPrice * BigInt(item.quantity);
        grossPrice += lineTotal;

        purchaseItems.push({
          productId: product.id,
          productCode: product.slug,
          productName: product.title,
          quantity: item.quantity,
          unitPrice,
          lineTotal,
        });
      }

      discountRateBps = pkg.defaultDiscount || 0;
      discountAmount = grossPrice * BigInt(discountRateBps) / 10000n;
      netPayableAmount = grossPrice - discountAmount;

      if (netPayableAmount <= 0n) return res.status(400).json({ success: false, message: 'Net payable must be positive' });
      if (discountAmount >= grossPrice) return res.status(400).json({ success: false, message: 'Discount exceeds gross price' });

      packageSnapshotData = {
        packageCode: pkg.code, name: pkg.name, type: 'PRODUCT_COMBO',
        requiredQuantity: pkg.requiredQuantity, discountBps: discountRateBps,
        items: purchaseItems.map(i => ({ productId: i.productId, name: i.productName, qty: i.quantity, unitPrice: i.unitPrice.toString(), lineTotal: i.lineTotal.toString() })),
      };

    } else {
      return res.status(400).json({ success: false, message: `Unknown packageType: ${pkg.packageType}` });
    }

    // Generate unique code
    let code = generatePurchaseCode();
    let codeUnique = false;
    for (let i = 0; i < 5; i++) {
      const exists = await prisma.nppPurchase.findUnique({ where: { code } });
      if (!exists) { codeUnique = true; break; }
      code = generatePurchaseCode();
    }
    if (!codeUnique) return res.status(500).json({ success: false, message: 'Could not generate unique purchase code' });

    // Create purchase + items in transaction
    const result = await prisma.$transaction(async (tx) => {
      const purchase = await tx.nppPurchase.create({
        data: {
          code,
          userId: reg.user.id,
          userCode: reg.user.userId,
          packageId: pkg.id,
          registrationId: reg.id,
          grossPrice,
          discountRateBps,
          discountAmount,
          netPayableAmount,
          remainingAmount: netPayableAmount,
          actualPaidAmount: netPayableAmount,
          assignedRank: pkg.assignedRank,
          packageSnapshot: JSON.stringify(packageSnapshotData),
          status: 'NEW',
        },
      });

      // Create purchase items (PRODUCT_COMBO only)
      if (purchaseItems.length > 0) {
        for (const item of purchaseItems) {
          await tx.nppPurchaseItem.create({
            data: {
              purchaseId: purchase.id,
              productId: item.productId,
              productCode: item.productCode,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
            },
          });
        }
      }

      return purchase;
    });

    console.log(`[NPP PURCHASE] Created ${code} for ${reg.user.userId} pkg=${pkg.code} net=${netPayableAmount}`);
    res.status(201).json({ success: true, message: 'Purchase created', data: serializeBigInt(result) });

  } catch (e) {
    console.error('POST /api/admin/npp/purchases error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/admin/npp/purchases — List all purchases
app.get('/api/admin/npp/purchases', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const purchases = await prisma.nppPurchase.findMany({
      include: {
        user: { select: { userId: true, fullName: true, phone: true } },
        package: { select: { code: true, name: true, packageType: true, assignedRank: true } },
        payments: { select: { id: true, amount: true, paidAt: true, paymentMethod: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: purchases.map(p => serializeBigInt(p)) });
  } catch (e) {
    console.error('GET /api/admin/npp/purchases error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/admin/npp/purchases/:id — Purchase detail
app.get('/api/admin/npp/purchases/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const purchase = await prisma.nppPurchase.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { userId: true, fullName: true, phone: true, businessId: true, rank: true, isNpp: true } },
        package: { select: { code: true, name: true, packageType: true, assignedRank: true, requiredQuantity: true, defaultDiscount: true } },
        payments: { orderBy: { paidAt: 'desc' } },
        items: { include: { product: { select: { title: true, price: true, image: true } } } },
      },
    });
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });
    res.json({ success: true, data: serializeBigInt(purchase) });
  } catch (e) {
    console.error('GET /api/admin/npp/purchases/:id error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// PATCH /api/admin/npp/purchases/:id/status — Forward-only status transition
app.patch('/api/admin/npp/purchases/:id/status', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'status required' });

    const validStatuses = ['NEW', 'DEPOSIT', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) return res.status(400).json({ success: false, message: `Invalid status: ${status}` });

    const purchase = await prisma.nppPurchase.findUnique({ where: { id: req.params.id }, include: { package: true } });
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });

    // No changes after COMPLETED or CANCELLED
    if (purchase.status === 'COMPLETED') return res.status(400).json({ success: false, message: 'Không thể thay đổi đơn đã hoàn tất.' });
    if (purchase.status === 'CANCELLED') return res.status(400).json({ success: false, message: 'Không thể thay đổi đơn đã hủy.' });

    // Forward-only (except CANCELLED which can come from any pre-COMPLETED status)
    if (status !== 'CANCELLED') {
      const currentIdx = NPP_PURCHASE_FLOW.indexOf(purchase.status);
      const targetIdx = NPP_PURCHASE_FLOW.indexOf(status);
      if (targetIdx <= currentIdx) {
        return res.status(400).json({ success: false, message: `Không thể chuyển từ ${purchase.status} về ${status}` });
      }

      // CAPITAL can skip SHIPPING: CONFIRMED → COMPLETED
      if (purchase.package.packageType === 'CAPITAL' && purchase.status === 'CONFIRMED' && status === 'COMPLETED') {
        // Allow skip
      } else if (targetIdx > currentIdx + 1 && status !== 'COMPLETED') {
        // Cannot skip states (except CAPITAL CONFIRMED→COMPLETED)
        return res.status(400).json({ success: false, message: `Không thể bỏ qua trạng thái. Phải chuyển tuần tự.` });
      }
    }

    // COMPLETED requires isPaidInFull
    if (status === 'COMPLETED') {
      if (!purchase.isPaidInFull) return res.status(400).json({ success: false, message: 'Chưa thanh toán đủ. Không thể hoàn tất.' });
      if (purchase.paidAmount !== purchase.netPayableAmount) return res.status(400).json({ success: false, message: 'Số tiền thanh toán không khớp.' });
    }

    const updated = await prisma.nppPurchase.update({
      where: { id: req.params.id },
      data: { status },
    });

    console.log(`[NPP PURCHASE STATUS] ${purchase.code}: ${purchase.status} → ${status}`);
    res.json({ success: true, data: serializeBigInt(updated) });
  } catch (e) {
    console.error('PATCH /api/admin/npp/purchases/:id/status error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/admin/npp/purchases/:id/payments — Record payment
app.post('/api/admin/npp/purchases/:id/payments', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { amount, paymentMethod, referenceCode, note } = req.body;
    if (!amount) return res.status(400).json({ success: false, message: 'amount required' });

    const amountBigInt = BigInt(amount);
    if (amountBigInt <= 0n) return res.status(400).json({ success: false, message: 'Amount must be positive' });

    const purchase = await prisma.nppPurchase.findUnique({ where: { id: req.params.id } });
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });
    if (purchase.status === 'COMPLETED') return res.status(400).json({ success: false, message: 'Đơn đã hoàn tất, không thể thêm thanh toán.' });
    if (purchase.status === 'CANCELLED') return res.status(400).json({ success: false, message: 'Đơn đã hủy.' });

    // Block overpayment
    if (amountBigInt > purchase.remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `Số tiền thanh toán (${amountBigInt}) vượt quá số còn lại (${purchase.remainingAmount}).`,
      });
    }

    const adminUserId = req.user.userId || req.user.id;

    // Transaction: create payment + recalculate
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.nppPayment.create({
        data: {
          purchaseId: purchase.id,
          amount: amountBigInt,
          paymentMethod: paymentMethod || 'BANK_TRANSFER',
          referenceCode: referenceCode || null,
          note: note || null,
          confirmedBy: adminUserId,
        },
      });

      // Recalculate from source
      const allPayments = await tx.nppPayment.findMany({ where: { purchaseId: purchase.id } });
      const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0n);
      const remaining = purchase.netPayableAmount - totalPaid;
      const isPaidInFull = totalPaid >= purchase.netPayableAmount;

      const updateData = {
        paidAmount: totalPaid,
        remainingAmount: remaining,
        isPaidInFull,
      };

      // First payment = deposit
      if (allPayments.length === 1) {
        updateData.depositAmount = amountBigInt;
        updateData.depositAt = new Date();
        if (purchase.status === 'NEW') updateData.status = 'DEPOSIT';
      }

      if (isPaidInFull) {
        updateData.paidInFullAt = new Date();
        updateData.paidInFullConfirmedBy = adminUserId;
        // Auto-advance to CONFIRMED if still DEPOSIT or NEW
        if (purchase.status === 'NEW' || purchase.status === 'DEPOSIT') {
          updateData.status = 'CONFIRMED';
        }
      }

      await tx.nppPurchase.update({ where: { id: purchase.id }, data: updateData });

      return payment;
    });

    console.log(`[NPP PAYMENT] ${purchase.code}: +${amountBigInt} by ${adminUserId}`);
    res.status(201).json({ success: true, message: 'Payment recorded', data: serializeBigInt(result) });
  } catch (e) {
    console.error('POST /api/admin/npp/purchases/:id/payments error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/admin/npp/purchases/:id/complete — Confirm COMPLETED + activate NPP
app.post('/api/admin/npp/purchases/:id/complete', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const purchase = await prisma.nppPurchase.findUnique({
      where: { id: req.params.id },
      include: { package: true, user: true },
    });
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });

    // Validation
    if (purchase.status === 'COMPLETED') return res.status(400).json({ success: false, message: 'Đơn đã hoàn tất.' });
    if (purchase.status === 'CANCELLED') return res.status(400).json({ success: false, message: 'Đơn đã hủy.' });
    if (!purchase.isPaidInFull) return res.status(400).json({ success: false, message: 'Chưa thanh toán đủ.' });
    if (purchase.paidAmount !== purchase.netPayableAmount) return res.status(400).json({ success: false, message: 'Số tiền không khớp.' });
    if (purchase.activatedAt) return res.status(400).json({ success: false, message: 'Đã kích hoạt trước đó.' });

    // Must be CONFIRMED or SHIPPING (or CONFIRMED for CAPITAL skip)
    const allowedFromStatus = ['CONFIRMED', 'SHIPPING'];
    if (!allowedFromStatus.includes(purchase.status)) {
      return res.status(400).json({ success: false, message: `Không thể hoàn tất từ trạng thái ${purchase.status}` });
    }

    const adminUserId = req.user.userId || req.user.id;
    const pkg = purchase.package;
    const user = purchase.user;

    // Execute activation inside transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. BID allocation (only if user has no BID)
      let allocatedBid = null;
      if (!user.businessId) {
        const seq = await tx.businessIdSequence.findFirst({});
        if (!seq) throw new Error('BusinessIdSequence not found');
        const nextVal = seq.nextVal;
        allocatedBid = `WK-${nextVal}`;
        await tx.businessIdSequence.update({ where: { id: seq.id }, data: { nextVal: nextVal + 1 } });
        await tx.user.update({ where: { id: user.id }, data: { businessId: allocatedBid } });
      }

      // 2. Rank change — Package Purchase: ALWAYS set to package rank (can downgrade)
      const previousRank = user.rank || 'NONE';
      const newRank = pkg.assignedRank;

      // 3. Update user
      await tx.user.update({
        where: { id: user.id },
        data: {
          isNpp: true,
          nppActivatedAt: user.nppActivatedAt || new Date(),
          rank: newRank,
        },
      });

      // 4. RankHistory (if changed)
      if (previousRank !== newRank) {
        await tx.rankHistory.updateMany({
          where: { userId: user.userId, effectiveTo: null },
          data: { effectiveTo: new Date() },
        });
        await tx.rankHistory.create({
          data: {
            userId: user.userId,
            fromRank: previousRank || null,
            toRank: newRank,
            fromStatus: previousRank || 'NONE',
            toStatus: newRank,
            reason: 'NPP_PACKAGE_PURCHASE',
            metadata: JSON.stringify({ packageCode: pkg.code, packageName: pkg.name }),
            triggeredBy: adminUserId,
            nppPurchaseId: purchase.id,
            effectiveFrom: new Date(),
          },
        });
      }

      // 5. NppActivation record
      const activation = await tx.nppActivation.create({
        data: {
          userId: user.id,
          source: 'PURCHASE',
          packageId: pkg.id,
          purchaseId: purchase.id,
          assignedRank: newRank,
          previousRank: previousRank,
          allocatedBid: allocatedBid,
          activatedBy: adminUserId,
          paymentStatus: 'PAID',
        },
      });

      // 6. Update purchase
      await tx.nppPurchase.update({
        where: { id: purchase.id },
        data: {
          status: 'COMPLETED',
          activatedAt: new Date(),
          allocatedBusinessId: allocatedBid,
          paidInFullConfirmedBy: adminUserId,
        },
      });

      // 7. Update registration → CONVERTED
      if (purchase.registrationId) {
        await tx.nppRegistration.update({
          where: { id: purchase.registrationId },
          data: { status: 'CONVERTED' },
        });
      }

      return { activation, allocatedBid, previousRank, newRank };
    });

    console.log(`[NPP COMPLETE] ${purchase.code}: ${user.userId} activated as ${result.newRank} BID=${result.allocatedBid || user.businessId}`);
    res.json({
      success: true,
      message: `NPP kích hoạt thành công. Rank: ${result.newRank}. BID: ${result.allocatedBid || user.businessId}`,
      data: serializeBigInt(result),
    });
  } catch (e) {
    console.error('POST /api/admin/npp/purchases/:id/complete error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// PATCH /api/admin/npp/purchases/:id/cancel — Cancel purchase (before COMPLETED only)
app.patch('/api/admin/npp/purchases/:id/cancel', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const purchase = await prisma.nppPurchase.findUnique({ where: { id: req.params.id } });
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });
    if (purchase.status === 'COMPLETED') return res.status(400).json({ success: false, message: 'Không thể hủy đơn đã hoàn tất và kích hoạt NPP.' });
    if (purchase.status === 'CANCELLED') return res.status(400).json({ success: false, message: 'Đơn đã hủy.' });

    const updated = await prisma.nppPurchase.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });

    console.log(`[NPP CANCEL] ${purchase.code} cancelled`);
    res.json({ success: true, message: 'Purchase cancelled', data: serializeBigInt(updated) });
  } catch (e) {
    console.error('PATCH /api/admin/npp/purchases/:id/cancel error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/npp/my-purchase — User views own NPP purchases
app.get('/api/npp/my-purchase', authenticateToken, async (req, res) => {
  try {
    const dbId = req.user.dbId || req.user.id;
    const user = await prisma.user.findFirst({
      where: { OR: [{ id: dbId }, { userId: dbId }] },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const purchases = await prisma.nppPurchase.findMany({
      where: { userId: user.id },
      include: {
        package: { select: { code: true, name: true, packageType: true, assignedRank: true } },
        payments: { select: { amount: true, paidAt: true, paymentMethod: true }, orderBy: { paidAt: 'desc' } },
        items: { select: { productName: true, quantity: true, unitPrice: true, lineTotal: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: purchases.map(p => serializeBigInt(p)) });
  } catch (e) {
    console.error('GET /api/npp/my-purchase error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ─── Phase 3.3: User-facing NPP Purchase ─────────────────────────────────────

// POST /api/npp/my-purchase — User creates own purchase (selects products for their approved registration)
app.post('/api/npp/my-purchase', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.dbId;
    const { items } = req.body; // [{productId, quantity}]

    // 1. Find user's APPROVED registration
    const registration = await prisma.nppRegistration.findFirst({
      where: { userId, status: 'APPROVED' },
      include: { package: true },
    });
    if (!registration) return res.status(400).json({ success: false, message: 'Không tìm thấy đăng ký NPP được duyệt.' });

    // 2. Check no existing purchase for this registration
    const existingPurchase = await prisma.nppPurchase.findFirst({ where: { registrationId: registration.id } });
    if (existingPurchase) return res.status(400).json({ success: false, message: 'Đã có đơn mua cho đăng ký này.', data: existingPurchase });

    const pkg = registration.package;

    // 3. Build purchase based on package type
    let grossPrice, discountRateBps, discountAmount, netPayableAmount;
    let purchaseItems = [];

    if (pkg.packageType === 'CAPITAL') {
      grossPrice = pkg.grossPrice;
      discountRateBps = 0;
      discountAmount = BigInt(0);
      netPayableAmount = grossPrice;
    } else {
      // PRODUCT_COMBO
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn sản phẩm cho gói combo.' });
      }

      // Validate quantity
      const totalQty = items.reduce((sum, i) => sum + (i.quantity || 1), 0);
      if (pkg.requiredQuantity && totalQty !== pkg.requiredQuantity) {
        return res.status(400).json({ success: false, message: `Gói yêu cầu chọn đúng ${pkg.requiredQuantity} sản phẩm. Bạn đã chọn ${totalQty}.` });
      }

      // Fetch products
      const productIds = items.map(i => i.productId);
      const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
      if (products.length !== productIds.length) {
        return res.status(400).json({ success: false, message: 'Một số sản phẩm không tồn tại.' });
      }

      // Calculate prices (Float → BigInt boundary)
      const floatPriceToBigInt = (p) => {
        const cents = Math.round(p);
        if (Math.abs(cents - p) > 0.01) throw new Error(`Giá ${p} không phải số nguyên VNĐ.`);
        return BigInt(cents);
      };

      grossPrice = BigInt(0);
      for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        const qty = item.quantity || 1;
        const unitPrice = floatPriceToBigInt(product.price);
        const lineTotal = unitPrice * BigInt(qty);
        grossPrice += lineTotal;
        purchaseItems.push({
          productId: product.id,
          productCode: product.slug,
          productName: product.title,
          quantity: qty,
          unitPrice,
          lineTotal,
        });
      }

      discountRateBps = pkg.defaultDiscount || 0;
      discountAmount = grossPrice * BigInt(discountRateBps) / BigInt(10000);
      netPayableAmount = grossPrice - discountAmount;

      // Check fractional VND
      if (grossPrice * BigInt(discountRateBps) % BigInt(10000) !== BigInt(0)) {
        return res.status(400).json({ success: false, message: 'Lỗi: Số tiền chiết khấu có phần lẻ VNĐ. Vui lòng chọn sản phẩm khác.' });
      }
    }

    // 4. Generate purchase code
    const now = new Date();
    const dateStr = `${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}`;
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const code = `NPP-${dateStr}-${rand}`;

    // 5. Create purchase + items in transaction
    const purchase = await prisma.$transaction(async (tx) => {
      const p = await tx.nppPurchase.create({
        data: {
          code,
          userId,
          userCode: req.user.userId,
          packageId: pkg.id,
          registrationId: registration.id,
          grossPrice,
          discountRateBps,
          discountAmount,
          netPayableAmount,
          remainingAmount: netPayableAmount,
          actualPaidAmount: BigInt(0),
          assignedRank: pkg.assignedRank,
          packageSnapshot: JSON.stringify({ code: pkg.code, name: pkg.name, packageType: pkg.packageType, requiredQuantity: pkg.requiredQuantity, defaultDiscount: pkg.defaultDiscount }),
        },
      });

      // Create items for PRODUCT_COMBO
      if (purchaseItems.length > 0) {
        for (const item of purchaseItems) {
          await tx.nppPurchaseItem.create({
            data: { purchaseId: p.id, ...item },
          });
        }
      }

      return p;
    });

    // Serialize BigInt
    const serialize = (obj) => JSON.parse(JSON.stringify(obj, (_, v) => typeof v === 'bigint' ? v.toString() : v));

    const full = await prisma.nppPurchase.findUnique({
      where: { id: purchase.id },
      include: { items: true, payments: true, package: true },
    });

    console.log(`[NPP USER PURCHASE] ${req.user.userId} created ${code} for package ${pkg.code}`);
    res.json({ success: true, data: serialize(full), message: 'Đơn mua NPP đã được tạo thành công.' });
  } catch (e) {
    console.error('POST /api/npp/my-purchase error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// End Phase 3.3 NPP Purchase Flow APIs
// ═══════════════════════════════════════════════════════════════════════════════


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
