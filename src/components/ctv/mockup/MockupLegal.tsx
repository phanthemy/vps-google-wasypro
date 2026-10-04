import React, { useState } from 'react';
import { FileCheck, Shield, Scale, Construction } from 'lucide-react';

type SubTab = 'legal-docs' | 'company-policy' | 'regulations';

const SUB_TABS: { id: SubTab; label: string; icon: React.ReactNode }[] = [
  { id: 'legal-docs', label: 'Pháp lý & Giấy CN', icon: <FileCheck className="w-4 h-4" /> },
  { id: 'company-policy', label: 'CS Công ty', icon: <Shield className="w-4 h-4" /> },
  { id: 'regulations', label: 'QĐ Pháp luật', icon: <Scale className="w-4 h-4" /> },
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
    <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
      <Construction className="w-8 h-8 text-rose-400" />
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

export const MockupLegal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SubTab>('legal-docs');

  const contentMap: Record<SubTab, { title: string; description: string }> = {
    'legal-docs': {
      title: 'Pháp lý & Giấy chứng nhận',
      description: 'Giấy phép ĐKKD, Giấy kiểm định chất lượng nước, Bằng sáng chế. Cho phép tải PDF.',
    },
    'company-policy': {
      title: 'Chính sách Công ty',
      description: 'Quy chế hoạt động, chính sách trả thưởng, quyền lợi & nghĩa vụ thành viên.',
    },
    regulations: {
      title: 'Quy định Pháp luật',
      description: 'Điều khoản cam kết hoạt động thương mại điện tử / Affiliate chuẩn mực.',
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
