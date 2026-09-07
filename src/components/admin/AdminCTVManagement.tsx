import React, { useState, useEffect } from 'react';
import {
  Users, Search, ChevronRight, ChevronLeft, User, Package, Wallet,
  AlertCircle, Loader2, X, Award, Star, Calendar, Phone, Hash, KeyRound
} from 'lucide-react';

interface CtvUser {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  tier: string;
  rank?: string | null;
  rankStatus?: string | null;
  sPoints: number;
  businessId?: string | null;
  isSystemParticipant: boolean;
  status: string;
  createdAt: string;
  parentId?: string | null;
  parent: string;
  customerCount: number;
  commissionCount: number;
  totalEarnedMoney: number;
  totalEarnedPoints: number;
  note?: string | null;
}

interface CtvDetail {
  ctv: {
    id: string; userId: string; fullName: string; phone: string;
    tier: string; rank?: string | null; rankStatus?: string | null;
    sPoints: number; businessId?: string | null; isSystemParticipant: boolean;
    status: string; createdAt: string; note?: string | null;
    parent?: { userId: string; fullName: string; phone: string } | null;
    directDownline: { userId: string; fullName: string; phone: string; rank?: string | null; tier: string }[];
  };
  customers: {
    id: string; fullName: string; phone: string; status: string;
    registeredAt: string; sponsorUser?: { userId: string; fullName: string } | null;
  }[];
  orders: {
    id: string; totalAmount: number; status: string; purchaseType: string;
    createdAt: string;
    customer: { fullName: string; phone: string };
    orderer?: { userId: string; fullName: string } | null;
    items: { service?: { name: string } | null; product?: { title: string } | null; amount: number; qty: number; lineCommissionPts: number }[];
    period?: { periodName: string; status: string } | null;
  }[];
  commissions: {
    id: string; type: string; status: string; earnedMoney?: number | null;
    earnedPoints?: number | null; ruleKey?: string | null; createdAt: string;
    order: { id: string; totalAmount: number; createdAt: string; customer: { fullName: string; phone: string } };
    period?: { periodName: string; status: string } | null;
  }[];
}

