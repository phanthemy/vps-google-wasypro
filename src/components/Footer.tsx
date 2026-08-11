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
  Check 
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

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail && newsletterEmail.includes('@')) {
      onSuccessToast('Cảm ơn bạn đã đăng ký nhận tin khuyến mãi & thông tin sức khỏe từ WASY PRO!');
      setNewsletterEmail('');
    }
  };

  return (
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
                <button onClick={onOpenContact} className="hover:text-white transition-colors flex items-center gap-2">
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
          <p>© 2026 WASY PRO. Tất cả các quyền được bảo lưu.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-white cursor-pointer transition-colors">Bảo mật thông tin</span>
            <span className="hover:text-white cursor-pointer transition-colors">Điều khoản dịch vụ</span>
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
  );
};
