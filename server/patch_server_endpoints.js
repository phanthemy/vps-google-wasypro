const fs = require('fs');
const path = require('path');

const serverIndexPath = path.join(__dirname, 'index.js');
let code = fs.readFileSync(serverIndexPath, 'utf8');

// 1. Update /api/auth/me response fields if not yet added
if (!code.includes('isBankLocked: !!user.isBankLocked')) {
  const target = 'avatarUrl: user.avatarUrl ?? null,';
  const replacement = `avatarUrl: user.avatarUrl ?? null,
        email: user.email ?? null,
        address: user.address ?? null,
        bankAccount: user.bankAccount ?? null,
        bankName: user.bankName ?? null,
        bankBranch: user.bankBranch ?? null,
        isBankLocked: !!user.isBankLocked,`;
  code = code.replace(target, replacement);
  console.log('Patched /api/auth/me response fields.');
}

// 2. Add PUT /api/users/me/profile, GET /api/system/terms, GET /api/ctv/network-summary
const marker = '// === ENDPOINT_CTV_PROFILE_NETWORK_TERMS ===';
if (!code.includes(marker)) {
  const newEndpoints = `
${marker}
// ── PUT /api/users/me/profile ──────────────────────────────────────────
// Cho phép CTV sửa đổi thông tin cá nhân (họ tên, sđt, email, địa chỉ).
// Riêng tài khoản ngân hàng: nhập xong lần đầu sẽ TỰ ĐỘNG KHÓA (isBankLocked=true).
// Khi đã khóa, từ chối mọi yêu cầu chỉnh sửa ngân hàng để bảo mật.
app.put('/api/users/me/profile', authenticateToken, async (req, res) => {
  try {
    const lookupId = req.user.userId || req.user.id;
    const user = await prisma.user.findFirst({ where: { OR: [{ userId: lookupId }, { id: lookupId }] } });
    if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });

    const { fullName, phone, email, address, bankAccount, bankName, bankBranch } = req.body;
    const updateData = {};

    if (fullName && typeof fullName === 'string' && fullName.trim()) {
      updateData.fullName = fullName.trim();
    }
    if (phone && typeof phone === 'string' && phone.trim()) {
      if (phone.trim() !== user.phone) {
        const existing = await prisma.user.findUnique({ where: { phone: phone.trim() } });
        if (existing) {
          return res.status(400).json({ success: false, message: 'Số điện thoại này đã được sử dụng bởi tài khoản khác.' });
        }
      }
      updateData.phone = phone.trim();
    }
    if (email !== undefined) {
      updateData.email = typeof email === 'string' ? email.trim() : null;
    }
    if (address !== undefined) {
      updateData.address = typeof address === 'string' ? address.trim() : null;
    }

    // Security check: ngân hàng đã khóa chưa?
    const isChangingBank = (bankAccount !== undefined && bankAccount !== user.bankAccount) ||
                           (bankName !== undefined && bankName !== user.bankName) ||
                           (bankBranch !== undefined && bankBranch !== user.bankBranch);

    if (user.isBankLocked && isChangingBank) {
      return res.status(400).json({
        success: false,
        message: 'Thông tin tài khoản ngân hàng đã được khóa bảo mật. Vui lòng liên hệ Admin/CSKH nếu cần thay đổi.'
      });
    }

    if (!user.isBankLocked) {
      if (bankAccount && typeof bankAccount === 'string' && bankAccount.trim()) {
        updateData.bankAccount = bankAccount.trim();
      }
      if (bankName && typeof bankName === 'string' && bankName.trim()) {
        updateData.bankName = bankName.trim();
      }
      if (bankBranch && typeof bankBranch === 'string' && bankBranch.trim()) {
        updateData.bankBranch = bankBranch.trim();
      }
      // Nếu đã có cả số tài khoản và tên ngân hàng -> tự động khóa vĩnh viễn
      if (updateData.bankAccount && updateData.bankName) {
        updateData.isBankLocked = true;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });

    res.json({
      success: true,
      message: updateData.isBankLocked 
        ? 'Cập nhật thành công! Thông tin ngân hàng đã được khóa bảo vệ an toàn.' 
        : 'Cập nhật thông tin thành công!',
      data: {
        id: updatedUser.userId,
        fullName: updatedUser.fullName,
        phone: updatedUser.phone,
        email: updatedUser.email,
        address: updatedUser.address,
        bankAccount: updatedUser.bankAccount,
        bankName: updatedUser.bankName,
        bankBranch: updatedUser.bankBranch,
        isBankLocked: !!updatedUser.isBankLocked
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Lỗi cập nhật: ' + err.message });
  }
});

// ── GET /api/system/terms ──────────────────────────────────────────────
// Lấy thông tin điều khoản và file văn bản cập nhật của công ty
app.get('/api/system/terms', async (req, res) => {
  try {
    const doc = await prisma.companyDocument.findFirst({
      where: { category: 'TERMS', isActive: true },
      orderBy: { updatedAt: 'desc' }
    });
    res.json({
      success: true,
      data: doc || {
        id: 'doc-terms-default',
        title: 'Quy chế hoạt động & Chính sách đối tác kinh doanh WasyPro',
        category: 'TERMS',
        fileUrl: '/docs/quy-che-doi-tac-wasypro.pdf',
        description: 'Văn bản quy định quyền lợi, hoa hồng và trách nhiệm đối tác kinh doanh WasyPro ban hành.',
        version: '2026.1',
        updatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    res.json({
      success: true,
      data: {
        id: 'doc-terms-default',
        title: 'Quy chế hoạt động & Chính sách đối tác kinh doanh WasyPro',
        category: 'TERMS',
        fileUrl: '/docs/quy-che-doi-tac-wasypro.pdf',
        description: 'Văn bản quy định quyền lợi, hoa hồng và trách nhiệm đối tác kinh doanh WasyPro ban hành.',
        version: '2026.1',
        updatedAt: new Date().toISOString()
      }
    });
  }
});

// ── GET /api/ctv/network-summary ───────────────────────────────────────
// Chuẩn hóa tên gọi nghiệp vụ phân phối: "Trực tiếp" & "Gián tiếp" (Tuyệt đối không dùng F1/F2)
app.get('/api/ctv/network-summary', authenticateToken, async (req, res) => {
  try {
    const lookupId = req.user.userId || req.user.id;
    const user = await prisma.user.findFirst({ where: { OR: [{ userId: lookupId }, { id: lookupId }] } });
    if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });

    // 1. Đối tác Trực tiếp (Direct partners)
    const directUsers = await prisma.user.findMany({
      where: { parentId: user.userId },
      select: {
        id: true,
        userId: true,
        fullName: true,
        phone: true,
        tier: true,
        rank: true,
        businessId: true,
        createdAt: true,
        qualifyingPoints: true,
        sPoints: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const directUserIds = directUsers.map(u => u.userId);

    // 2. Đối tác Gián tiếp (Indirect partners)
    let indirectUsers = [];
    if (directUserIds.length > 0) {
      indirectUsers = await prisma.user.findMany({
        where: { parentId: { in: directUserIds } },
        select: {
          id: true,
          userId: true,
          fullName: true,
          phone: true,
          tier: true,
          rank: true,
          businessId: true,
          parentId: true,
          createdAt: true,
          qualifyingPoints: true,
          sPoints: true
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    const directMap = {};
    directUsers.forEach(d => { directMap[d.userId] = d.fullName; });
    const indirectMapped = indirectUsers.map(u => ({
      ...u,
      sponsorName: directMap[u.parentId] || u.parentId
    }));

    // 3. Hoa hồng Trực tiếp & Gián tiếp
    const allCommissions = await prisma.commission.findMany({
      where: { receiverId: user.userId }
    });

    let directCommission = 0;
    let indirectCommission = 0;
    let totalCommission = 0;

    allCommissions.forEach(c => {
      const amt = Number(c.amount) || Number(c.earnedMoney) || 0;
      totalCommission += amt;
      const type = (c.type || '').toUpperCase();
      const role = (c.role || '').toUpperCase();
      if (type.includes('DIRECT') || role.includes('DIRECT') || type.includes('F1') || c.policyRef === 'OVERRIDE_F1') {
        directCommission += amt;
      } else {
        indirectCommission += amt;
      }
    });

    res.json({
      success: true,
      data: {
        directCount: directUsers.length,
        indirectCount: indirectUsers.length,
        totalMembers: directUsers.length + indirectUsers.length,
        qualifyingPoints: user.qualifyingPoints || 0,
        sPoints: user.sPoints || 0,
        rank: user.rank || 'AMBASSADOR',
        directCommission,
        indirectCommission,
        totalCommission,
        directPartners: directUsers,
        indirectPartners: indirectMapped
      }
    });
  } catch (err) {
    console.error('Network summary error:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải dữ liệu mạng lưới: ' + err.message });
  }
});
`;

  // Insert before app.listen or at the end
  if (code.includes('const PORT =')) {
    code = code.replace('const PORT =', newEndpoints + '\nconst PORT =');
  } else {
    code += newEndpoints;
  }
  console.log('Appended new endpoints to server/index.js.');
}

fs.writeFileSync(serverIndexPath, code, 'utf8');
console.log('server/index.js update completed successfully!');
