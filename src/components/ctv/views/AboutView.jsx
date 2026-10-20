import React from 'react';
import { Award, Users, ShieldCheck, Droplet, Sparkles, CheckCircle } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';

export default function AboutView() {
  return (
    <div className="flex-col gap-6" style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <PageHeader 
          title="Về Thương Hiệu WasyPro - HappyLife" 
          subtitle="Tiên phong giải pháp nước ion kiềm giàu Hydro và thiết bị xử lý nước thông minh Water King." 
        />
      </div>

      {/* Info Grids */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div className="card glass-panel flex-col p-6">
          <h3 className="text-primary mb-4 flex items-center gap-2 text-xl font-bold">
            <Droplet className="text-blue-400" /> Sứ Mệnh & Công Nghệ
          </h3>
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-4">
            <h4 className="font-bold text-blue-300 text-sm mb-1">Công Nghệ Điện Phân & Siêu Lọc Tiên Tiến</h4>
            <p className="text-xs text-secondary leading-relaxed">
              Thiết bị máy lọc nước thông minh HappyLife Water King ứng dụng công nghệ điện phân tạo nước ion kiềm giàu Hydro hoạt tính, 
              giúp trung hòa gốc tự do, tăng cường hệ miễn dịch và bảo vệ sức khỏe toàn diện cho gia đình Việt.
            </p>
          </div>
          <p className="text-secondary leading-relaxed text-sm" style={{ flex: 1 }}>
            Với định hướng nâng cao chất lượng nguồn nước sinh hoạt và tiêu dùng, HappyLife cam kết chuẩn mực:
            <br /><br />
            <b>• Nước sạch chuẩn đóng chai trực tiếp tại vòi</b><br />
            <b>• Giàu khoáng chất tự nhiên và chất chống oxy hóa Hydro</b><br />
            <b>• Tối ưu chi phí bảo dưỡng, thay lõi định kỳ minh bạch</b>
          </p>
        </div>
        
        <div className="card glass-panel flex-col gap-4 p-6">
          <h3 className="text-primary mb-2 flex items-center gap-2 text-xl font-bold">
            <Award className="text-gold" /> Cam Kết Chất Lượng & Đồng Hành
          </h3>
          <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-700/50 bg-gray-800/40">
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '50%' }}>
              <ShieldCheck size={26} className="text-blue-400" />
            </div>
            <div>
              <h4 className="font-bold text-sm mb-1 text-primary">Bảo Hành Chính Hãng & Lắp Đặt Tận Nơi</h4>
              <p className="text-xs text-secondary leading-relaxed">
                Hệ thống kỹ thuật viên hỗ trợ khảo sát nguồn nước, lắp đặt và kiểm tra định kỳ chỉ số pH, TDS tại nhà, đảm bảo máy luôn vận hành tối ưu.
              </p>
            </div>
          </div>
           
          <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-700/50 bg-gray-800/40">
            <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '10px', borderRadius: '50%' }}>
              <Users size={26} className="text-purple-400" />
            </div>
            <div>
              <h4 className="font-bold text-sm mb-1 text-primary">Hệ Thống Phân Phối & Đối Tác CTV</h4>
              <p className="text-xs text-secondary leading-relaxed">
                Nền tảng WasyPro mang đến cơ chế kinh doanh minh bạch, số hóa toàn diện từ đơn hàng đến hoa hồng điểm thưởng (Points Integer) cho toàn bộ Đại sứ và Đối tác.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
            <p className="text-xs text-secondary text-center italic">
              "HappyLife Water King - Nguồn nước khởi nguồn sức khỏe và thịnh vượng."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
