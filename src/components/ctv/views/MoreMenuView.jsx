import React from 'react';
import { 
  Users, 
  UserCog, 
  ShieldCheck, 
  Gift, 
  HelpCircle, 
  Info, 
  PhoneCall, 
  FileText, 
  ChevronRight, 
  LogOut,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

export default function MoreMenuView({ onSelectTab, onNavigateHome, onLogout, currentUser }) {
  return (
    <div className="max-w-xl mx-auto space-y-5 animate-fadeIn pb-12">
      {/* Header Back */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <button
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Trang chủ</span>
        </button>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Menu Thêm</span>
      </div>

      {/* GROUP 1: KHU VỰC ĐỐI TÁC */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <h3 className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wider">
          Khu Vực Đối Tác
        </h3>
        <div className="space-y-1">
          <button
            onClick={() => onSelectTab('network')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-sky-50/60 hover:bg-sky-100/70 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-gray-900 group-hover:text-primary transition-colors">
                  Sơ đồ Tuyến dưới
                </p>
                <p className="text-[11px] text-gray-500">Xem mạng lưới F1, F2 và đội nhóm</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </button>

          <button
            onClick={() => onSelectTab('account')}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold shadow-xs">
                <UserCog className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-gray-900 group-hover:text-primary transition-colors">
                  Thông tin tài khoản
                </p>
                <p className="text-[11px] text-gray-500">Hồ sơ cá nhân, người bảo trợ và bảo mật</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>

      {/* GROUP 2: HỖ TRỢ KHÁCH HÀNG */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <h3 className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
          Hỗ Trợ Khách Hàng
        </h3>
        <div className="divide-y divide-gray-100">
          <button
            onClick={onNavigateHome}
            className="w-full flex items-center justify-between py-3 hover:bg-gray-50 px-2 rounded-xl transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-sky-600" />
              <span className="text-xs font-bold text-gray-800">Chính sách bảo hành</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={onNavigateHome}
            className="w-full flex items-center justify-between py-3 hover:bg-gray-50 px-2 rounded-xl transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-amber-500" />
              <span className="text-xs font-bold text-gray-800">Lợi ích sản phẩm</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={onNavigateHome}
            className="w-full flex items-center justify-between py-3 hover:bg-gray-50 px-2 rounded-xl transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-indigo-500" />
              <span className="text-xs font-bold text-gray-800">Hỏi đáp thường gặp</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* GROUP 3: VỀ WASY PRO */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <h3 className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
          Về Wasy Pro
        </h3>
        <div className="divide-y divide-gray-100">
          <button
            onClick={onNavigateHome}
            className="w-full flex items-center justify-between py-3 hover:bg-gray-50 px-2 rounded-xl transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-bold text-gray-800">Giới thiệu công ty</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={onNavigateHome}
            className="w-full flex items-center justify-between py-3 hover:bg-gray-50 px-2 rounded-xl transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <PhoneCall className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-bold text-gray-800">Liên hệ & Đại lý</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Logout button */}
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs border border-red-200 transition-all shadow-xs"
      >
        <LogOut className="w-4 h-4" />
        <span>Đăng xuất khỏi tài khoản</span>
      </button>
    </div>
  );
}
