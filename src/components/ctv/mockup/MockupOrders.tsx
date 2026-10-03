import React, { useState, useEffect } from 'react';
import { ChevronRight, Plus, ShoppingBag, X, RefreshCw, MapPin, Phone, User, Package, Calendar } from 'lucide-react';
// @ts-ignore
import CreateOrderModal from '../views/CreateOrderModal.jsx';

interface MockupOrdersProps {
  currentUser?: any;
  onSelectOrder?: (orderId: string) => void;
}

export const MockupOrders: React.FC<MockupOrdersProps> = ({ currentUser, onSelectOrder }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'delivering' | 'delivered' | 'cancelled'>('all');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders/my', { credentials: 'include' }).then(r => r.json());
      if (res.success && res.data) {
        const combined: any[] = [];
        if (res.data.websiteOrders) {
          res.data.websiteOrders.forEach((wo: any) => {
            combined.push({
              id: wo.id,
              createdAt: wo.createdAt,
              totalAmount: wo.totalAmount || 0,
              status: wo.status,
              _source: 'website',
              customer: {
                fullName: wo.customerName,
                phone: wo.customerPhone,
              },
              items: [{
                product: { title: wo.productTitle },
                qty: wo.qty || 1,
                amount: wo.totalAmount || 0,
              }],
              shippingAddress: wo.address,
              recipientPhone: wo.customerPhone,
            });
          });
        }
        if (res.data.ctvOrders) {
          res.data.ctvOrders.forEach((co: any) => {
            combined.push({
              ...co,
              _source: 'ctv',
            });
          });
        }
        combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(combined);
      }
    } catch (e) {
      console.error('Lỗi tải đơn hàng:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    const s = String(status || '').toUpperCase();
    if (s === 'COMPLETED' || s === 'DELIVERED') {
      return { label: 'Đã giao', bg: '#ECFDF5', color: '#008A45' };
    }
    if (s === 'SHIPPING' || s === 'DELIVERING') {
      return { label: 'Đang giao', bg: '#FFF7E6', color: '#B77900' };
    }
    if (s === 'CANCELLED' || s === 'CANCELED') {
      return { label: 'Đã hủy', bg: '#FFF0F2', color: '#ED4956' };
    }
    return { label: 'Chờ xử lý', bg: '#F0F7FF', color: '#0072F5' };
  };

  const filteredOrders = orders.filter((order) => {
    const s = String(order.status || '').toUpperCase();
    if (filter === 'all') return true;
    if (filter === 'pending') return s === 'NEW' || s === 'PENDING' || s === 'CONFIRMED';
    if (filter === 'delivering') return s === 'SHIPPING' || s === 'DELIVERING';
    if (filter === 'delivered') return s === 'COMPLETED' || s === 'DELIVERED';
    if (filter === 'cancelled') return s === 'CANCELLED' || s === 'CANCELED';
    return true;
  });

  return (
    <div className="space-y-4 pb-6" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
      {/* 1. TOP ACTION: TẠO ĐƠN HÀNG BUTTON */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex-1 flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm hover:shadow-md"
          style={{
            height: '48px',
            borderRadius: '14px',
            background: '#0072F5',
            color: '#FFFFFF',
            fontSize: '15px',
            fontWeight: 600,
          }}
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Tạo Đơn Hàng Mới</span>
        </button>

        <button
          onClick={loadOrders}
          className="w-12 h-12 rounded-[14px] bg-[#FFFFFF] border border-[#EEF2F6] text-[#64748B] hover:text-[#0072F5] flex items-center justify-center active:scale-95 transition-all shadow-xs"
          title="Làm mới"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 2. FILTER PILLS (Matching Mockup 1 Screen 4) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'pending', label: 'Chờ xử lý' },
          { id: 'delivering', label: 'Đang giao' },
          { id: 'delivered', label: 'Đã giao' },
          { id: 'cancelled', label: 'Đã hủy' },
        ].map((tab) => {
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className="px-4 py-2 rounded-full transition-all shrink-0 active:scale-95"
              style={{
                background: isActive ? '#0072F5' : '#F1F5F9',
                color: isActive ? '#FFFFFF' : '#475569',
                fontSize: '15px',
                fontWeight: 600,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. ORDER CARDS LIST */}
      {loading ? (
        <div className="p-8 text-center bg-[#FFFFFF] rounded-[18px] border border-[#EEF2F6]">
          <div className="animate-spin inline-block w-8 h-8 border-3 border-[#0072F5] border-t-transparent rounded-full mb-3" />
          <p style={{ fontSize: '14px', color: '#64748B' }}>Đang tải danh sách đơn hàng...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-8 text-center bg-[#FFFFFF] rounded-[18px] border border-[#EEF2F6] space-y-3">
          <div className="w-14 h-14 rounded-full bg-[#F0F7FF] text-[#0072F5] flex items-center justify-center mx-auto">
            <ShoppingBag className="w-7 h-7 stroke-[2]" />
          </div>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>Chưa có đơn hàng nào</p>
          <p style={{ fontSize: '13px', color: '#94A3B8' }}>Bấm vào nút bên dưới để tạo đơn hàng mới ngay.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-[12px] bg-[#0072F5] text-white text-[14px] font-semibold inline-flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tạo đơn hàng ngay</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const badge = getStatusBadge(order.status);
            const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'Mới';
            const productTitle = order.items && order.items.length > 0
              ? order.items.map((i: any) => `${i.product?.title || i.service?.name || 'Sản phẩm'}${i.qty > 1 ? ` (x${i.qty})` : ''}`).join(', ')
              : 'Đơn hàng WasyPro';
            const priceStr = Number(order.totalAmount || 0).toLocaleString('vi-VN') + ' đ';

            return (
              <div
                key={order.id}
                onClick={() => {
                  setSelectedOrder(order);
                  if (onSelectOrder) onSelectOrder(order.id);
                }}
                className="hover:shadow-md transition-all cursor-pointer space-y-2 active:scale-[0.99]"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #EEF2F6',
                  borderRadius: '18px',
                  padding: '16px',
                  boxShadow: '0 4px 14px rgba(15,23,42,0.05)',
                }}
              >
                {/* Top: Order Code + Date */}
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>
                    #{String(order.id).slice(0, 12)}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 400, color: '#94A3B8' }}>
                    {dateStr}
                  </span>
                </div>

                {/* Product Name */}
                <p style={{ fontSize: '16px', fontWeight: 500, color: '#0F172A' }} className="truncate">
                  {productTitle}
                </p>

                {/* Bottom: Price + Status Pill + Arrow */}
                <div className="flex items-center justify-between pt-1">
                  <span style={{ fontSize: '19px', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>
                    {priceStr}
                  </span>

                  <div className="flex items-center gap-2">
                    <span 
                      style={{
                        background: badge.bg,
                        color: badge.color,
                        fontSize: '13px',
                        fontWeight: 600,
                        borderRadius: '999px',
                        padding: '5px 12px',
                        lineHeight: 1,
                      }}
                    >
                      {badge.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#94A3B8] stroke-[2.5]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. MODAL: CREATE ORDER MODAL */}
      {showCreateModal && (
        <CreateOrderModal
          currentUser={currentUser}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadOrders();
          }}
        />
      )}

      {/* 5. MODAL: ORDER DETAILS */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div 
            className="bg-[#FFFFFF] w-full max-w-lg rounded-[22px] shadow-2xl border border-[#EEF2F6] overflow-hidden"
            style={{ maxHeight: '90vh' }}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#EEF2F6] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A' }}>
                  Chi tiết đơn hàng #{String(selectedOrder.id).slice(0, 10)}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span style={{ fontSize: '13px', color: '#64748B' }}>
                    {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                  </span>
                  <span 
                    style={{
                      background: getStatusBadge(selectedOrder.status).bg,
                      color: getStatusBadge(selectedOrder.status).color,
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '999px',
                      padding: '3px 8px',
                    }}
                  >
                    {getStatusBadge(selectedOrder.status).label}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-[#E2E8F0] hover:bg-[#CBD5E1] flex items-center justify-center text-[#475569] transition-colors"
              >
                <X className="w-5 h-5 stroke-[2.2]" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              {/* Recipient Info */}
              <div className="p-3.5 bg-[#F8FAFC] rounded-[16px] border border-[#EEF2F6] space-y-2">
                <div className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider">
                  Thông tin giao hàng
                </div>
                <div className="flex items-center gap-2 text-[14px] text-[#0F172A]">
                  <User className="w-4 h-4 text-[#0072F5] shrink-0" />
                  <span className="font-semibold">{selectedOrder.customer?.fullName || 'Khách hàng'}</span>
                  {selectedOrder.customer?.phone && (
                    <span className="text-[#64748B]">({selectedOrder.customer.phone})</span>
                  )}
                </div>
                {selectedOrder.shippingAddress && (
                  <div className="flex items-start gap-2 text-[13px] text-[#475569]">
                    <MapPin className="w-4 h-4 text-[#0072F5] shrink-0 mt-0.5" />
                    <span>{selectedOrder.shippingAddress}</span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider">
                  Sản phẩm đã chọn
                </div>
                <div className="divide-y divide-[#EEF2F6] border border-[#EEF2F6] rounded-[16px] overflow-hidden">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item: any, idx: number) => (
                      <div key={idx} className="p-3.5 flex items-center justify-between bg-white">
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-semibold text-[#0F172A] truncate">
                            {item.product?.title || item.service?.name || 'Sản phẩm'}
                          </p>
                          <p className="text-[12px] text-[#64748B] mt-0.5">
                            Số lượng: <span className="font-bold text-[#0F172A]">{item.qty || 1}</span>
                          </p>
                        </div>
                        <div className="text-right pl-3">
                          <div className="text-[15px] font-bold text-[#0072F5]">
                            {Number(item.amount || item.price || 0).toLocaleString('vi-VN')} đ
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-[13px] text-[#94A3B8]">
                      Không có thông tin chi tiết sản phẩm
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-[#F0F7FF] rounded-[16px] border border-[#D6E8FF] flex items-center justify-between">
                <div>
                  <span className="text-[14px] font-semibold text-[#0052CC]">Tổng thanh toán</span>
                  {selectedOrder.totalCommissionPoints ? (
                    <div className="text-[12px] text-[#0072F5] font-medium mt-0.5">
                      Tích lũy: +{Number(selectedOrder.totalCommissionPoints).toLocaleString('vi-VN')} CP
                    </div>
                  ) : null}
                </div>
                <div className="text-[22px] font-bold text-[#0052CC]">
                  {Number(selectedOrder.totalAmount || 0).toLocaleString('vi-VN')} đ
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#EEF2F6] bg-white flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2.5 rounded-[12px] bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] text-[14px] font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
