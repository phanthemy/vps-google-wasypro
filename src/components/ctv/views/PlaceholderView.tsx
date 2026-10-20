import React from 'react';
import { Construction } from 'lucide-react';

interface PlaceholderViewProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

const PlaceholderView: React.FC<PlaceholderViewProps> = ({ title, description, icon }) => (
  <div
    style={{
      background: '#FFFFFF',
      border: '1px solid #EEF2F6',
      borderRadius: '18px',
      padding: '40px 20px',
      boxShadow: '0 4px 14px rgba(15,23,42,0.05)',
      textAlign: 'center' as const
    }}
    className="animate-fadeIn"
  >
    <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
      {icon || <Construction className="w-8 h-8 text-blue-400" />}
    </div>
    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
      {title}
    </h3>
    <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '280px', margin: '0 auto', lineHeight: 1.5 }}>
      {description || 'Tính năng đang được phát triển và sẽ sớm ra mắt. Vui lòng quay lại sau!'}
    </p>
    <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 text-sm font-semibold">
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      Đang cập nhật
    </div>
  </div>
);

export default PlaceholderView;
