import React, { useState, useEffect } from 'react';
import { 
  Users, X, GitFork, Building2, User, ChevronRight, 
  TrendingUp, Award, Phone, Calendar, Search, Filter, ShieldCheck, Loader2
} from 'lucide-react';

interface DownlineMember {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  rank?: string | null;
  businessId?: string | null;
  partnerType: 'NPP' | 'CTV' | 'CUSTOMER';
  level: number; // 1: F1, 2: F2
  sponsorUserId: string;
  totalSales: number;
  createdAt: string;
}

interface DownlineData {
  npp: {
    userId: string;
    fullName: string;
    phone: string;
    businessId?: string | null;
    rank?: string | null;
    isNpp?: boolean;
    parent?: {
      userId: string;
      fullName: string;
      phone: string;
      isNpp: boolean;
      rank?: string | null;
      businessId?: string | null;
    } | null;
  };
  stats: {
    totalMembers: number;
    f1Count: number;
    f2Count: number;
    totalNpp: number;
    totalCtv: number;
    totalGroupSales: number;
  };
  downline: DownlineMember[];
}

interface Props {
  userId: string; // ID hoặc userId của NPP
  onClose: () => void;
}

function formatVND(v: number): string {
  return (v || 0).toLocaleString('vi-VN') + ' ₫';
}

const RANK_LABELS: Record<string, string> = {
  AMBASSADOR: 'Đại sứ',
  MANAGER: 'Trưởng nhóm',
  DIRECTOR: 'Quản lý',
};

