const items = [
  { name: 'Ultherapy Prime (Hoa Kỳ)', group: 'Nhóm Công Nghệ Thiết Bị', price: 10000000 },
  { name: 'Thermage FLX', group: 'Nhóm Công Nghệ Thiết Bị', price: 10000000 },
  { name: 'Sofwave (Công nghệ chùm tia siêu âm)', group: 'Nhóm Công Nghệ Thiết Bị', price: 10000000 },
  { name: 'Emface (Nâng cơ cơ học & Nhiệt)', group: 'Nhóm Công Nghệ Thiết Bị', price: 10000000 },
  { name: 'Laser Pico Second (PicoSure/PicoWay)', group: 'Nhóm Công Nghệ Thiết Bị', price: 10000000 },
  { name: 'Exosome (Liệu pháp tế bào không tế bào)', group: 'Nhóm Hoạt Chất Mesotherapy & Tiêm Cấy', price: 10000000 },
  { name: 'Rejuran (Tinh chất DNA cá hồi)', group: 'Nhóm Hoạt Chất Mesotherapy & Tiêm Cấy', price: 10000000 },
  { name: 'Profhilo (Axit Hyaluronic nồng độ cao)', group: 'Nhóm Hoạt Chất Mesotherapy & Tiêm Cấy', price: 10000000 },
  { name: 'Karisma (Collagen sinh học thế hệ mới)', group: 'Nhóm Hoạt Chất Mesotherapy & Tiêm Cấy', price: 10000000 },
  { name: 'Inbiotec Amber (Meso hổ phách)', group: 'Nhóm Hoạt Chất Mesotherapy & Tiêm Cấy', price: 10000000 },
];

async function add() {
  for (const item of items) {
    await fetch('http://localhost:3000/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    }).then(r => r.json()).then(console.log);
  }
}

add();
