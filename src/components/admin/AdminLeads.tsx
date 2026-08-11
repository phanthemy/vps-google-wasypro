import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  Search,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Clock,
  User,
  Package,
  MessageSquareText,
  Filter
} from 'lucide-react';
import { api } from '../../services/api';
import { Lead } from '../../types/schema';

export const AdminLeads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeTabStatus, setActiveTabStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getLeads();
      setLeads(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Không thể tải danh sách đơn đăng ký tư vấn');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStatusChange = async (id: string, newStatus: 'new' | 'contacted' | 'completed' | 'cancelled') => {
    setUpdatingId(id);
    try {
      const updated = await api.updateLeadStatus(id, newStatus);
      setLeads(leads.map((l) => (l.id === updated.id ? { ...updated } : l)));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Cập nhật thất bại');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter logic
  const filteredLeads = leads.filter((lead) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      lead.customerName.toLowerCase().includes(q) ||
      lead.phone.includes(q) ||
      (lead.email && lead.email.toLowerCase().includes(q)) ||
      (lead.productName && lead.productName.toLowerCase().includes(q));

    const matchesStatus = activeTabStatus === 'all' ? true : lead.status === activeTabStatus;
    return matchesSearch && matchesStatus;
  });

  const leadStatusOptions: { value: 'new' | 'contacted' | 'completed' | 'cancelled'; label: string; bg: string; text: string }[] = [
    { value: 'new', label: 'Mới', bg: 'bg-amber-100', text: 'text-amber-700' },
    { value: 'contacted', label: 'Đã gọi tư vấn', bg: 'bg-ocean-100', text: 'text-ocean-700' },
    { value: 'completed', label: 'Hoàn thành chốt đơn', bg: 'bg-emerald-100', text: 'text-emerald-700' },
    { value: 'cancelled', label: 'Đã hủy', bg: 'bg-rose-100', text: 'text-rose-700' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <PhoneCall className="w-6 h-6 text-ocean-600" />
            Quản Lý Đơn Tư Vấn ({filteredLeads.length})
          </h2>
          <p className="text-xs text-slate-500">Danh sách khách hàng đăng ký gọi lại & tư vấn lắp đặt máy kiềm</p>
        </div>

        {/* Quick status count badges */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 font-bold border border-amber-200">
            {leads.filter((l) => l.status === 'new').length} Đơn mới
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-ocean-50 text-ocean-700 font-bold border border-ocean-200">
            {leads.filter((l) => l.status === 'contacted').length} Đã gọi
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'Tất Cả Đơn', count: leads.length },
            { id: 'new', label: 'Đơn Mới', count: leads.filter((l) => l.status === 'new').length },
            { id: 'contacted', label: 'Đã Gọi Tư Vấn', count: leads.filter((l) => l.status === 'contacted').length },
            { id: 'completed', label: 'Hoàn Thành', count: leads.filter((l) => l.status === 'completed').length },
            { id: 'cancelled', label: 'Đã Hủy', count: leads.filter((l) => l.status === 'cancelled').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTabStatus(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTabStatus === tab.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTabStatus === tab.id ? 'bg-ocean-500 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên khách hàng, số điện thoại, email, sản phẩm quan tâm..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-ocean-500 transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center min-h-[350px] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-9 h-9 text-ocean-600 animate-spin" />
          <p className="text-slate-500 font-medium text-sm">Đang tải danh sách đơn đăng ký tư vấn...</p>
        </div>
      ) : error ? (
        <div className="bg-white p-8 rounded-3xl border border-rose-200 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <p className="text-slate-700 font-bold text-sm">{error}</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        /* Empty State */
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center py-16 space-y-3">
          <PhoneCall className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">Không Có Đơn Tư Vấn Phù Hợp</h3>
          <p className="text-xs text-slate-500">Chưa có khách hàng nào đăng ký ở bộ lọc này.</p>
        </div>
      ) : (
        /* Data Table */
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider">
                  <th className="py-4 px-5">Khách Hàng</th>
                  <th className="py-4 px-5">SĐT / Contact</th>
                  <th className="py-4 px-5">Sản Phẩm Quan Tâm</th>
                  <th className="py-4 px-5">Ghi Chú Yêu Cầu</th>
                  <th className="py-4 px-5">Ngày Đăng Ký</th>
                  <th className="py-4 px-5 text-right">Trạng Thái Đơn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredLeads.map((lead) => {
                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Customer Name */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <User className="w-4 h-4 text-ocean-600" />
                          {lead.customerName}
                        </div>
                        {lead.address && (
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {lead.address}
                          </div>
                        )}
                      </td>

                      {/* Phone & Email */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <a href={`tel:${lead.phone}`} className="hover:text-ocean-600 hover:underline">
                            {lead.phone}
                          </a>
                        </div>
                        {lead.email && (
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {lead.email}
                          </div>
                        )}
                      </td>

                      {/* Product Requested */}
                      <td className="py-4 px-5">
                        {lead.productName ? (
                          <span className="font-bold text-ocean-700 text-xs flex items-center gap-1">
                            <Package className="w-3.5 h-3.5 text-ocean-500" />
                            {lead.productName}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Tư vấn chung</span>
                        )}
                      </td>

                      {/* Message Note */}
                      <td className="py-4 px-5 max-w-xs">
                        {lead.message ? (
                          <p className="text-xs text-slate-600 line-clamp-2 italic">
                            "{lead.message}"
                          </p>
                        ) : (
                          <span className="text-xs text-slate-400">Không có ghi chú</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-5 text-xs text-slate-500">
                        <div className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(lead.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>

                      {/* Inline Status Select Dropdown */}
                      <td className="py-4 px-5 text-right">
                        <div className="inline-block relative">
                          <select
                            disabled={updatingId === lead.id}
                            value={lead.status}
                            onChange={(e) =>
                              handleStatusChange(
                                lead.id,
                                e.target.value as 'new' | 'contacted' | 'completed' | 'cancelled'
                              )
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ocean-500 ${
                              lead.status === 'new'
                                ? 'bg-amber-100 text-amber-800'
                                : lead.status === 'contacted'
                                ? 'bg-ocean-100 text-ocean-800'
                                : lead.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            <option value="new">Mới nhận</option>
                            <option value="contacted">Đã gọi điện</option>
                            <option value="completed">Hoàn thành</option>
                            <option value="cancelled">Đã hủy</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
