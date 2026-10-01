import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Wrench,
  Calendar,
  User,
  Phone,
  AlertCircle,
  Loader2,
  X,
  CheckCircle2,
  Clock,
  History,
  Filter
} from 'lucide-react';
import { api } from '../../services/api';
import { WarrantyRecord, WarrantyInput } from '../../types/schema';
import { mockWarranties } from '../../data/mockData';

export const AdminWarranties: React.FC = () => {
  const [warranties, setWarranties] = useState<WarrantyRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modal 1: Create Warranty Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newWarrantyData, setNewWarrantyData] = useState<{
    customerName: string;
    phone: string;
    productName: string;
    serialNumber: string;
    installDate: string;
    warrantyYears: number;
  }>({
    customerName: '',
    phone: '',
    productName: 'Máy Tạo Nước Hydrogen Water King Pro 9',
    serialNumber: '',
    installDate: new Date().toISOString().split('T')[0],
    warrantyYears: 5,
  });

  // Modal 2: Add Maintenance Log Modal
  const [selectedWarrantyForLog, setSelectedWarrantyForLog] = useState<WarrantyRecord | null>(null);
  const [maintenanceForm, setMaintenanceForm] = useState<{
    actionTitle: string;
    technicianName: string;
    notes: string;
  }>({
    actionTitle: 'Bảo dưỡng định kỳ & Thay bộ 3 lõi lọc thô 1,2,3',
    technicianName: 'Kỹ Thuật Viên WASY PRO',
    notes: 'Kiểm tra áp lực nước và vệ sinh màng lọc hoàn tất.',
  });

  // Modal 3: View Details Modal
  const [detailWarranty, setDetailWarranty] = useState<WarrantyRecord | null>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchWarranties = async () => {
    setLoading(true);
    setError(null);
    try {
      // Return mock array
      setWarranties([...mockWarranties]);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Không thể tải danh sách bảo hành');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarranties();
  }, []);

  const handleCreateWarranty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWarrantyData.customerName.trim() || !newWarrantyData.phone.trim()) {
      setModalError('Vui lòng nhập đầy đủ tên khách hàng và SĐT');
      return;
    }
    if (!newWarrantyData.serialNumber.trim()) {
      setModalError('Vui lòng nhập số Serial thiết bị');
      return;
    }

    setSubmitting(true);
    setModalError(null);
    try {
      const startDate = new Date(newWarrantyData.installDate);
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + Number(newWarrantyData.warrantyYears));

      const codeRandom = 'WASY' + Math.floor(100000 + Math.random() * 900000);
      const input: WarrantyInput = {
        code: codeRandom,
        customerName: newWarrantyData.customerName,
        phone: newWarrantyData.phone,
        productName: newWarrantyData.productName,
        serialNumber: newWarrantyData.serialNumber,
        installDate: newWarrantyData.installDate,
        expiryDate: endDate.toISOString().split('T')[0],
        status: 'active',
        history: [
          {
            date: newWarrantyData.installDate,
            note: 'Kích hoạt bảo hành điện tử chính hãng WASY PRO',
            status: 'active',
          },
        ],
      };

      const created = await api.createWarranty(input);
      setWarranties([created, ...warranties]);
      setIsCreateModalOpen(false);
      // Reset form
      setNewWarrantyData({
        customerName: '',
        phone: '',
        productName: 'Máy Tạo Nước Hydrogen Water King Pro 9',
        serialNumber: '',
        installDate: new Date().toISOString().split('T')[0],
        warrantyYears: 5,
      });
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Kích hoạt bảo hành thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarrantyForLog) return;
    if (!maintenanceForm.actionTitle.trim() || !maintenanceForm.technicianName.trim()) {
      setModalError('Vui lòng điền nội dung bảo trì và tên kỹ thuật viên');
      return;
    }

    setSubmitting(true);
    setModalError(null);
    try {
      const updated = await api.addWarrantyMaintenance(selectedWarrantyForLog.id, maintenanceForm);
      setWarranties(warranties.map((w) => (w.id === updated.id ? { ...updated } : w)));
      setSelectedWarrantyForLog(null);
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Thêm nhật ký thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered List
  const filteredWarranties = warranties.filter((w) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      w.code.toLowerCase().includes(q) ||
      w.customerName.toLowerCase().includes(q) ||
      w.phone.includes(q) ||
      w.serialNumber.toLowerCase().includes(q);

    const matchesStatus = statusFilter ? w.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const statusBadges: Record<string, { label: string; bg: string; text: string }> = {
    active: { label: 'Đang bảo hành', bg: 'bg-sky-100', text: 'text-sky-700' },
    expired: { label: 'Hết hạn BH', bg: 'bg-rose-100', text: 'text-rose-700' },
    pending: { label: 'Chờ xác nhận', bg: 'bg-amber-100', text: 'text-amber-700' },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-ocean-600" />
            Quản Lý Tra Cứu & Nhật Ký Bảo Hành ({filteredWarranties.length})
          </h2>
          <p className="text-xs text-slate-500">Quản lý kích hoạt bảo hành điện tử & lịch sử bảo dưỡng kỹ thuật</p>
        </div>
        <button
          onClick={() => {
            setModalError(null);
            setIsCreateModalOpen(true);
          }}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-ocean-600 to-cyan-600 hover:from-ocean-700 hover:to-cyan-700 text-white font-bold text-sm shadow-md shadow-ocean-500/20 hover:shadow-ocean-500/30 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Kích Hoạt Bảo Hành Mới
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo Mã BH, Tên khách hàng, SĐT, Serial..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-ocean-500 transition-all shadow-xs"
          />
        </div>

        <div className="w-full md:w-64 relative">
          <Filter className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-11 pr-8 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-ocean-500 transition-all shadow-xs"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang bảo hành</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="expired">Hết hạn BH</option>
          </select>
        </div>
      </div>

      {/* Main Table Area */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center min-h-[350px] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-9 h-9 text-ocean-600 animate-spin" />
          <p className="text-slate-500 font-medium text-sm">Đang tải hồ sơ bảo hành...</p>
        </div>
      ) : error ? (
        <div className="bg-white p-8 rounded-3xl border border-rose-200 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <p className="text-slate-700 font-bold text-sm">{error}</p>
        </div>
      ) : filteredWarranties.length === 0 ? (
        /* Empty State */
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center py-16 space-y-3">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">Chưa Có Hồ Sơ Bảo Hành Nào</h3>
          <p className="text-xs text-slate-500">Thử tìm kiếm với từ khóa khác hoặc bấm nút Kích hoạt Bảo hành mới.</p>
        </div>
      ) : (
        /* Data Table */
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider">
                  <th className="py-4 px-5">Mã BH & Trạng Thái</th>
                  <th className="py-4 px-5">Khách Hàng</th>
                  <th className="py-4 px-5">Thiết Bị & Serial</th>
                  <th className="py-4 px-5">Ngày Lắp / Hạn BH</th>
                  <th className="py-4 px-5">Nhật Ký Bảo Trì</th>
                  <th className="py-4 px-5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredWarranties.map((w) => {
                  const statusInfo = statusBadges[w.status] || statusBadges.active;
                  return (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Code & Status */}
                      <td className="py-4 px-5">
                        <div className="font-mono font-extrabold text-ocean-700">{w.code}</div>
                        <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${statusInfo.bg} ${statusInfo.text}`}>
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Customer Info */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <User className="w-4 h-4 text-slate-400" />
                          {w.customerName}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {w.phone}
                        </div>
                      </td>

                      {/* Product & Serial */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 line-clamp-1">{w.productName}</div>
                        <div className="text-xs font-mono text-slate-500">SN: {w.serialNumber}</div>
                      </td>

                      {/* Dates */}
                      <td className="py-4 px-5 text-xs">
                        <div className="text-slate-600 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Lắp: <strong className="text-slate-900">{w.installDate}</strong>
                        </div>
                        <div className="text-slate-600 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-rose-400" />
                          Hạn: <strong className="text-rose-600">{w.expiryDate}</strong>
                        </div>
                      </td>

                      {/* Maintenance Count */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                          <History className="w-4 h-4 text-ocean-600" />
                          <span>{w.history.length} lần bảo dưỡng</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedWarrantyForLog(w);
                              setModalError(null);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-ocean-50 hover:bg-ocean-100 text-ocean-700 font-bold text-xs transition-colors flex items-center gap-1"
                            title="Thêm nhật ký bảo trì"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">+ Bảo Trì</span>
                          </button>

                          <button
                            onClick={() => setDetailWarranty(w)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                          >
                            Chi Tiết
                          </button>
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

      {/* Modal 1: Activate New Warranty */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-slate-900 via-ocean-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-ocean-500/20 border border-ocean-400/30 flex items-center justify-center text-cyan-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Kích Hoạt Bảo Hành Mới</h3>
                  <p className="text-xs text-slate-300">Tạo mã bảo hành điện tử chính hãng cho khách hàng</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWarranty} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tên Khách Hàng *
                </label>
                <input
                  type="text"
                  required
                  value={newWarrantyData.customerName}
                  onChange={(e) => setNewWarrantyData({ ...newWarrantyData, customerName: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Số Điện Thoại *
                </label>
                <input
                  type="tel"
                  required
                  value={newWarrantyData.phone}
                  onChange={(e) => setNewWarrantyData({ ...newWarrantyData, phone: e.target.value })}
                  placeholder="0901234567"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tên Máy / Sản Phẩm *
                </label>
                <input
                  type="text"
                  required
                  value={newWarrantyData.productName}
                  onChange={(e) => setNewWarrantyData({ ...newWarrantyData, productName: e.target.value })}
                  placeholder="Máy Tạo Nước Hydrogen Water King Pro 9"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Số Serial Máy *
                  </label>
                  <input
                    type="text"
                    required
                    value={newWarrantyData.serialNumber}
                    onChange={(e) => setNewWarrantyData({ ...newWarrantyData, serialNumber: e.target.value })}
                    placeholder="SN987654321"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Thời Gian BH (Năm)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newWarrantyData.warrantyYears}
                    onChange={(e) => setNewWarrantyData({ ...newWarrantyData, warrantyYears: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Ngày Lắp Đặt
                </label>
                <input
                  type="date"
                  value={newWarrantyData.installDate}
                  onChange={(e) => setNewWarrantyData({ ...newWarrantyData, installDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-xs flex items-center gap-2 shadow-md disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Kích Hoạt Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Maintenance Log */}
      {selectedWarrantyForLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Thêm Nhật Ký Bảo Trì</h3>
                  <p className="text-xs text-slate-300">
                    Mã BH: <strong className="text-cyan-400 font-mono">{selectedWarrantyForLog.code}</strong> - Khách: {selectedWarrantyForLog.customerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedWarrantyForLog(null)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMaintenance} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nội Dung Bảo Trì / Thay Lõi Filter *
                </label>
                <input
                  type="text"
                  required
                  value={maintenanceForm.actionTitle}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, actionTitle: e.target.value })}
                  placeholder="Thay bộ lõi 1,2,3 / Vệ sinh buồng điện phân"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Kỹ Thuật Viên Thực Hiện *
                </label>
                <input
                  type="text"
                  required
                  value={maintenanceForm.technicianName}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, technicianName: e.target.value })}
                  placeholder="Nguyễn Văn Kỹ Thuật"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Ghi Chú Chi Tiết
                </label>
                <textarea
                  rows={3}
                  value={maintenanceForm.notes}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })}
                  placeholder="Kết quả đo thử pH = 9.5, nồng độ Hydrogen = 1400ppb..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedWarrantyForLog(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-xs flex items-center gap-2 shadow-md disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
                  Lưu Nhật Ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: View Full Details */}
      {detailWarranty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-cyan-400" />
                <div>
                  <h3 className="text-lg font-bold">Chi Tiết Hồ Sơ Bảo Hành</h3>
                  <p className="text-xs font-mono text-cyan-400">{detailWarranty.code}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailWarranty(null)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold">Khách hàng</span>
                  <span className="font-bold text-slate-900">{detailWarranty.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">SĐT</span>
                  <span className="font-bold text-slate-900">{detailWarranty.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Sản phẩm</span>
                  <span className="font-bold text-slate-900">{detailWarranty.productName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Serial</span>
                  <span className="font-mono font-bold text-slate-900">{detailWarranty.serialNumber}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <History className="w-4 h-4 text-ocean-600" />
                  Lịch Sử Bảo Trì & Bảo Dưỡng ({detailWarranty.history.length})
                </h4>
                <div className="space-y-3">
                  {detailWarranty.history.map((h, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-400 font-semibold">
                        <span>Lần {i + 1}</span>
                        <span>{h.date}</span>
                      </div>
                      <div className="font-bold text-slate-900">{h.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
