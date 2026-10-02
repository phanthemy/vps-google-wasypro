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
      statusStyle: 'bg-amber-100 text-amber-800'
    },
    {
      id: 'DH25102815',
      date: '28/10/2026',
      product: 'Bình thủy tinh Hydrogen',
      price: '3.200.000 đ',
      status: 'Đã giao',
      statusStyle: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'DH25102608',
      date: '26/10/2026',
      product: 'Máy lọc nước ion kiềm',
      price: '28.900.000 đ',
      status: 'Đã giao',
      statusStyle: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'DH25102411',
      date: '24/10/2026',
      product: 'Bộ lõi lọc thay thế',
      price: '1.250.000 đ',
      status: 'Hủy',
      statusStyle: 'bg-rose-100 text-rose-700'
    },
  ];

  return (
    <div className="space-y-4 pb-6">
      {/* 1. FILTER PILLS (Mockup 1 Screen 4) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all shrink-0 ${
            filter === 'all'
              ? 'bg-[#0070F3] text-white shadow-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tất cả
        </button>

        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all shrink-0 ${
            filter === 'pending'
              ? 'bg-[#0070F3] text-white shadow-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Chờ xử lý
        </button>

        <button
          onClick={() => setFilter('delivering')}
          className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all shrink-0 ${
            filter === 'delivering'
              ? 'bg-[#0070F3] text-white shadow-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Đang giao
        </button>

        <button
          onClick={() => setFilter('delivered')}
          className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all shrink-0 ${
            filter === 'delivered'
              ? 'bg-[#0070F3] text-white shadow-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Đã giao
        </button>
      </div>

      {/* 2. ORDER CARDS LIST (Mockup 1 Screen 4) */}
      <div className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            onClick={() => onSelectOrder && onSelectOrder(order.id)}
            className="bg-white rounded-3xl p-4.5 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all cursor-pointer space-y-2 active:scale-[0.99]"
          >
            {/* Top: Order Code + Date */}
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-black text-gray-900 font-mono">
                #{order.id}
              </span>
              <span className="text-[12px] font-medium text-gray-400">
                {order.date}
              </span>
            </div>

            {/* Product Name */}
            <p className="text-[14px] font-bold text-gray-700 truncate">
              {order.product}
            </p>

            {/* Bottom: Price + Status Pill + Arrow */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[18px] font-black text-gray-900 tracking-tight">
                {order.price}
              </span>

              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full ${order.statusStyle}`}>
                  {order.status}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 stroke-[2.5]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
