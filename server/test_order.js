const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const Database = require('better-sqlite3');

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function run() {
  try {
    // 1. Tạo CTV Mạng lưới
    const gd = await prisma.user.upsert({
      where: { phone: '0990000001' },
      update: {},
      create: { id: 'GD01', phone: '0990000001', name: 'Giám Đốc A', password: '1', role: 'ctv', tier: 'DIAMOND' }
    });

    const ql = await prisma.user.upsert({
      where: { phone: '0990000002' },
      update: { parentId: gd.id },
      create: { id: 'QL02', phone: '0990000002', name: 'Quản Lý B', password: '1', role: 'ctv', tier: 'GOLD', parentId: gd.id }
    });

    const ds = await prisma.user.upsert({
      where: { phone: '0990000003' },
      update: { parentId: ql.id },
      create: { id: 'DS03', phone: '0990000003', name: 'Đại Sứ C (Test)', password: '1', role: 'ctv', tier: 'SILVER', parentId: ql.id }
    });

    // 2. Tạo KH là chính Đại Sứ C (Số điện thoại giống hệt CTV) => "Tự Nhập Hàng"
    const cus = await prisma.customer.upsert({
      where: { phone: ds.phone },
      update: { sourceCtvId: ds.id },
      create: { fullName: ds.name, phone: ds.phone, sourceCtvId: ds.id }
    });

    // 3. Lấy 1 Sản phẩm (Máy Lọc) có price > 0
    let svc = await prisma.service.findFirst({ where: { price: { gt: 0 } } });
    if (!svc) {
       console.log("Không có sản phẩm, tạo giả 1 sản phẩm...");
       const cat = await prisma.serviceCategory.findFirst();
       svc = await prisma.service.create({ data: { name: 'Máy Lọc Demo', price: 10000000, categoryId: cat.id }});
    }

    // 4. Mua 6 máy => 6 * price
    const qty = 6;
    const amount = qty * svc.price;
    console.log(`Bắt đầu lên đơn: Đại sứ C tự nhập ${qty} máy. Tổng giá: ${amount}`);

    const res = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: cus.id,
        items: [{ serviceId: svc.id, amount: amount }]
      })
    });
    
    const data = await res.json();
    console.log("Kết quả tạo đơn:", data.success);

    // 5. In ra kết quả Commissions
    const orderId = data.data.id;
    const commissions = await prisma.commission.findMany({
      where: { orderId },
      include: { receiver: true }
    });

    console.log("\n--- KẾT QUẢ ĐỔ HOA HỒNG ---");
    for (const c of commissions) {
      console.log(`- Người nhận: ${c.receiver.name} (${c.receiver.tier}) | Loại: ${c.type} | Số tiền: ${new Intl.NumberFormat('vi-VN').format(c.amount)} đ`);
    }

  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
