import React from 'react';
import { Award, Users, Contact, User } from 'lucide-react';

export default function AboutView() {
  return (
    <div className="flex-col gap-6 fade-in">
      {/* Hero Section */}
      <div className="card glass-panel" style={{ padding: '0', overflow: 'hidden', borderRadius: '16px' }}>
        <div style={{ position: 'relative', height: '350px', width: '100%' }}>
            <img src="/Hinh Anh/34e3a635d755560b0f441.jpg" alt="Cơ sở HappyLife" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg-primary), rgba(0,0,0,0.2))' }} />
            <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', zIndex: 10 }}>
               <h1 className="text-primary text-4xl mb-2" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)', color: '#fff' }}>HAPPYLIFE WATER PURIFIER</h1>
               <p style={{ color: '#F8FAFC', fontSize: '1.2rem', textShadow: '0 1px 4px rgba(0,0,0,0.9)', maxWidth: '700px', lineHeight: '1.6' }}>
                 Nơi kết tinh của y học thẩm mỹ hiện đại và sản phẩm chăm sóc khách hàng đẳng cấp. Không gian làm đẹp 5 sao mang lại vẻ đẹp hoàn mỹ, sự thư giãn tuyệt đối cho khách hàng và cơ chế thu nhập hấp dẫn nhất cho Đối tác kinh doanh.
               </p>
            </div>
        </div>
      </div>

      {/* Info Grids */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
           <h3 className="text-primary mb-4 flex items-center gap-2 text-xl"><Award className="text-gold"/> Đội Ngũ Y kỹ thuật viên</h3>
           <img src="/Hinh Anh/2aa0c377b21733496a063.jpg" alt="Đội ngũ kỹ thuật viên" style={{ width: '100%', borderRadius: '12px', marginBottom: '1.5rem', height: '240px', objectFit: 'cover', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }} />
           <p className="text-muted leading-relaxed" style={{ flex: 1, fontSize: '0.95rem' }}>
             Tự hào hội tụ đội ngũ chuyên gia da liễu và kỹ thuật viên phẫu thuật thẩm mỹ tu nghiệp trong và ngoài nước. 
             Với hơn 10 năm kinh nghiệm lâm sàng cùng hàng ngàn ca làm đẹp thành công, đội ngũ kỹ thuật viên tại HappyLife cam kết mang lại phác đồ bảo hành cá nhân hóa, 
             với tiêu chí <b>"An toàn chuẩn Y khoa - Hiệu quả bền vững"</b>.
             <br/><br/>
             Chúng tôi thường xuyên chuyển giao các công nghệ làm đẹp tiên tiến nhất thế giới để phục vụ khách hàng.
           </p>
        </div>
        
        <div className="card glass-panel flex-col gap-5">
           <h3 className="text-primary mb-2 flex items-center gap-2 text-xl"><Users className="text-diamond"/> Lãnh đạo & Cố vấn</h3>
           <div className="flex items-start gap-4 p-4 rounded-xl border border-subtle" style={{ background: 'var(--bg-secondary)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '50%' }}>
                 <Contact size={28} className="text-blue-500" />
              </div>
              <div>
                 <h4 className="font-bold text-md mb-1" style={{ color: 'var(--accent-blue)' }}>Chăm sóc chuẩn Y khoa</h4>
                 <p className="text-sm text-muted">Đội ngũ điều dưỡng viên thân thiện, tận tâm, được đào tạo bài bản về kiểm soát nhiễm khuẩn, sơ cấp cứu và chăm sóc xoa dịu tâm lý khách hàng hậu phẫu thuật.</p>
              </div>
           </div>
           
           <div className="flex items-start gap-4 p-4 rounded-xl border border-subtle" style={{ background: 'var(--bg-secondary)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '10px', borderRadius: '50%' }}>
                 <User size={28} className="text-pink-500" />
              </div>
              <div>
                 <h4 className="font-bold text-md mb-1" style={{ color: 'var(--accent-pink)' }}>Tư Vấn Chuyên Sâu 24/7</h4>
                 <p className="text-sm text-muted">Hỗ trợ tư vấn giải phẫu, gói sản phẩm làm đẹp chi tiết rõ ràng. Cam kết đồng hành cùng Khách hàng và CTV suốt 24/7, luôn giải đáp và cập nhật tiến trình bảo hành sát sao.</p>
              </div>
           </div>

           <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
             <p className="text-sm text-muted text-center italic">
               "HappyLife không chỉ là nơi kiến tạo sắc đẹp, mà là một trải nghiệm sản phẩm xuất sắc từ trái tim tới trái tim."
             </p>
           </div>
        </div>
      </div>
    </div>
  )
}
