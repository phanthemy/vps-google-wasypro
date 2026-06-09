const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const Database = require('better-sqlite3');

const db = new Database('./dev.db')
const adapter = new PrismaBetterSqlite3(db);
const prisma = new PrismaClient({ adapter });

const newServices = [
  { name: 'Ultherapy Prime (Hoa Kỳ)', group: 'Nhóm Công Nghệ Thiết Bị', price: 10000000 },
  { name: 'Thermage FLX', group: 'Nhóm Công Nghệ Thiết Bị', price: 10000000 },
  { name: 'Sofwave (Công nghệ chùm tia siêu âm)', group: 'Nhóm Công Nghệ Thiết Bị', price: 10000000 },
  { name: 'Emface (Nâng cơ cơ học & Nhiệt)', group: 'Nhóm Công Nghệ Thiết Bị', price: 10000000 },
  { name: 'Laser Pico Second (PicoSure/PicoWay)', group: 'Nhóm Công Nghệ Thiết Bị', price: 10000000 },
  { name: 'Exosome (Liệu pháp tế bào)', group: 'Nhóm Hoạt Chất Mesotherapy & Tiêm Cấy', price: 10000000 },
  { name: 'Rejuran (Tinh chất DNA cá hồi)', group: 'Nhóm Hoạt Chất Mesotherapy & Tiêm Cấy', price: 10000000 },
  { name: 'Profhilo (Axit Hyaluronic nồng độ cao)', group: 'Nhóm Hoạt Chất Mesotherapy & Tiêm Cấy', price: 10000000 },
  { name: 'Karisma (Collagen sinh học thế hệ mới)', group: 'Nhóm Hoạt Chất Mesotherapy & Tiêm Cấy', price: 10000000 },
  { name: 'Inbiotec Amber (Meso hổ phách)', group: 'Nhóm Hoạt Chất Mesotherapy & Tiêm Cấy', price: 10000000 },
];

async function main() {
  let cat = await prisma.serviceCategory.findUnique({ where: { name: 'DVB NỘI KHOA' }});
  if (!cat) {
     cat = await prisma.serviceCategory.create({
       data: { name: 'DVB NỘI KHOA', defaultCommissionConfig: 'Chăm sóc' }
     });
  }

  for (const svc of newServices) {
     await prisma.service.create({
        data: {
           name: svc.name,
           price: svc.price,
           group: svc.group,
           categoryId: cat.id
        }
     });
  }
  console.log('Added 10 Noi Khoa services successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
