import React, { useState, useEffect, useCallback } from "react";
import { Users, Search, KeyRound, ArrowUpCircle, RefreshCw, Phone, Calendar, ShoppingCart, Loader2, AlertCircle } from "lucide-react";

function getCsrfToken(): string {
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : '';
}

interface Member {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  role: string;
  isSystemParticipant: boolean;
  createdAt: string;
  parent: string;
  orderCount: number;
}

const AdminMembersView: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/users/members", { credentials: "include" });
      const data = await res.json();
      if (data.success) setMembers(data.data);
      else setError(data.message || "Khong the tai danh sach");
    } catch { setError("Loi ket noi may chu"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handlePromote = async (m: Member) => {
    if (!window.confirm(`Nang "${m.fullName}" (${m.phone}) len CTV?\n\nHo se xuat hien trong danh sach Quan Ly CTV va bat dau tich luy qualifying points.`)) return;
    setActionLoading(m.userId + "_promote");
    try {
      const res = await fetch(`/api/admin/users/${m.userId}/promote-to-ctv`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() } });
      const data = await res.json();
      if (data.success) { setMembers(prev => prev.filter(x => x.userId !== m.userId)); alert(`Da nang "${m.fullName}" len CTV thanh cong!`); }
      else alert("Loi: " + (data.message || "Khong the nang cap"));
    } catch { alert("Loi ket noi may chu"); }
    finally { setActionLoading(null); }
  };

  const handleResetPassword = async (m: Member) => {
    if (!window.confirm(`Reset mat khau cua "${m.fullName}"?\n\nHe thong se tao mat khau tam thoi.`)) return;
    setActionLoading(m.userId + "_reset");
    try {
      const res = await fetch(`/api/admin/users/${m.userId}/reset-password`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() } });
      const data = await res.json();
      if (data.success) alert(`Da reset mat khau "${m.fullName}"\n\nMat khau tam: ${data.tempPassword}\n\nBao cho khach doi mat khau sau khi dang nhap.`);
      else alert("Loi: " + (data.message || "Khong the reset"));
    } catch { alert("Loi ket noi may chu"); }
    finally { setActionLoading(null); }
  };

  const filtered = members.filter(m =>
    m.fullName.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search) || m.userId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Users className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Tai Khoan Thanh Vien ({filtered.length})</h2>
            <p className="text-sm text-slate-500">Khach da dang ky â€” chua tham gia he thong CTV</p>
          </div>
        </div>
        <button onClick={fetchMembers} disabled={loading} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-all disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Tai lai
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tim theo ten, SDT, user ID..." className="flex-1 text-sm outline-none text-slate-700 placeholder-slate-400" />
        {search && <button onClick={() => setSearch("")} className="text-xs text-slate-400 hover:text-rose-500 font-semibold">Xoa</button>}
      </div>
      {error && <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm"><AlertCircle className="w-5 h-5 flex-shrink-0" />{error}</div>}
      {loading && <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="w-7 h-7 animate-spin mr-2" /><span className="text-sm font-semibold">Dang tai...</span></div>}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold">{search ? "Khong tim thay ket qua" : "Chua co tai khoan thanh vien nao"}</p>
        </div>
      )}
      {!loading && filtered.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left py-4 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Thanh vien</th>
                  <th className="text-left py-4 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">User ID</th>
                  <th className="text-left py-4 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Sponsor</th>
                  <th className="text-left py-4 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Don hang</th>
                  <th className="text-left py-4 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Ngay DK</th>
                  <th className="text-right py-4 px-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Thao tac</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(m => (
                  <tr key={m.userId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-black text-sm flex-shrink-0">{m.fullName.charAt(0).toUpperCase()}</div>
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{m.fullName}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{m.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5"><span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded-lg text-slate-600">{m.userId}</span></td>
                    <td className="py-4 px-5 text-sm text-slate-500">{m.parent}</td>
                    <td className="py-4 px-5"><div className="flex items-center gap-1.5 text-sm text-slate-600"><ShoppingCart className="w-3.5 h-3.5 text-slate-400" />{m.orderCount}</div></td>
                    <td className="py-4 px-5 text-xs text-slate-400"><div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(m.createdAt).toLocaleDateString("vi-VN")}</div></td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleResetPassword(m)} disabled={actionLoading === m.userId + "_reset"} title="Reset mat khau" className="p-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all disabled:opacity-50">
                          {actionLoading === m.userId + "_reset" ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handlePromote(m)} disabled={!!actionLoading} title="Nang len CTV" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-all disabled:opacity-50">
                          {actionLoading === m.userId + "_promote" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpCircle className="w-3.5 h-3.5" />}
                          Nang len CTV
                        </button>
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

export default AdminMembersView;

