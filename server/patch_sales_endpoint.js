const fs = require('fs');
const path = require('path');

const serverIndexPath = path.join(__dirname, 'index.js');
let code = fs.readFileSync(serverIndexPath, 'utf8');

const targetOld = `    // 3. Hoa hồng Trực tiếp & Gián tiếp
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
    });`;

const replacementNew = `    // 3. Tính toán Doanh số (Sales) cho mạng lưới Trực tiếp & Gián tiếp
    const allUserIds = [...directUserIds, ...indirectUsers.map(u => u.userId)];
    const allUserDbIds = [...directUsers.map(u => u.id), ...indirectUsers.map(u => u.id)];

    const completedOrders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        OR: [
          { ordererUserId: { in: allUserIds } },
          { customer: { sourceCtvId: { in: allUserIds } } },
          { customer: { linkedUserId: { in: allUserDbIds } } }
        ]
      },
      select: {
        ordererUserId: true,
        totalAmount: true,
        customer: { select: { sourceCtvId: true, linkedUserId: true } }
      }
    });

    const salesMap = {};
    const countMap = {};
    completedOrders.forEach(o => {
      const uid = o.ordererUserId || o.customer?.sourceCtvId;
      if (uid) {
        salesMap[uid] = (salesMap[uid] || 0) + (Number(o.totalAmount) || 0);
        countMap[uid] = (countMap[uid] || 0) + 1;
      }
    });

    let directSales = 0;
    const directPartnersWithSales = directUsers.map(u => {
      const s = salesMap[u.userId] || 0;
      directSales += s;
      return { ...u, sales: s, ordersCount: countMap[u.userId] || 0 };
    });

    let indirectSales = 0;
    const indirectPartnersWithSales = indirectMapped.map(u => {
      const s = salesMap[u.userId] || 0;
      indirectSales += s;
      return { ...u, sales: s, ordersCount: countMap[u.userId] || 0 };
    });

    const totalSales = directSales + indirectSales;

    // 4. Hoa hồng Trực tiếp & Gián tiếp
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
        directSales,
        indirectSales,
        totalSales,
        directCommission,
        indirectCommission,
        totalCommission,
        directPartners: directPartnersWithSales,
        indirectPartners: indirectPartnersWithSales
      }
    });`;

if (code.includes(targetOld)) {
  code = code.replace(targetOld, replacementNew);
  fs.writeFileSync(serverIndexPath, code, 'utf8');
  console.log('Successfully patched /api/ctv/network-summary with sales data!');
} else {
  console.error('Target old block not found in server/index.js');
}
