import React, { useState } from 'react';
import { MapPin, Calendar, MessageSquare, Construction } from 'lucide-react';

type SubTab = 'dealers' | 'events' | 'feedback';

const SUB_TABS: { id: SubTab; label: string; icon: React.ReactNode }[] = [
  { id: 'dealers', label: 'Đại lý & Showroom', icon: <MapPin className="w-4 h-4" /> },
  { id: 'events', label: 'Sự kiện & Báo chí', icon: <Calendar className="w-4 h-4" /> },
  { id: 'feedback', label: 'Feedback KH', icon: <MessageSquare className="w-4 h-4" /> },
];

const PlaceholderContent: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div
    style={{
      background: '#FFFFFF',
      border: '1px solid #EEF2F6',
      borderRadius: '18px',
      padding: '40px 20px',
      boxShadow: '0 4px 14px rgba(15,23,42,0.05)',
      textAlign: 'center',
    }}
  >
    <div className="w-16 h-16 rounded-2xl bg-sky-50 flex items-center justify-center mx-auto mb-4">
      <Construction className="w-8 h-8 text-sky-400" />
    </div>
    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>{title}</h3>
    <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '280px', margin: '0 auto', lineHeight: 1.5 }}>
      {description}
    </p>
    <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 text-sm font-semibold">
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      Đang cập nhật
    </div>
  </div>
);

export const MockupNetworkMedia: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SubTab>('dealers');

  const contentMap: Record<SubTab, { title: string; description: string }> = {
    dealers: {
      title: 'Đại lý & Showroom toàn quốc',
      description: 'Bản đồ và danh sách điểm bán, địa chỉ, SĐT các đại lý trên 63 tỉnh thành.',
    },
    events: {
      title: 'Sự kiện & Báo chí',
      description: 'Thư viện Video sự kiện, Lịch Zoom đào tạo, các bài báo đưa tin về tập đoàn.',
    },
    feedback: {
      title: 'Kết quả sử dụng (Feedback KH)',
      description: 'Tổng hợp Video/Hình ảnh phỏng vấn khách hàng thực tế. Nút chia sẻ TikTok/YouTube/Facebook.',
    },
  };

  return (
    <div className="space-y-4" style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>
      {/* Pill Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-[#0072F5] text-white shadow-sm'
                : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <PlaceholderContent {...contentMap[activeTab]} />
    </div>
  );
};
