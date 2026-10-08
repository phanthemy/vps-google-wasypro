import React, { useState, useEffect } from 'react';
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
  const [contactConfig, setContactConfig] = useState({
    facebook: 'https://facebook.com/wasypro',
    zalo: 'https://zalo.me/2928413591064686973',
    hotline: '1900 98 98 78',
    hotlineTel: '1900989878',
    email: 'support@wasypro.com',
    address: 'Tầng 6, Tòa nhà WASY Tower, Q. Cầu Giấy, TP. Hà Nội',
  });

  useEffect(() => {
    fetch('/api/public/contact-config')
      .then(r => r.json())
      .then(d => {
        if (d && d.success && d.data) {
          setContactConfig(prev => ({ ...prev, ...d.data }));
        }
      })
      .catch(() => {});
  }, []);


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
    },
    return: {
      title: 'Chính Sách Đổi Trả',
      content: [
        { heading: '1. Điều kiện đổi trả', text: 'Sản phẩm lỗi do nhà sản xuất (hỏng hóc kỹ thuật, móp méo khi nhận hàng). Hàng phải còn nguyên tem mác, phiếu bảo hành và phụ kiện đi kèm.' },
        { heading: '2. Thời gian đổi trả', text: 'Khách hàng có quyền đổi sản phẩm mới cùng loại trong vòng 7 ngày kể từ ngày nhận hàng.' },
        { heading: '3. Quy trình xử lý', text: 'Quý khách vui lòng gọi Hotline để thông báo tình trạng. Kỹ thuật viên sẽ kiểm tra và xác nhận. Sau đó, chúng tôi sẽ tiến hành đổi trả tận nhà miễn phí.' },
      ]
    },
    shipping: {
      title: 'Chính Sách Giao Hàng',
      content: [
        { heading: '1. Phạm vi giao hàng', text: 'WASY PRO giao hàng và lắp đặt tận nơi trên toàn quốc, có kỹ thuật viên đi kèm tại các thành phố lớn.' },
        { heading: '2. Phí giao hàng', text: 'Miễn phí giao hàng và công lắp đặt đối với các sản phẩm Máy lọc nước.' },
        { heading: '3. Thời gian giao hàng', text: 'Khu vực nội thành (HCM, Hà Nội): Giao và lắp trong vòng 24h. Khu vực tỉnh: Từ 2-5 ngày làm việc.' },
      ]
    },
    payment: {
      title: 'Chính Sách Thanh Toán',
      content: [
        { heading: '1. Thanh toán khi nhận hàng (COD)', text: 'Đối với khách hàng mua qua ứng dụng Zalo, chúng tôi áp dụng hình thức thanh toán trực tiếp cho nhân viên khi nhận hàng và kiểm tra máy thành công.' },
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
                <span>Trụ sở chính: {contactConfig.address}</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-300">
                <PhoneCall className="w-4 h-4 text-accent flex-shrink-0" />
                <a href={`tel:${contactConfig.hotlineTel}`} className="font-bold text-accent hover:underline">
                  Hotline 24/7: {contactConfig.hotline}
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-gray-300">
                <Mail className="w-4 h-4 text-accent flex-shrink-0" />
                <span>Email: {contactConfig.email}</span>
              </div>
            </div>

            {/* Social Icons: Facebook, Zalo, Hotline */}
            <div className="pt-2 flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-300">Kết nối:</span>
              <div className="flex items-center gap-2.5">
                {/* Facebook */}
                <a
                  href={contactConfig.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer"
                  title="Facebook WASY PRO"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                {/* Zalo */}
                <a
                  href={contactConfig.zalo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white text-[#0068FF] border border-blue-200 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer"
                  title="Zalo Official Account"
                >
                  <span className="font-extrabold text-[10px]">Zalo</span>
                </a>

                {/* Hotline */}
                <a
                  href={`tel:${contactConfig.hotlineTel}`}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff3b30] to-[#e60000] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer"
                  title={`Gọi Hotline ${contactConfig.hotline}`}
                >
                  <PhoneCall className="w-4 h-4" />
                </a>
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
          <div className="flex items-center justify-center gap-3 flex-wrap sm:gap-6 pb-6">
            <button onClick={() => { console.log("CLICKED PRIVACY"); setPolicyModal('privacy'); }} className="hover:text-white cursor-pointer transition-colors py-2 px-2 border border-gray-600 rounded">Bảo mật thông tin</button>
            <button onClick={() => setPolicyModal('terms')} className="hover:text-white cursor-pointer transition-colors py-2 px-2 border border-gray-600 rounded">Điều khoản</button>
            <button onClick={() => setPolicyModal('return' as any)} className="hover:text-white cursor-pointer transition-colors py-2 px-2 border border-gray-600 rounded">Đổi trả</button>
            <button onClick={() => setPolicyModal('shipping' as any)} className="hover:text-white cursor-pointer transition-colors py-2 px-2 border border-gray-600 rounded">Giao hàng</button>
            <button onClick={() => setPolicyModal('payment' as any)} className="hover:text-white cursor-pointer transition-colors py-2 px-2 border border-gray-600 rounded">Thanh toán</button>
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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-5">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPolicyModal(null)} />
        <div className="relative bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto z-10">
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
              <p className="text-[13px] text-gray-500">Liên hệ Hotline <strong className="text-primary">{contactConfig.hotline}</strong> nếu cần hỗ trợ thêm.</p>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

