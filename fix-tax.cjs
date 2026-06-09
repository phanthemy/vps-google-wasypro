const fs = require('fs');
let content = fs.readFileSync('C:/Users/Administrator/.gemini/antigravity/scratch/myspa/src/App.jsx', 'utf8');

// --- UsersView Updates ---

// Add new headers to table
content = content.replace(
  /<th>Doanh Số<\/th>\n                <th style={{ color: 'var\(--accent-diamond\)' }}>Hoa Hồng Nhận<\/th>/,
  `<th>Doanh Số</th>
                <th style={{ color: 'var(--accent-diamond)' }}>Hoa Hồng Gộp</th>
                <th style={{ color: '#F43F5E' }}>Thuế TNCN (10%)</th>
                <th style={{ color: '#F59E0B' }}>Phí Quản Lý (1%)</th>
                <th style={{ color: '#10B981' }}>Thực Nhận</th>`
);

// Map table row fields
content = content.replace(
  /<div className="font-bold">\{new Intl\.NumberFormat\('vi-VN', \{ style: 'currency', currency: 'VND' \}\)\.format\(user\.totalSales\)\}<\/div>\n                  <\/td>\n                  <td style=\{\{ position: 'relative' \}\}.*\n.*onMouseEnter=\{\(\) => setHoveredTooltip\(user\.id\)\}.*\n.*onMouseLeave=\{\(\) => setHoveredTooltip\(null\)\}>\n                    <div className="font-bold text-diamond".*>\n                        \{new Intl\.NumberFormat\('vi-VN', \{ style: 'currency', currency: 'VND' \}\)\.format\(user\.totalCommission || 0\)\}\n                    <\/div>/,
  `<div className="font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(user.totalSales)}</div>
                  </td>
                  <td style={{ position: 'relative' }} 
                      onMouseEnter={() => setHoveredTooltip(user.id)} 
                      onMouseLeave={() => setHoveredTooltip(null)}>
                    <div className="font-bold text-diamond" style={{ textShadow: '0 0 10px rgba(0, 240, 255, 0.4)', cursor: 'pointer' }}>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(user.totalCommission || 0)}
                    </div>`
);

// We need to inject the new columns right after the HoveredTooltip mapping (which is inside </td>)
content = content.replace(
  /<\/ul>\n                        <\/div>\n                    \)\}\n                  <\/td>\n                  <td>\n                    <textarea/,
  `</ul>
                        </div>
                    )}
                  </td>
                  <td>
                    <div className="text-red-500 font-bold">-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((user.totalCommission || 0) * 0.1)}</div>
                  </td>
                  <td>
                    <div className="text-amber-500 font-bold">-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((user.totalSales || 0) * 0.01)}</div>
                  </td>
                  <td>
                    <div className="text-green-500 font-bold text-lg">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((user.totalCommission || 0) * 0.9 - (user.totalSales || 0) * 0.01)}</div>
                  </td>
                  <td>
                    <textarea`
);

// Update CSV Export
content = content.replace(
  /const headers = \['Mã CTV', 'Họ Tên CTV', 'Cấp Bậc', 'Số Điện Thoại', 'Người Giới Thiệu', 'Doanh Số \(VNĐ\)', 'Hoa Hồng Yêu Cầu \(VNĐ\)', 'Ghi Chú Admin'\];/,
  `const headers = ['Mã CTV', 'Họ Tên CTV', 'Cấp Bậc', 'Số Điện Thoại', 'Người Giới Thiệu', 'Doanh Số (VNĐ)', 'Hoa Hồng Gộp (VNĐ)', 'Thuế TNCN 10%', 'Phí Nền Tảng 1%', 'Thực Nhận (VNĐ)', 'Ghi Chú Admin'];`
);

content = content.replace(
  /user\.totalSales,\n      user\.totalCommission \|\| 0,\n      `"\$\{\(user\.note \|\| ''\)\.replace\(.*`\n    \]\);/,
  `user.totalSales,
      user.totalCommission || 0,
      (user.totalCommission || 0) * 0.1,
      (user.totalSales || 0) * 0.01,
      (user.totalCommission || 0) * 0.9 - (user.totalSales || 0) * 0.01,
      \`"\${(user.note || '').replace(/"/g, '""').replace(/\\n/g, ' ')}"\`
    ]);`
);


// --- CommissionHistoryView Updates ---
content = content.replace(
  /<th>Thời Gian<\/th>\n                <th>Loại Chiết Khấu<\/th>\n                <th>Khách Hàng Áp Dụng<\/th>\n                <th>Tên Dịch Vụ<\/th>\n                <th>Đơn Hàng<\/th>\n                <th>Lợi Nhuận Nhận Được<\/th>/,
  `<th>Thời Gian</th>
                <th>Loại Chiết Khấu</th>
                <th>Khách Hàng Áp Dụng</th>
                <th>Tên Dịch Vụ</th>
                <th>Đơn Hàng</th>
                <th>Hoa Hồng Gộp</th>
                <th>Thuế TNCN (10%)</th>
                <th>Phí Nền Tảng (1%)</th>
                <th>Thực Nhận</th>`
);

// Map table row fields in CommissionHistoryView
// The current code is like:
/*
<td>
    <div className="font-bold text-diamond hover-effect">
       +{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.amount)}
    </div>
</td>
*/

// We'll replace the Lợi Nhuận Nhận Được cell
content = content.replace(
  /<td.*>\n\s*<div className="font-bold text-diamond hover-effect">\n\s*\+\{new Intl\.NumberFormat\('vi-VN', \{ style: 'currency', currency: 'VND' \}\)\.format\(c\.amount\)\}\n\s*<\/div>\n\s*<\/td>/,
  `<td className="text-center">
                    <div className="font-bold text-blue-500">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.amount)}
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="text-red-500 text-sm font-bold">
                      -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.amount * 0.1)}
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="text-amber-500 text-sm font-bold">
                      {c.type === 'DIRECT' ? '-' + new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.order.totalAmount * 0.01) : '-'}
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="text-green-500 font-bold text-lg hover-effect">
                      +{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.amount * 0.9 - (c.type === 'DIRECT' ? c.order.totalAmount * 0.01 : 0))}
                    </div>
                  </td>`
);

fs.writeFileSync('C:/Users/Administrator/.gemini/antigravity/scratch/myspa/src/App.jsx', content, 'utf8');
