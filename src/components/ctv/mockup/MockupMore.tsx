import React from 'react';
import { 
  Users, User, ShieldCheck, Gift, HelpCircle, ChevronRight, UserCheck, Tag, KeyRound,
  MapPin, Calendar, MessageSquare, FileCheck, Shield, Scale 
} from 'lucide-react';

interface MockupMoreProps {
  onSelectSubtab: (tab: string) => void;
  onNavigateHome: (section?: string) => void;
}

export const MockupMore: React.FC<MockupMoreProps> = ({
  onSelectSubtab,
  onNavigateHome
}) => {
  return (
    <div className="space-y-5 pb-6" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
      {/* ============================================================
          SECTION 1: MORE MENU — KHU VỰC ĐỐI TÁC
          ============================================================ */}
      <div className="space-y-2">
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', paddingLeft: '4px' }}>
          KHU VỰC ĐỐI TÁC
        </h3>

        <div 
          style={{
            background: '#FFFFFF',
            border: '1px solid #EEF2F6',
            borderRadius: '18px',
            boxShadow: '0 4px 14px rgba(15,23,42,0.05)',
            overflow: 'hidden'
          }}
          className="divide-y divide-[#EEF2F6]"
        >
          {/* Sơ đồ Tuyến dưới */}
          <button
            onClick={() => onSelectSubtab('network')}
            className="w-full flex items-center justify-between px-4 hover:bg-[#F8FAFC] transition-colors text-left"
            style={{ height: '56px' }}
          >
            <div className="flex items-center gap-3.5">
              <div 
                className="rounded-[12px] flex items-center justify-center shrink-0"
                style={{ width: '40px', height: '40px', background: '#F0F7FF', color: '#0072F5' }}
              >
                <Users className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>
                Sơ đồ Tuyến dưới
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#94A3B8] stroke-[2.5]" />
          </button>

          {/* Khách hàng của tôi */}
          <button
            onClick={() => onSelectSubtab('customers')}
            className="w-full flex items-center justify-between px-4 hover:bg-[#F8FAFC] transition-colors text-left"
            style={{ height: '56px' }}
          >
            <div className="flex items-center gap-3.5">
              <div 
                className="rounded-[12px] flex items-center justify-center shrink-0"
                style={{ width: '40px', height: '40px', background: '#F0F7FF', color: '#0072F5' }}
              >
                <UserCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>
                Khách hàng của tôi
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#94A3B8] stroke-[2.5]" />
          </button>

          {/* Bảng giá & Chiết khấu */}
          <button
            onClick={() => onSelectSubtab('price-list')}
            className="w-full flex items-center justify-between px-4 hover:bg-[#F8FAFC] transition-colors text-left"
            style={{ height: '56px' }}
          >
            <div className="flex items-center gap-3.5">
              <div 
                className="rounded-[12px] flex items-center justify-center shrink-0"
                style={{ width: '40px', height: '40px', background: '#F0F7FF', color: '#0072F5' }}
              >
                <Tag className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>
                Bảng giá & Chiết khấu
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#94A3B8] stroke-[2.5]" />
          </button>

          {/* Thông tin tài khoản */}
          <button
            onClick={() => onSelectSubtab('account')}
            className="w-full flex items-center justify-between px-4 hover:bg-[#F8FAFC] transition-colors text-left"
            style={{ height: '56px' }}
          >
            <div className="flex items-center gap-3.5">
              <div 
                className="rounded-[12px] flex items-center justify-center shrink-0"
                style={{ width: '40px', height: '40px', background: '#F0F7FF', color: '#0072F5' }}
              >
                <User className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>
                Thông tin tài khoản & Ngân hàng
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#94A3B8] stroke-[2.5]" />
          </button>

          {/* Đổi mật khẩu */}
          <button
            onClick={() => onSelectSubtab('change-password')}
            className="w-full flex items-center justify-between px-4 hover:bg-[#F8FAFC] transition-colors text-left"
            style={{ height: '56px' }}
          >
            <div className="flex items-center gap-3.5">
              <div 
                className="rounded-[12px] flex items-center justify-center shrink-0"
                style={{ width: '40px', height: '40px', background: '#F0F7FF', color: '#0072F5' }}
              >
                <KeyRound className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>
                Đổi mật khẩu
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#94A3B8] stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* ============================================================
          SECTION 2: MẠNG LƯỚI & TRUYỀN THÔNG
          ============================================================ */}
      <div className="space-y-2">
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', paddingLeft: '4px' }}>
          MẠNG LƯỚI & TRUYỀN THÔNG
        </h3>

        <div 
          style={{
            background: '#FFFFFF',
            border: '1px solid #EEF2F6',
            borderRadius: '18px',
            boxShadow: '0 4px 14px rgba(15,23,42,0.05)',
            overflow: 'hidden'
          }}
          className="divide-y divide-[#EEF2F6]"
        >
          {/* Đại lý & Showroom toàn quốc */}
          <button
            onClick={() => onSelectSubtab('dealers')}
            className="w-full flex items-center justify-between px-4 hover:bg-[#F8FAFC] transition-colors text-left"
            style={{ height: '56px' }}
          >
            <div className="flex items-center gap-3.5">
              <div 
                className="rounded-[12px] flex items-center justify-center shrink-0"
                style={{ width: '40px', height: '40px', background: '#ECFDF5', color: '#059669' }}
              >
                <MapPin className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>
                Đại lý & Showroom toàn quốc
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#94A3B8] stroke-[2.5]" />
          </button>

          {/* Sự kiện & Báo chí */}
          <button
            onClick={() => onSelectSubtab('events')}
            className="w-full flex items-center justify-between px-4 hover:bg-[#F8FAFC] transition-colors text-left"
            style={{ height: '56px' }}
          >
            <div className="flex items-center gap-3.5">
              <div 
                className="rounded-[12px] flex items-center justify-center shrink-0"
                style={{ width: '40px', height: '40px', background: '#FFF7ED', color: '#EA580C' }}
              >
                <Calendar className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>
                Sự kiện & Báo chí
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#94A3B8] stroke-[2.5]" />
          </button>

          {/* Kết quả sử dụng (Feedback) */}
          <button
            onClick={() => onSelectSubtab('feedback')}
            className="w-full flex items-center justify-between px-4 hover:bg-[#F8FAFC] transition-colors text-left"
            style={{ height: '56px' }}
          >
            <div className="flex items-center gap-3.5">
              <div 
                className="rounded-[12px] flex items-center justify-center shrink-0"
                style={{ width: '40px', height: '40px', background: '#FDF2F8', color: '#DB2777' }}
              >
                <MessageSquare className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>
                Kết quả sử dụng (Feedback)
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#94A3B8] stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* ============================================================
          SECTION 3: PHÁP LÝ & ĐIỀU KHOẢN
          ============================================================ */}
      <div className="space-y-2">
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', paddingLeft: '4px' }}>
          PHÁP LÝ & ĐIỀU KHOẢN
        </h3>

        <div 
          style={{
            background: '#FFFFFF',
            border: '1px solid #EEF2F6',
            borderRadius: '18px',
            boxShadow: '0 4px 14px rgba(15,23,42,0.05)',
            overflow: 'hidden'
          }}
          className="divide-y divide-[#EEF2F6]"
        >
          {/* Pháp lý & Giấy chứng nhận */}
          <button
            onClick={() => onSelectSubtab('legal-docs')}
            className="w-full flex items-center justify-between px-4 hover:bg-[#F8FAFC] transition-colors text-left"
            style={{ height: '56px' }}
          >
            <div className="flex items-center gap-3.5">
              <div 
                className="rounded-[12px] flex items-center justify-center shrink-0"
                style={{ width: '40px', height: '40px', background: '#F0F9FF', color: '#0284C7' }}
              >
                <FileCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>
                Pháp lý & Giấy chứng nhận
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#94A3B8] stroke-[2.5]" />
          </button>

          {/* Chính sách Công ty */}
          <button
            onClick={() => onSelectSubtab('company-policy')}
            className="w-full flex items-center justify-between px-4 hover:bg-[#F8FAFC] transition-colors text-left"
            style={{ height: '56px' }}
          >
            <div className="flex items-center gap-3.5">
              <div 
                className="rounded-[12px] flex items-center justify-center shrink-0"
                style={{ width: '40px', height: '40px', background: '#F5F3FF', color: '#7C3AED' }}
              >
                <Shield className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>
                Chính sách Công ty
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#94A3B8] stroke-[2.5]" />
          </button>

          {/* Quy định Pháp luật */}
          <button
            onClick={() => onSelectSubtab('regulations')}
            className="w-full flex items-center justify-between px-4 hover:bg-[#F8FAFC] transition-colors text-left"
            style={{ height: '56px' }}
          >
            <div className="flex items-center gap-3.5">
              <div 
                className="rounded-[12px] flex items-center justify-center shrink-0"
                style={{ width: '40px', height: '40px', background: '#FEF2F2', color: '#DC2626' }}
              >
                <Scale className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>
                Quy định Pháp luật
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#94A3B8] stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
