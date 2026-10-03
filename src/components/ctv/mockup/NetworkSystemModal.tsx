import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Users, 
  Share2, 
  Award, 
  Coins, 
  Check, 
  ChevronRight, 
  UserCheck, 
  TrendingUp, 
  Phone, 
  Search,
  DollarSign,
  Briefcase,
  Layers,
  ArrowDownCircle
} from 'lucide-react';
import { UserSession } from '../../../hooks/useUnifiedAuth';

interface NetworkSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession;
  onOpenNetworkTree?: () => void;
}

export const NetworkSystemModal: React.FC<NetworkSystemModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenNetworkTree,
}) => {
  const [activeTab, setActiveTab] = useState<'direct' | 'indirect'>('direct');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState({
    directCount: 0,
    indirectCount: 0,
    totalMembers: 0,
    qualifyingPoints: 0,
    sPoints: 0,
    rank: 'AMBASSADOR',
    directSales: 0,
    indirectSales: 0,
    totalSales: 0,
    directCommission: 0,
    indirectCommission: 0,
    totalCommission: 0,
    directPartners: [] as any[],
    indirectPartners: [] as any[],
  });

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setSearchQuery('');
      fetch('/api/ctv/network-summary', { credentials: 'include' })
        .then(r => r.json())
        .then(res => {
          if (res.success && res.data) {
            setData(res.data);
          }
        })
        .catch(err => console.error('Fetch network summary error:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  // Click card to switch tab & scroll to list
  const handleSelectTabWithScroll = (tab: 'direct' | 'indirect') => {
    setActiveTab(tab);
    setSearchQuery('');
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  };

  const vnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n || 0) + ' đ';

  // Filter partners based on search query
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    const matches = (p: any) => {
      const name = (p.fullName || '').toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      const code = (p.userId || p.id || '').toLowerCase();
      const sponsor = (p.sponsorName || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || code.includes(q) || sponsor.includes(q);
    };

    const directMatches = (data.directPartners || []).filter(matches).map(p => ({ ...p, _kind: 'direct' }));
    const indirectMatches = (data.indirectPartners || []).filter(matches).map(p => ({ ...p, _kind: 'indirect' }));

    return [...directMatches, ...indirectMatches];
  }, [searchQuery, data]);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://test.wasypro.com';
  const partnerId = currentUser.id || currentUser.userId;
  const refLink = `${origin}/?ref=${partnerId}`;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div 
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[90dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#00B050] to-[#008A3E] text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Hệ Thống Đối Tác Kinh Doanh</h3>
              <p className="text-[11px] text-white/80">Quản lý mạng lưới đối tác Trực tiếp, Gián tiếp & Doanh số</p>
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
          {/* Quick Invite Card */}
          <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#065F46] uppercase tracking-wide">Mời Thêm Đối Tác Kinh Doanh</div>
              <div className="text-[11px] text-[#047857] truncate mt-0.5">Chia sẻ link để cùng mở rộng mạng lưới phân phối</div>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3.5 py-2 bg-[#00B050] hover:bg-[#008A3E] text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-1.5 active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép link'}</span>
            </button>
          </div>

          {/* TOTAL SALES HERO BANNER (Doanh số toàn hệ thống) */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-sky-200 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-sky-300" />
                <span>Tổng Doanh Số Mạng Lưới</span>
              </div>
              <div className="text-2xl font-black text-white mt-1">
                {vnd(data.totalSales || 0)}
              </div>
              <div className="text-[11px] text-sky-200/80 mt-0.5 flex items-center gap-3">
                <span>Trực tiếp: <b>{vnd(data.directSales || 0)}</b></span>
                <span>•</span>
                <span>Gián tiếp: <b>{vnd(data.indirectSales || 0)}</b></span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Tổng Hoa Hồng</div>
              <div className="text-lg font-black text-emerald-300 mt-1">
                {vnd(data.totalCommission || 0)}
              </div>
            </div>
          </div>

          {/* 4 CORE KPI CARDS (Bấm vào trực tiếp / gián tiếp để lọc danh sách) */}
          <div className="grid grid-cols-2 gap-3">
            {/* CARD 1: ĐỐI TÁC TRỰC TIẾP (BẤM VÀO HIỆN DANH SÁCH TRỰC TIẾP) */}
            <div 
              onClick={() => handleSelectTabWithScroll('direct')}
              className={`border rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98] ${
                activeTab === 'direct' && !searchQuery
                  ? 'bg-blue-50/80 border-[#0072F5] ring-2 ring-[#0072F5]/20 shadow-xs'
                  : 'bg-slate-50 border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Đối tác Trực tiếp</span>
                </div>
                <span className="text-[10px] text-blue-600 font-bold bg-blue-100 px-1.5 py-0.5 rounded-sm">Xem ↓</span>
              </div>
              <div className="mt-2 mb-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-blue-600">{data.directCount}</span>
                <span className="text-xs text-slate-500 font-medium">đối tác</span>
              </div>
              <div className="space-y-0.5 text-[11px]">
                <div className="text-slate-600">Doanh số: <b className="text-slate-900">{vnd(data.directSales || 0)}</b></div>
                <div className="text-blue-600 font-semibold truncate">Hoa hồng: {vnd(data.directCommission)}</div>
              </div>
            </div>

            {/* CARD 2: ĐỐI TÁC GIÁN TIẾP (BẤM VÀO HIỆN DANH SÁCH GIÁN TIẾP) */}
            <div 
              onClick={() => handleSelectTabWithScroll('indirect')}
              className={`border rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98] ${
                activeTab === 'indirect' && !searchQuery
                  ? 'bg-emerald-50/80 border-[#00B050] ring-2 ring-[#00B050]/20 shadow-xs'
                  : 'bg-slate-50 border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đối tác Gián tiếp</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 px-1.5 py-0.5 rounded-sm">Xem ↓</span>
              </div>
              <div className="mt-2 mb-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-emerald-600">{data.indirectCount}</span>
                <span className="text-xs text-slate-500 font-medium">đối tác</span>
              </div>
              <div className="space-y-0.5 text-[11px]">
                <div className="text-slate-600">Doanh số: <b className="text-slate-900">{vnd(data.indirectSales || 0)}</b></div>
                <div className="text-emerald-600 font-semibold truncate">Hoa hồng: {vnd(data.indirectCommission)}</div>
              </div>
            </div>

            {/* CARD 3: ĐIỂM TÍCH LŨY */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col justify-between">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Điểm tích lũy</span>
              </div>
              <div className="mt-2 mb-1">
                <span className="text-2xl font-black text-amber-600">
                  {data.qualifyingPoints.toLocaleString('vi-VN')}
                </span>
                <span className="text-xs text-slate-500 ml-1 font-medium">CP</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium truncate">
                Điểm mua sắm: {data.sPoints.toLocaleString('vi-VN')} SP
              </div>
            </div>

            {/* CARD 4: CẤP BẬC ĐẠT CHUẨN */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col justify-between">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#0072F5]" />
                <span>Cấp bậc mạng lưới</span>
              </div>
              <div className="mt-2 mb-1">
                <span className="text-base font-black text-[#0072F5]">
                  {data.rank || 'AMBASSADOR'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Tổng quân số: <b>{data.totalMembers}</b> đối tác
              </div>
            </div>
          </div>

          {/* SEARCH BAR (TÌM KIẾM TRONG CÙNG CÂY HỆ THỐNG) */}
          <div ref={listRef} className="pt-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên, SĐT, mã đối tác trong cây của bạn..."
                className="w-full text-xs pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 focus:border-[#00B050] focus:ring-1 focus:ring-[#00B050] outline-hidden font-medium bg-slate-50/70"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* TAB SWITCHER (Nếu không tìm kiếm) */}
          {!searchQuery && (
            <div className="flex bg-slate-100 p-1 rounded-xl shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab('direct')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'direct'
                    ? 'bg-white text-blue-700 shadow-2xs scale-[1.01]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Đối tác Trực tiếp ({data.directCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('indirect')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'indirect'
                    ? 'bg-white text-emerald-700 shadow-2xs scale-[1.01]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Đối tác Gián tiếp ({data.indirectCount})</span>
              </button>
            </div>
          )}

          {/* PARTNERS LIST / SEARCH RESULTS */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <div className="w-5 h-5 border-2 border-[#00B050] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span>Đang tải danh sách đối tác...</span>
              </div>
            ) : searchResults ? (
              // HIỂN THỊ KẾT QUẢ TÌM KIẾM
              searchResults.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-4">
                  <p className="text-xs text-slate-600 font-bold">Không tìm thấy đối tác nào khớp với từ khóa "{searchQuery}"</p>
                  <p className="text-[11px] text-slate-400 mt-1">Hệ thống chỉ tìm kiếm đối tác trực thuộc trong cây của bạn.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-[11px] text-slate-500 font-semibold px-1">
                    Tìm thấy <b>{searchResults.length}</b> đối tác trong mạng lưới của bạn:
                  </div>
                  {searchResults.map((p) => (
                    <div key={p.id || p.userId} className="p-3 bg-white border border-slate-200/90 rounded-xl hover:border-slate-300 transition-all shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">{p.fullName}</div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-mono">{p.phone}</span>
                            <span>•</span>
                            <span className="font-mono text-blue-600 font-bold">{p.userId}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {p._kind === 'direct' ? (
                            <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-extrabold rounded-md border border-blue-200">
                              Đối tác Trực tiếp
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md border border-emerald-200">
                              Đối tác Gián tiếp
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Hiển thị rõ người bảo trợ nếu là gián tiếp */}
                      {p._kind === 'indirect' && (
                        <div className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                          Thuộc nhóm đối tác: <b>{p.sponsorName || p.parentId}</b>
                        </div>
                      )}

                      {/* Doanh số & Điểm */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-500">Doanh số: <b className="text-slate-900">{vnd(p.sales || 0)}</b></span>
                        <span className="text-slate-500">Điểm: <b className="text-amber-600">{p.qualifyingPoints ? `${p.qualifyingPoints} CP` : '0 CP'}</b></span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : activeTab === 'direct' ? (
              // DANH SÁCH ĐỐI TÁC TRỰC TIẾP
              data.directPartners.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500 font-medium">Chưa có đối tác trực tiếp nào.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Chia sẻ link giới thiệu để mở rộng hệ thống.</p>
                </div>
              ) : (
                data.directPartners.map((p) => (
                  <div key={p.id || p.userId} className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between hover:border-slate-300 transition-all shadow-2xs">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{p.fullName}</div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono">{p.phone}</span>
                        <span>•</span>
                        <span className="font-mono text-blue-600 font-bold">{p.userId}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1">
                        Doanh số: <b className="text-slate-900">{vnd(p.sales || 0)}</b>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md border border-blue-200">
                        {p.rank || 'Đối Tác'}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {p.qualifyingPoints ? `${p.qualifyingPoints} CP` : 'Chưa có điểm'}
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              // DANH SÁCH ĐỐI TÁC GIÁN TIẾP
              data.indirectPartners.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500 font-medium">Chưa có đối tác gián tiếp nào.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Hệ thống đối tác gián tiếp sẽ phát sinh khi đối tác trực tiếp mở rộng thêm thành viên.</p>
                </div>
              ) : (
                data.indirectPartners.map((p) => (
                  <div key={p.id || p.userId} className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between hover:border-slate-300 transition-all shadow-2xs">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{p.fullName}</div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono text-emerald-600 font-bold">{p.userId}</span>
                        <span>•</span>
                        <span>Người bảo trợ: <b>{p.sponsorName}</b></span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1">
                        Doanh số: <b className="text-slate-900">{vnd(p.sales || 0)}</b>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200">
                        Gián tiếp
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {p.qualifyingPoints ? `${p.qualifyingPoints} CP` : 'Chưa có điểm'}
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>

          {/* Action: Open Tree View */}
          {onOpenNetworkTree && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => { onClose(); onOpenNetworkTree(); }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <span>Xem sơ đồ cây đối tác toàn diện</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
