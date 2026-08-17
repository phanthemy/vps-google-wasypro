import React, { useState } from 'react';
import { 
  Droplets, 
  PhoneCall, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Award, 
  ArrowRight, 
  Send, 
  Check,
  X
} from 'lucide-react';

interface FooterProps {
  onNavigate: (sectionId: string) => void;
  onOpenWarranty: () => void;
  onOpenContact: () => void;
  onOpenAdmin: () => void;
  onSuccessToast: (msg: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenWarranty,
  onOpenContact,
  onOpenAdmin,
  onSuccessToast,
}) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [policyModal, setPolicyModal] = useState<'privacy' | 'terms' | null>(null);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail && newsletterEmail.includes('@')) {
      onSuccessToast('Cảm ơn bạn đã đăng ký nhận tin khuyến mãi & thông tin sức khỏe từ WASY PRO!');
      setNewsletterEmail('');
    }
  };

  const policyContent = {
    privacy: {
      title: 'Chính Sách Bảo Mật Thông Tin',
      content: [
        { heading: '1. Thu thập thông tin', text: 'WASY PRO thu thập thông tin cá nhân khi quý khách đăng ký tư vấn, đặt hàng hoặc liên hệ qua hotline. Thông tin bao gồm: Họ tên, số điện thoại, email, địa chỉ giao hàng.' },
        { heading: '2. Mục đích sử dụng', text: 'Thông tin được sử dụng để: Xử lý đơn hàng và giao hàng, hỗ trợ bảo hành sản phẩm, gửi thông tin khuyến mãi (nếu khách hàng đồng ý), liên hệ tư vấn khi khách hàng yêu cầu.' },
        { heading: '3. Bảo vệ thông tin', text: 'WASY PRO cam kết bảo mật tuyệt đối thông tin cá nhân của khách hàng. Chúng tôi không chia sẻ, bán hoặc cho thuê thông tin cho bất kỳ bên thứ ba nào mà không có sự đồng ý của khách hàng.' },
        { heading: '4. Quyền của khách hàng', text: 'Quý khách có quyền yêu cầu xem, sửa đổi hoặc xóa thông tin cá nhân bất cứ lúc nào bằng cách liên hệ Hotline 1900 98 98 78 hoặc email support@wasypro.com.' },
        { heading: '5. Cookie', text: 'Website sử dụng cookie để cải thiện trải nghiệm người dùng. Quý khách có thể tắt cookie trong trình duyệt nếu không muốn sử dụng tính năng này.' },
      ]
    },
    terms: {
      title: 'Điều Khoản Dịch Vụ',
      content: [
        { heading: '1. Điều kiện sử dụng', text: 'Khi truy cập và sử dụng website wasypro.com, quý khách đồng ý tuân thủ các điều khoản dịch vụ được nêu dưới đây. WASY PRO có quyền thay đổi điều khoản mà không cần thông báo trước.' },
        { heading: '2. Sản phẩm và giá cả', text: 'Giá sản phẩm trên website là giá bán lẻ đề xuất, có thể thay đổi tùy thời điểm. WASY PRO cam kết cung cấp sản phẩm chính hãng 100%, đầy đủ tem nhãn và phiếu bảo hành.' },
        { heading: '3. Chính sách đặt hàng', text: 'Đơn hàng được xác nhận qua điện thoại trong vòng 24h. Khách hàng có quyền hủy đơn trước khi hàng được vận chuyển. Thời gian giao hàng từ 2-5 ngày làm việc tùy khu vực.' },
        { heading: '4. Bảo hành', text: 'Sản phẩm máy lọc nước WASY PRO được bảo hành chính hãng 5 năm tại nhà. Lõi lọc bảo hành 12 tháng. Phụ kiện bảo hành 6 tháng. Tra cứu bảo hành tại mục "Chính sách bảo hành" trên website.' },
        { heading: '5. Đổi trả', text: 'Khách hàng được đổi trả sản phẩm trong vòng 7 ngày kể từ ngày nhận hàng nếu sản phẩm bị lỗi do nhà sản xuất. Sản phẩm đổi trả phải còn nguyên vẹn, đầy đủ phụ kiện và hóa đơn.' },
        { heading: '6. Liên hệ', text: 'Mọi thắc mắc về điều khoản dịch vụ, vui lòng liên hệ: Hotline 1900 98 98 78 (24/7) hoặc email support@wasypro.com.' },
      ]
    }
  };

  return (
    <>
    <footer className="bg-primary-darker text-white pt-16 pb-8 border-t border-primary-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-primary-dark">
          
          {/* Column 1: Brand & Contact Info (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('hero')}>
              <div>
                <span className="font-heading font-extrabold text-2xl text-white tracking-tight">
                  WASY PRO
                </span>
                <p className="text-[12px] text-gray-300 font-bold tracking-wider uppercase mt-1">
                  WATER KING HYDROGEN
                </p>
              </div>
            </div>

            <p className="text-[13px] text-gray-300 leading-relaxed mt-4">
              WATER KING WASY PRO tiên phong ứng dụng công nghệ điện giải ion kiềm chuẩn y tế Hàn Quốc & Nhật Bản. Mang lại nguồn nước khỏe chống lão hóa cho hàng triệu gia đình Việt.
            </p>

            <div className="space-y-3 text-[13px] mt-4">
              <div className="flex items-start gap-2.5 text-gray-300">
                <MapPin className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span>Trụ sở chính: Tầng 6, Tòa nhà WASY Tower, Q. Cầu Giấy, TP. Hà Nội</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-300">
                <PhoneCall className="w-4 h-4 text-accent flex-shrink-0" />
                <a href="tel:1900989878" className="font-bold text-accent hover:underline">
                  Hotline 24/7: 1900 98 98 78
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-gray-300">
                <Mail className="w-4 h-4 text-accent flex-shrink-0" />
                <span>Email: support@wasypro.com</span>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-sm font-heading font-bold text-accent uppercase tracking-wider">
              Danh Mục Sản Phẩm
            </h4>
            <ul className="space-y-3 text-[13px] text-gray-300">
              <li>
                <button onClick={() => onNavigate('products')} className="hover:text-white transition-colors flex items-center gap-2">
                  <ArrowRight className="w-3 h-3 text-primary-light" />
                  <span>Máy Lọc Nước Ion Kiềm Y Tế</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('products')} className="hover:text-white transition-colors flex items-center gap-2">
                  <ArrowRight className="w-3 h-3 text-primary-light" />
                  <span>Máy Tạo Nước Hydrogen Pro</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('products')} className="hover:text-white transition-colors flex items-center gap-2">
                  <ArrowRight className="w-3 h-3 text-primary-light" />
                  <span>Bình Thủy Tinh Hydrogen Cầm Tay</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('products')} className="hover:text-white transition-colors flex items-center gap-2">
                  <ArrowRight className="w-3 h-3 text-primary-light" />
                  <span>Bộ Lõi Lọc Thay Thế Định Kỳ</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('products')} className="hover:text-white transition-colors flex items-center gap-2">
                  <ArrowRight className="w-3 h-3 text-primary-light" />
                  <span>Thiết Bị Đo pH & Chỉ Số ORP</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Policies (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-sm font-heading font-bold text-accent uppercase tracking-wider">
              Hỗ Trợ Khách Hàng
            </h4>
            <ul className="space-y-3 text-[13px] text-gray-300">
              <li>
                <button onClick={onOpenWarranty} className="hover:text-white transition-colors flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary-light" />
                  <span>Tra Cứu Bảo Hành</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('warranty')} className="hover:text-white transition-colors flex items-center gap-2">
                  <ArrowRight className="w-3 h-3 text-primary-light" />
                  <span>Chính Sách Bảo Hành 5 Năm</span>
                </button>
              </li>
              <li>
                <button onClick={onOpenContact} className="hover:text-white transition-colors flex items-center gap-2">
                  <ArrowRight className="w-3 h-3 text-primary-light" />
                  <span>Giao Hàng & Lắp Đặt Tận Nhà</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} className="hover:text-white transition-colors flex items-center gap-2">
                  <ArrowRight className="w-3 h-3 text-primary-light" />
                  <span>FAQs Câu Hỏi Thường Gặp</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter & Certification (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-sm font-heading font-bold text-accent uppercase tracking-wider">
              Đăng Ký Nhận Khuyến Mãi
            </h4>
            <p className="text-[13px] text-gray-300">
              Nhận voucher giảm 10% và tài liệu chăm sóc sức khỏe nguồn nước hàng tuần.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2 pt-2">
              <div className="relative">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Email của bạn..."
                  className="w-full pl-3 pr-10 py-2.5 rounded-md bg-white text-[13px] text-gray-800 focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            <div className="pt-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary-dark border border-primary flex items-center gap-2 text-[11px] text-white font-bold shadow-sm">
                <Award className="w-4 h-4 text-accent" />
                <span>ISO 13485 Medical</span>
              </div>
              <div className="p-2 rounded-md bg-primary-dark border border-primary flex items-center gap-2 text-[11px] text-white font-bold shadow-sm">
                <ShieldCheck className="w-4 h-4 text-accent" />
                <span>Hàn Quốc / Nhật Bản</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-gray-400">
          <div className="flex items-center gap-3 flex-wrap"><p>© 2026 WASY PRO. Tất cả các quyền được bảo lưu.</p><span>•</span><a href="https://mapgo.vn" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors" title="Bản đồ bãi giữ xe và tiện ích MapGo">MapGo - Bãi giữ xe & Tiện ích</a></div>
          <div className="flex items-center gap-6">
            <button onClick={() => setPolicyModal('privacy')} className="hover:text-white cursor-pointer transition-colors">Bảo mật thông tin</button>
            <button onClick={() => setPolicyModal('terms')} className="hover:text-white cursor-pointer transition-colors">Điều khoản dịch vụ</button>
            <button
              onClick={onOpenAdmin}
              className="text-white hover:text-accent font-bold transition-colors flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>
          </div>
        </div>

      </div>
    </footer>

    {/* Policy Modal */}
    {policyModal && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPolicyModal(null)} />
        <div className="relative bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto z-10">
          <div className="sticky top-0 bg-primary-darker text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
            <h2 className="text-lg font-bold">{policyContent[policyModal].title}</h2>
            <button onClick={() => setPolicyModal(null)} className="text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-5">
            {policyContent[policyModal].content.map((section, idx) => (
              <div key={idx}>
                <h3 className="text-[15px] font-bold text-gray-900 mb-2">{section.heading}</h3>
                <p className="text-[14px] text-gray-600 leading-relaxed">{section.text}</p>
              </div>
            ))}
            <div className="pt-4 border-t border-gray-100 text-center">
              <p className="text-[13px] text-gray-500">Liên hệ Hotline <strong className="text-primary">1900 98 98 78</strong> nếu cần hỗ trợ thêm.</p>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

