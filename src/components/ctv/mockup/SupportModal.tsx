import React from 'react';
import { X, Headphones, Phone, MessageSquare, Mail, Clock, ShieldCheck, ExternalLink } from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div 
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[88dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Trung Tâm Hỗ Trợ Đối Tác</h3>
              <p className="text-[11px] text-white/80">Kênh giải đáp chính thức, kỹ thuật & đối soát hoa hồng</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer shrink-0" aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
          {/* Zalo OA Box */}
          <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#0068FF] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                OA
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Zalo Official Account</div>
                <div className="text-[11px] text-slate-500">Kênh hỗ trợ 1:1 cùng chuyên viên tư vấn</div>
              </div>
            </div>

            <a
              href="https://zalo.me/0937353535"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-[#0068FF] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 shrink-0 active:scale-95"
            >
              <span>Mở Zalo</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Hotline 24/7 */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#00B050] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Tổng Đài CSKH Toàn Quốc</div>
                <div className="text-[11px] text-slate-500">Hỗ trợ kỹ thuật máy lọc nước & đơn hàng</div>
                <div className="text-sm font-black text-[#00B050] mt-0.5 font-mono">1900 98 98 78</div>
              </div>
            </div>

            <a
              href="tel:1900989878"
              className="px-3.5 py-2 bg-[#00B050] hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 shrink-0 active:scale-95"
            >
              <span>Gọi ngay</span>
              <Phone className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Hotline Đối Soát & Hoa Hồng */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Kế Toán & Đối Soát Hoa Hồng</div>
                <div className="text-[11px] text-slate-500">Xác minh tài khoản ngân hàng & chi trả</div>
                <div className="text-sm font-black text-amber-700 mt-0.5 font-mono">0937 35 35 35</div>
              </div>
            </div>

            <a
              href="tel:0937353535"
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 shrink-0 active:scale-95"
            >
              <span>Gọi ngay</span>
              <Phone className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Working hours & Email */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center gap-2 text-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Thời gian làm việc: <b>08:00 – 21:00</b> (Thứ 2 – Chủ Nhật)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Email: <b>support@wasypro.com</b></span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