function RankBadge({ rank }: { rank?: string | null }) {
  if (!rank) return <span className="text-xs text-slate-400">—</span>;
  const map: Record<string, { label: string; cls: string }> = {
    AMBASSADOR: { label: 'Đại Sứ', cls: 'bg-amber-100 text-amber-700' },
    MANAGER: { label: 'Quản Lý', cls: 'bg-blue-100 text-blue-700' },
    SALES_MANAGER: { label: 'Quản Lý', cls: 'bg-blue-100 text-blue-700' },
    DIRECTOR: { label: 'Giám Đốc', cls: 'bg-purple-100 text-purple-700' },
    SALES_DIRECTOR: { label: 'Giám Đốc', cls: 'bg-purple-100 text-purple-700' },
  };
  const r = map[rank] ?? { label: rank, cls: 'bg-slate-100 text-slate-600' };
  return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${r.cls}`}>{r.label}</span>;
}

function getItemName(item: { service?: { name: string } | null; product?: { title: string } | null }): string {
  return item.product?.title || item.service?.name || 'Không xác định';
}

export const AdminCTVManagement: React.FC = () => {
  const [ctvList, setCtvList] = useState<CtvUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [rankFilter, setRankFilter] = useState('all');

  // Detail view
  const [selectedCtvId, setSelectedCtvId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CtvDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<'orders' | 'customers' | 'commissions' | 'network'>('orders');
  const [resetPwLoading, setResetPwLoading] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/ctv');
      if (!res.ok) throw new Error('Lỗi tải danh sách CTV');
      const body = await res.json();
      setCtvList(body?.data ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không thể tải CTV');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (id: string) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/admin/ctv/${id}`);
      if (!res.ok) throw new Error('Lỗi tải thông tin CTV');
      const body = await res.json();
      setDetail(body?.data ?? null);
    } catch (e: unknown) {
      // ignore — will show null state
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  const handleSelectCtv = (userId: string) => {
    setSelectedCtvId(userId);
    setDetailTab('orders');
    fetchDetail(userId);
  };

  const handleBack = () => { setSelectedCtvId(null); setDetail(null); };

  const filtered = ctvList.filter(u => {
    if (rankFilter !== 'all' && u.rank !== rankFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      u.userId.toLowerCase().includes(q) ||
      (u.businessId?.toLowerCase().includes(q) ?? false)
    );
  });

  // ── DETAIL VIEW ────────────────────────────────────────────────────────────
  if (selectedCtvId) {
    return (
      <div className="space-y-5 animate-in fade-in duration-300">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm font-bold text-ocean-600 hover:text-ocean-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Quay lại danh sách CTV
        </button>

        {detailLoading ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 flex flex-col items-center gap-3 text-center">
            <Loader2 className="w-8 h-8 text-ocean-600 animate-spin" />
            <p className="text-slate-500 font-medium text-sm">Đang tải thông tin CTV...</p>
          </div>
        ) : !detail ? (
          <div className="bg-white p-8 rounded-3xl border border-rose-200 text-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
            <p className="text-slate-700 font-bold">Không thể tải thông tin CTV</p>
          </div>
        ) : (
          <>
            {/* CTV Info Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-ocean-500 to-cyan-400 flex items-center justify-center text-white font-black text-xl shadow-lg">
                    {detail.ctv.fullName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{detail.ctv.fullName}</h2>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <RankBadge rank={detail.ctv.rank} />
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                        detail.ctv.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>{detail.ctv.status}</span>
                      {detail.ctv.isSystemParticipant && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-cyan-50 text-cyan-700">Thành Viên HT</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <div className="text-lg font-black text-slate-900">{detail.customers.length}</div>
                    <div className="text-[11px] text-slate-500 font-semibold">Khách</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <div className="text-lg font-black text-slate-900">{detail.orders.length}</div>
                    <div className="text-[11px] text-slate-500 font-semibold">Đơn hàng</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <div className="text-lg font-black text-emerald-700">
                      {new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(
                        detail.commissions.reduce((s, c) => s + (c.earnedMoney || 0), 0)
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-semibold">Hoa hồng</div>
                  </div>
                </div>
              </div>

              {/* Meta info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 text-sm">
                {[
                  { icon: Phone, label: 'Điện thoại', value: detail.ctv.phone },
                  { icon: Hash, label: 'User ID', value: detail.ctv.userId },
                  { icon: Hash, label: 'Business ID', value: detail.ctv.businessId || '—' },
                  { icon: Star, label: 'S-Points', value: String(detail.ctv.sPoints) },
                  { icon: User, label: 'Cấp bậc', value: (() => {
                    const r = (detail.ctv.rank || '').toUpperCase();
                    if (r === 'DIRECTOR' || r === 'SALES_DIRECTOR') return 'Giám Đốc';
                    if (r === 'MANAGER' || r === 'SALES_MANAGER') return 'Quản Lý';
                    if (r === 'AMBASSADOR') return 'Đại Sứ';
                    if (detail.ctv.isSystemParticipant) return 'Thành Viên';
                    return 'Khách Hàng';
                  })() },
                  { icon: Award, label: 'Trạng thái', value: detail.ctv.rankStatus === 'ACTIVE' ? 'Hoạt động' : detail.ctv.rankStatus || '—' },
                  { icon: User, label: 'Sponsor', value: detail.ctv.parent ? `${detail.ctv.parent.fullName} (${detail.ctv.parent.userId})` : 'Trực tiếp Công ty' },
                  { icon: Calendar, label: 'Tham gia', value: new Date(detail.ctv.createdAt).toLocaleDateString('vi-VN') },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold mb-0.5">
                      <Icon className="w-3 h-3" />{label}
                    </div>
                    <div className="font-bold text-slate-800 text-sm truncate">{value}</div>
                  </div>
                ))}
              </div>

              {detail.ctv.note && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">
                  <span className="font-bold">Ghi chú:</span> {detail.ctv.note}
                </div>
              )}

              {/* Admin Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={async () => {
                    if (!window.confirm(`Reset mật khẩu của "${detail.ctv.fullName}"?\n\nHệ thống sẽ tạo mật khẩu tạm thời. Ghi lại mật khẩu để báo cho khách.`)) return;
                    setResetPwLoading(true);
                    try {
                      const res = await fetch(`/api/admin/users/${detail.ctv.userId}/reset-password`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'X-CSRF-Token': (document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/) || [])[1] || '',
                        },
                        credentials: 'include',
                      });
                      const data = await res.json();
                      if (data.success) {
                        alert(`✅ Đã reset mật khẩu "${detail.ctv.fullName}"\n\nMật khẩu tạm: ${data.tempPassword}\n\nBáo cho khách đổi mật khẩu sau khi đăng nhập.`);
                      } else {
                        alert('Lỗi: ' + (data.message || 'Không thể reset mật khẩu'));
                      }
                    } catch {
                      alert('Lỗi kết nối máy chủ');
                    } finally {
                      setResetPwLoading(false);
                    }
                  }}
                  disabled={resetPwLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold hover:bg-amber-100 transition-all disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  {resetPwLoading ? 'Đang reset...' : 'Reset Mật Khẩu'}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
              {([
                { id: 'orders', label: `Đơn Hàng (${detail.orders.length})` },
                { id: 'customers', label: `Khách Hàng (${detail.customers.length})` },
                { id: 'commissions', label: `Hoa Hồng (${detail.commissions.length})` },
                { id: 'network', label: `Downline (${detail.ctv.directDownline.length})` },
              ] as { id: typeof detailTab; label: string }[]).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDetailTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    detailTab === tab.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              {/* Orders tab */}
              {detailTab === 'orders' && (
                detail.orders.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">Chưa có đơn hàng nào.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-extrabold uppercase">
                          <th className="py-3 px-4">Mã đơn</th>
                          <th className="py-3 px-4">Khách hàng</th>
                          <th className="py-3 px-4">Sản phẩm</th>
                          <th className="py-3 px-4">Tổng tiền</th>
                          <th className="py-3 px-4">Kỳ HH</th>
                          <th className="py-3 px-4">Loại</th>
                          <th className="py-3 px-4">Ngày</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {detail.orders.map(o => (
                          <tr key={o.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-mono text-xs font-bold text-slate-700">{o.id.slice(0, 8).toUpperCase()}</td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-800">{o.customer.fullName}</div>
                              <div className="text-[11px] text-slate-400">{o.customer.phone}</div>
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-600">
                              {o.items.map((i, idx) => (
                                <div key={idx}>{getItemName(i)} x{i.qty}</div>
                              ))}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {new Intl.NumberFormat('vi-VN').format(o.totalAmount)}đ
                            </td>
                            <td className="py-3 px-4">
                              {o.period ? (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-cyan-50 text-cyan-700">{o.period.periodName}</span>
                              ) : <span className="text-[11px] text-slate-400">—</span>}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                                o.purchaseType === 'SELF_PURCHASE' ? 'bg-purple-50 text-purple-700' : 'bg-sky-50 text-sky-700'
                              }`}>
                                {o.purchaseType === 'SELF_PURCHASE' ? 'Tự mua' : 'Khách mua'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-400">
                              {new Date(o.createdAt).toLocaleDateString('vi-VN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* Customers tab */}
              {detailTab === 'customers' && (
                detail.customers.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">Chưa có khách hàng nào.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-extrabold uppercase">
                          <th className="py-3 px-4">Khách hàng</th>
                          <th className="py-3 px-4">SĐT</th>
                          <th className="py-3 px-4">Trạng thái</th>
                          <th className="py-3 px-4">Sponsor</th>
                          <th className="py-3 px-4">Ngày đăng ký</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {detail.customers.map(c => (
                          <tr key={c.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-semibold text-slate-800">{c.fullName}</td>
                            <td className="py-3 px-4 text-slate-600">{c.phone}</td>
                            <td className="py-3 px-4">
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                                c.status === 'ARRIVED' ? 'bg-emerald-50 text-emerald-700' :
                                c.status === 'EXPIRED' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                              }`}>{c.status}</span>
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-500">
                              {c.sponsorUser ? `${c.sponsorUser.fullName} (${c.sponsorUser.userId})` : '—'}
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-400">
                              {new Date(c.registeredAt).toLocaleDateString('vi-VN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* Commissions tab */}
              {detailTab === 'commissions' && (
                detail.commissions.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">Chưa có hoa hồng nào.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-extrabold uppercase">
                          <th className="py-3 px-4">Rule / Type</th>
                          <th className="py-3 px-4">Đơn hàng</th>
                          <th className="py-3 px-4">Kỳ HH</th>
                          <th className="py-3 px-4">Điểm CP</th>
                          <th className="py-3 px-4">Tiền HH</th>
                          <th className="py-3 px-4">Trạng thái</th>
                          <th className="py-3 px-4">Ngày</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {detail.commissions.map(c => (
                          <tr key={c.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-700 text-xs">{c.ruleKey || c.type}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-xs font-mono text-slate-600">{c.order.id.slice(0, 8).toUpperCase()}</div>
                              <div className="text-[11px] text-slate-400">{c.order.customer.fullName}</div>
                            </td>
                            <td className="py-3 px-4">
                              {c.period ? (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-cyan-50 text-cyan-700">{c.period.periodName}</span>
                              ) : <span className="text-[11px] text-slate-400">—</span>}
                            </td>
                            <td className="py-3 px-4 font-bold text-cyan-600">{c.earnedPoints ?? '—'}</td>
                            <td className="py-3 px-4 font-bold text-emerald-600">
                              {c.earnedMoney != null ? `${new Intl.NumberFormat('vi-VN').format(c.earnedMoney)}đ` : '⚠ Chưa tính'}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                                c.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                              }`}>{c.status}</span>
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-400">
                              {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* Network tab */}
              {detailTab === 'network' && (
                <div className="p-5 space-y-3">
                  {detail.ctv.parent && (
                    <div className="p-4 bg-ocean-50 border border-ocean-100 rounded-2xl">
                      <div className="text-xs font-bold text-ocean-600 uppercase mb-2">Sponsor (cấp trên)</div>
                      <div className="font-bold text-slate-800">{detail.ctv.parent.fullName}</div>
                      <div className="text-xs text-slate-500">{detail.ctv.parent.userId} · {detail.ctv.parent.phone}</div>
                    </div>
                  )}
                  <div className="text-xs font-bold text-slate-600 uppercase mb-2">
                    F1 trực tiếp ({detail.ctv.directDownline.length})
                  </div>
                  {detail.ctv.directDownline.length === 0 ? (
                    <p className="text-sm text-slate-400">Chưa có F1 nào.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {detail.ctv.directDownline.map(d => (
                        <div
                          key={d.userId}
                          onClick={() => { setSelectedCtvId(d.userId); fetchDetail(d.userId); setDetailTab('orders'); }}
                          className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-ocean-50 hover:border-ocean-200 cursor-pointer transition-all"
                        >
                          <div>
                            <div className="font-bold text-slate-800 text-sm">{d.fullName}</div>
                            <div className="text-[11px] text-slate-400">{d.userId} · {d.phone}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <RankBadge rank={d.rank} />
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-ocean-600" />
            Quản Lý CTV ({filtered.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Danh sách cộng tác viên — click để xem chi tiết</p>
        </div>
        <button onClick={fetchList} className="px-4 py-2 bg-ocean-500 hover:bg-ocean-600 text-white text-sm font-bold rounded-xl transition-colors">
          Tải lại
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên, SĐT, user ID..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-ocean-500"
          />
        </div>
        <select
          value={rankFilter}
          onChange={e => setRankFilter(e.target.value)}
          className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-ocean-500"
        >
          <option value="all">Tất cả cấp bậc</option>
          <option value="AMBASSADOR">Đại Sứ</option>
          <option value="MANAGER">Quản Lý</option>
          <option value="DIRECTOR">Giám Đốc</option>
        </select>
        {(search || rankFilter !== 'all') && (
          <button onClick={() => { setSearch(''); setRankFilter('all'); }} className="px-3 text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 font-semibold">
            <X className="w-3.5 h-3.5" /> Xóa
          </button>
        )}
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 flex flex-col items-center gap-3 text-center">
          <Loader2 className="w-8 h-8 text-ocean-600 animate-spin" />
          <p className="text-slate-500 font-medium text-sm">Đang tải danh sách CTV...</p>
        </div>
      ) : error ? (
        <div className="bg-white p-8 rounded-3xl border border-rose-200 text-center space-y-2">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <p className="text-slate-700 font-bold">{error}</p>
          <button onClick={fetchList} className="text-xs text-ocean-600 font-bold hover:underline">Thử lại</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-500 font-medium">Không tìm thấy CTV nào.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider">
                  <th className="py-4 px-5">CTV</th>
                  <th className="py-4 px-5">User ID / Business ID</th>
                  <th className="py-4 px-5">Rank / Tier</th>
                  <th className="py-4 px-5">S-Points</th>
                  <th className="py-4 px-5">Khách</th>
                  <th className="py-4 px-5">Hoa Hồng</th>
                  <th className="py-4 px-5">Sponsor</th>
                  <th className="py-4 px-5 text-right">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map(u => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => handleSelectCtv(u.userId)}
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-ocean-500/10 flex items-center justify-center font-black text-ocean-600 text-sm">
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{u.fullName}</div>
                          <div className="text-xs text-slate-400">{u.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-mono text-xs font-bold text-slate-700">{u.userId}</div>
                      {u.businessId && (
                        <div className="text-[11px] text-amber-600 font-bold mt-0.5">MÃ ĐT: {u.businessId}</div>
                      )}
                    </td>
                     <td className="py-4 px-5">
                       <RankBadge rank={u.rank} />
                     </td>
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-700">{u.sPoints}</div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-slate-700">{u.customerCount}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      {u.totalEarnedMoney > 0 ? (
                        <div className="font-bold text-emerald-600">
                          {new Intl.NumberFormat('vi-VN').format(u.totalEarnedMoney)}đ
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-xs text-slate-500 max-w-[160px] truncate">{u.parent}</div>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end">
                        <ChevronRight className="w-5 h-5 text-ocean-500" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCTVManagement;
