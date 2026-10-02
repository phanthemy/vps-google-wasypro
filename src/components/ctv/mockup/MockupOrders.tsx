import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface MockupOrdersProps {
  onSelectOrder?: (orderId: string) => void;
}

export const MockupOrders: React.FC<MockupOrdersProps> = ({ onSelectOrder }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'delivering' | 'delivered'>('all');

  const orders = [
    {
      id: 'DH25102901',
      date: '29/10/2026',
      product: 'Máy tạo nước Hydrogen',
      price: '12.500.000 đ',
      status: 'Đang giao',
      badgeBg: '#FFF7E6',
      badgeColor: '#B77900'
    },
    {
      id: 'DH25102815',
      date: '28/10/2026',
      product: 'Bình thủy tinh Hydrogen',
      price: '3.200.000 đ',
      status: 'Đã giao',
      badgeBg: '#ECFDF5',
      badgeColor: '#008A45'
    },
    {
      id: 'DH25102608',
      date: '26/10/2026',
      product: 'Máy lọc nước ion kiềm',
      price: '28.900.000 đ',
      status: 'Đã giao',
      badgeBg: '#ECFDF5',
      badgeColor: '#008A45'
    },
    {
      id: 'DH25102411',
      date: '24/10/2026',
      product: 'Bộ lõi lọc thay thế',
      price: '1.250.000 đ',
      status: 'Hủy',
      badgeBg: '#FFF0F2',
      badgeColor: '#ED4956'
    },
  ];

  return (
    <div className="space-y-4 pb-6" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
      {/* 1. FILTER PILLS (Mockup 1 Screen 4) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setFilter('all')}
          className="px-4 py-2 rounded-full transition-all shrink-0 active:scale-95"
          style={{
            background: filter === 'all' ? '#0072F5' : '#F1F5F9',
            color: filter === 'all' ? '#FFFFFF' : '#475569',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          Tất cả
        </button>

        <button
          onClick={() => setFilter('pending')}
          className="px-4 py-2 rounded-full transition-all shrink-0 active:scale-95"
          style={{
            background: filter === 'pending' ? '#0072F5' : '#F1F5F9',
            color: filter === 'pending' ? '#FFFFFF' : '#475569',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          Chờ xử lý
        </button>

        <button
          onClick={() => setFilter('delivering')}
          className="px-4 py-2 rounded-full transition-all shrink-0 active:scale-95"
          style={{
            background: filter === 'delivering' ? '#0072F5' : '#F1F5F9',
            color: filter === 'delivering' ? '#FFFFFF' : '#475569',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          Đang giao
        </button>

        <button
          onClick={() => setFilter('delivered')}
          className="px-4 py-2 rounded-full transition-all shrink-0 active:scale-95"
          style={{
            background: filter === 'delivered' ? '#0072F5' : '#F1F5F9',
            color: filter === 'delivered' ? '#FFFFFF' : '#475569',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          Đã giao
        </button>
      </div>

      {/* ============================================================
          SECTION 17: ORDER STATUS BADGES & ORDER CARDS
          ============================================================ */}
      <div className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            onClick={() => onSelectOrder && onSelectOrder(order.id)}
            className="hover:shadow-md transition-all cursor-pointer space-y-2 active:scale-[0.99]"
            style={{
              background: '#FFFFFF',
              border: '1px solid #EEF2F6',
              borderRadius: '18px',
              padding: '16px',
              boxShadow: '0 4px 14px rgba(15,23,42,0.05)'
            }}
          >
            {/* Top: Order Code + Date */}
            <div className="flex items-center justify-between">
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', fontFamily: 'monospace' }}>
                #{order.id}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 400, color: '#94A3B8' }}>
                {order.date}
              </span>
            </div>

            {/* Product Name */}
            <p style={{ fontSize: '15px', fontWeight: 500, color: '#0F172A' }} className="truncate">
              {order.product}
            </p>

            {/* Bottom: Price + Status Pill + Arrow */}
            <div className="flex items-center justify-between pt-1">
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>
                {order.price}
              </span>

              <div className="flex items-center gap-2">
                {/* SECTION 17: Status Badge (5px 10px, 999px radius, font 11-12px 600) */}
                <span 
                  style={{
                    background: order.badgeBg,
                    color: order.badgeColor,
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '999px',
                    padding: '5px 10px',
                    lineHeight: 1
                  }}
                >
                  {order.status}
                </span>
                <ChevronRight className="w-4 h-4 text-[#94A3B8] stroke-[2.5]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
