import React, { useState, useEffect } from 'react';
import { X, FileText, Download, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/system/terms')
        .then(r => r.json())
        .then(res => {
          if (res.success && res.data) {
            setDoc(res.data);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const fileUrl = doc?.fileUrl || '/docs/quy-che-doi-tac-wasypro.pdf';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div 
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[88dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Điều Khoản & Quy Chế Đối Tác</h3>
              <p className="text-[11px] text-white/70">Chính sách kinh doanh & quyền lợi đại lý chính thức</p>
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
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* File Card with Download Button */}
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="min-w-0">
              <div className="text-xs font-bold text-sky-950 uppercase tracking-wide">
                {doc?.title || 'Quy chế hoạt động & Chính sách đối tác kinh doanh WasyPro'}
              </div>
              <div className="text-[11px] text-sky-700 mt-0.5">
                Phiên bản: <b>{doc?.version || '2026.1'}</b> • Cập nhật: <b>{doc?.updatedAt ? new Date(doc.updatedAt).toLocaleDateString('vi-VN') : '10/2026'}</b>
              </div>
            </div>

            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-[#0072F5] hover:bg-[#0052CC] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file văn bản (PDF)</span>
            </a>
          </div>

          {/* Key Clauses */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Nội Dung Chính Sách & Điều Khoản Cốt Lõi</span>
            </h4>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0072F5]" />
                  <span>1. Quyền Lợi Hoa Hồng & Điểm Tích Lũy</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Đối tác kinh doanh được hưởng hoa hồng trực tiếp trên đơn hàng phát sinh, chiết khấu theo cấp bậc đạt chuẩn, và hoa hồng phát triển đối tác gián tiếp theo đúng tỷ lệ niêm yết trong bảng biểu chính sách của WasyPro.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0072F5]" />
                  <span>2. Bảo Mật Tài Khoản Ngân Hàng & Thanh Toán</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Mỗi tài khoản đối tác chỉ được liên kết với một số tài khoản ngân hàng chính chủ. Sau khi xác nhận lần đầu, hệ thống sẽ tự động khóa để bảo vệ an toàn dòng tiền. Mọi yêu cầu thay đổi bắt buộc phải xác minh danh tính qua Admin.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0072F5]" />
                  <span>3. Đạo Đức Kinh Doanh & Trách Nhiệm Tư Vấn</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Đối tác cam kết cung cấp đúng thông tin tính năng kỹ thuật máy lọc nước Water King Hydrogen, giá bán niêm yết chuẩn mực và tôn trọng quyền lợi bảo hành của người tiêu dùng.
                </p>
              </div>
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