export default function AdminNppDownlineModal({ userId, onClose }: Props) {
  const [data, setData] = useState<DownlineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'NPP' | 'CTV' | 'CUSTOMER'>('ALL');
  const [filterLevel, setFilterLevel] = useState<'ALL' | '1' | '2'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'LIST' | 'TREE'>('LIST');

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/npp/${userId}/downline`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Không thể tải dữ liệu sơ đồ tuyến dưới.');
        return res.json();
      })
      .then(json => {
        if (json.success) {
          setData(json.data);
        } else {
          throw new Error(json.message || 'Lỗi lấy dữ liệu.');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <Loader2 className="w-10 h-10 text-cyan-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Đang khởi tạo sơ đồ cây tuyến dưới của NPP...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
          <div className="text-red-600 font-bold text-lg flex items-center gap-2">
            <X className="w-5 h-5" /> Thông Báo
          </div>
          <p className="text-sm text-slate-600">{error || 'Không tìm thấy dữ liệu.'}</p>
          <button onClick={onClose} className="w-full py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition">
            Đóng
          </button>
        </div>
      </div>
    );
  }

  const filteredMembers = data.downline.filter(m => {
    if (filterType !== 'ALL' && m.partnerType !== filterType) return false;
    if (filterLevel !== 'ALL' && String(m.level) !== filterLevel) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = m.fullName.toLowerCase().includes(term);
      const matchPhone = m.phone.toLowerCase().includes(term);
      const matchId = m.userId.toLowerCase().includes(term);
      if (!matchName && !matchPhone && !matchId) return false;
    }
    return true;
  });

  const f1Members = data.downline.filter(m => m.level === 1);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <GitFork className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Sơ Đồ Tuyến Dưới NPP: {data.npp.fullName}</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-500/30 text-purple-200 border border-purple-400/30">
                  {RANK_LABELS[data.npp.rank || ''] || data.npp.rank || 'NPP'}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono">
                Mã: {data.npp.userId} {data.npp.businessId ? `· BID: ${data.npp.businessId}` : ''} · SĐT: {data.npp.phone}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY CONTAINER */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          
          {/* KHUNG THÔNG TIN NGƯỜI GIỚI THIỆU (UPLINE / BẢO TRỢ) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-300 text-amber-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Người Giới Thiệu (Tuyến Trên Trực Tiếp)
                </div>
                {data.npp.parent ? (
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="font-bold text-slate-800 text-base">{data.npp.parent.fullName}</span>
                    <span className="text-xs font-mono text-slate-500 font-semibold">({data.npp.parent.userId} · {data.npp.parent.phone})</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      data.npp.parent.isNpp
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {data.npp.parent.isNpp ? '🏷️ NPP' : '🏷️ CTV'}
                    </span>
                    {data.npp.parent.rank && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                        ⭐ {RANK_LABELS[data.npp.parent.rank] || data.npp.parent.rank}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-sky-700 flex items-center gap-1.5 mt-0.5">
                    <span>🏛️ Trực tiếp Công ty (F0 - Không qua người bảo trợ)</span>
                  </div>
                )}
              </div>
            </div>
            {data.npp.parent && (
              <div className="text-xs text-slate-500 sm:text-right">
                Bảo trợ trực tiếp cho <strong className="text-cyan-700">{data.npp.fullName}</strong>
              </div>
            )}
          </div>

          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-500" /> Tổng Tuyến Dưới
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{data.stats.totalMembers}</span>
                <span className="text-xs text-slate-500">thành viên</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                F1: <strong className="text-blue-600">{data.stats.f1Count}</strong> · F2: <strong className="text-indigo-600">{data.stats.f2Count}</strong>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-purple-200/80 bg-purple-50/20 shadow-sm flex flex-col justify-between">
              <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-purple-600" /> NPP Cấp Dưới
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-purple-700">{data.stats.totalNpp}</span>
                <span className="text-xs text-purple-600 font-medium">đối tác NPP</span>
              </div>
              <div className="text-[11px] text-purple-600/70 mt-1">
                Đã đăng ký / Mua gói sỉ
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-blue-200/80 bg-blue-50/20 shadow-sm flex flex-col justify-between">
              <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" /> CTV Bán Lẻ
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-blue-700">{data.stats.totalCtv}</span>
                <span className="text-xs text-blue-600 font-medium">cộng tác viên</span>
              </div>
              <div className="text-[11px] text-blue-600/70 mt-1">
                Hoạt động bán máy lẻ
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-sky-200/80 bg-sky-50/20 shadow-sm flex flex-col justify-between">
              <div className="text-[11px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-sky-600" /> Doanh Số Nhánh
              </div>
              <div className="mt-2">
                <span className="text-xl font-black text-sky-700">{formatVND(data.stats.totalGroupSales)}</span>
              </div>
              <div className="text-[11px] text-sky-600/70 mt-1">
                Tổng phát sinh từ toàn cây
              </div>
            </div>
          </div>

          {/* VIEW SWITCHER & FILTERS */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm tên, SĐT, User ID..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  />
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setViewMode('LIST')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition ${viewMode === 'LIST' ? 'bg-white text-cyan-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Bảng Phân Tầng
                  </button>
                  <button
                    onClick={() => setViewMode('TREE')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition ${viewMode === 'TREE' ? 'bg-white text-cyan-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Cây Phả Hệ
                  </button>
                </div>
              </div>

              {/* FILTER BADGES */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value as any)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
                >
                  <option value="ALL">Mọi đối tác</option>
                  <option value="NPP">Chỉ xem NPP</option>
                  <option value="CTV">Chỉ xem CTV</option>
                  <option value="CUSTOMER">Khách lẻ</option>
                </select>

                <select
                  value={filterLevel}
                  onChange={e => setFilterLevel(e.target.value as any)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
                >
                  <option value="ALL">Mọi tầng (F1 + F2)</option>
                  <option value="1">Chỉ F1 (Trực tiếp)</option>
                  <option value="2">Chỉ F2 (Gián tiếp)</option>
                </select>
              </div>
            </div>
          </div>

          {/* VIEW CONTENT */}
          {viewMode === 'LIST' ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Tầng</th>
                      <th className="py-3 px-4">Thành Viên</th>
                      <th className="py-3 px-4">Loại Đối Tác</th>
                      <th className="py-3 px-4">Cấp Bậc & BID</th>
                      <th className="py-3 px-4">Bảo Trợ Bởi</th>
                      <th className="py-3 px-4 text-right">Doanh Số Đóng Góp</th>
                      <th className="py-3 px-4 text-center">Ngày Tham Gia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Không tìm thấy thành viên tuyến dưới nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              m.level === 1 ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-purple-100 text-purple-700 border border-purple-200'
                            }`}>
                              {m.level === 1 ? 'F1 Trực tiếp' : 'F2 Gián tiếp'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{m.fullName}</div>
                            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                              <span>ID: {m.userId}</span>
                              <span>·</span>
                              <span>{m.phone}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {m.partnerType === 'NPP' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-extrabold text-[10px] bg-purple-100 text-purple-800 border border-purple-300">
                                <Building2 className="w-3 h-3" /> NPP
                              </span>
                            ) : m.partnerType === 'CTV' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-extrabold text-[10px] bg-blue-100 text-blue-800 border border-blue-300">
                                <User className="w-3 h-3" /> CTV
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium text-[10px] bg-slate-100 text-slate-600">
                                Khách lẻ
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-700">
                              {RANK_LABELS[m.rank || ''] || m.rank || 'Thành viên'}
                            </div>
                            {m.businessId ? (
                              <div className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                {m.businessId}
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-400 italic">Chưa có BID</div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                            {m.sponsorUserId === data.npp.userId ? (
                              <span className="text-cyan-700 font-bold">Chính NPP ({data.npp.userId})</span>
                            ) : (
                              <span>F1: {m.sponsorUserId}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="font-extrabold text-slate-900">{formatVND(m.totalSales)}</div>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-500 text-[11px]">
                            {new Date(m.createdAt).toLocaleDateString('vi-VN')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* TREE PHẢ HỆ VIEW */
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3 p-4 bg-slate-900 text-white rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold">
                  GỐC
                </div>
                <div>
                  <div className="font-extrabold text-base flex items-center gap-2">
                    {data.npp.fullName} <span className="text-xs text-cyan-300 font-mono">({data.npp.userId})</span>
                  </div>
                  <div className="text-xs text-slate-300">Nhà Phân Phối Cấp Cao · Cây bảo trợ toàn nhánh</div>
                </div>
              </div>

              {/* F1 NODES */}
              <div className="pl-6 border-l-2 border-dashed border-slate-300 space-y-4 pt-2">
                {f1Members.length === 0 ? (
                  <div className="text-xs text-slate-400 italic">Chưa có thành viên F1 nào.</div>
                ) : (
                  f1Members.map(f1 => {
                    const f2OfThisF1 = data.downline.filter(m => m.level === 2 && m.sponsorUserId === f1.userId);
                    return (
                      <div key={f1.id} className="space-y-3">
                        {/* F1 ITEM */}
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-100/80 transition">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                              F1
                            </span>
                            <div>
                              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                {f1.fullName}
                                {f1.partnerType === 'NPP' ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">NPP</span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">CTV</span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 font-mono">ID: {f1.userId} · SĐT: {f1.phone}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-extrabold text-sky-700 text-xs">{formatVND(f1.totalSales)}</div>
                            <div className="text-[10px] text-slate-400">{f2OfThisF1.length} tuyến dưới (F2)</div>
                          </div>
                        </div>

                        {/* F2 SUB-TREE */}
                        {f2OfThisF1.length > 0 && (
                          <div className="pl-8 border-l-2 border-indigo-200 space-y-2">
                            {f2OfThisF1.map(f2 => (
                              <div key={f2.id} className="p-2.5 bg-white rounded-lg border border-slate-100 shadow-sm flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[9px] font-bold">
                                    F2
                                  </span>
                                  <div>
                                    <span className="font-semibold text-slate-800">{f2.fullName}</span>
                                    <span className="text-slate-400 font-mono text-[10px] ml-1.5">({f2.userId})</span>
                                  </div>
                                </div>
                                <div className="font-bold text-slate-700">
                                  {formatVND(f2.totalSales)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Tổng số thành viên hiển thị: <strong className="text-slate-800">{filteredMembers.length}</strong></span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition"
          >
            Đóng Sơ Đồ
          </button>
        </div>

      </div>
    </div>
  );
}
