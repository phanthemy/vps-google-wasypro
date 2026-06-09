const Database = require('better-sqlite3');
const db = new Database('dev.db');

// Thêm các mã user mới cần xóa theo ảnh chụp của bạn
const usersToDelete = ['D01', 'G12', 'GD01', 'QL02', 'DS03', 'S81'];

for (const userId of usersToDelete) {
  try {
    // Xóa dữ liệu liên quan trước (đơn hàng, khách hàng, hoa hồng...)
    db.prepare(`DELETE FROM CustomerAuditLog WHERE customerId IN (SELECT id FROM Customer WHERE sourceCtvId = ?)`).run(userId);
    db.prepare(`DELETE FROM Appointment WHERE customerId IN (SELECT id FROM Customer WHERE sourceCtvId = ?)`).run(userId);
    db.prepare(`DELETE FROM OrderItem WHERE orderId IN (SELECT id FROM "Order" WHERE customerId IN (SELECT id FROM Customer WHERE sourceCtvId = ?))`).run(userId);
    db.prepare(`DELETE FROM Commission WHERE receiverId = ? OR orderId IN (SELECT id FROM "Order" WHERE customerId IN (SELECT id FROM Customer WHERE sourceCtvId = ?))`).run(userId, userId);
    db.prepare(`DELETE FROM "Order" WHERE customerId IN (SELECT id FROM Customer WHERE sourceCtvId = ?)`).run(userId);
    db.prepare(`DELETE FROM Customer WHERE sourceCtvId = ?`).run(userId);

    // Xóa user chính
    const info = db.prepare(`DELETE FROM User WHERE userId = ?`).run(userId);
    if (info.changes > 0) {
      console.log(`Đã xóa thành công user: ${userId}`);
    } else {
      console.log(`Không tìm thấy user: ${userId}`);
    }
  } catch (e) {
    console.error(`Lỗi khi xóa user ${userId}:`, e.message);
  }
}
console.log('--- Hoàn tất ---');
