import React from 'react';
import PageHeader from '../components/common/PageHeader.jsx';

export default function SettingsView() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full p-4">
      <PageHeader 
        title="Cấu Hình Cơ Chế Hoa Hồng" 
        subtitle="Hệ thống hoa hồng Phase 2C đang được quản lý tập trung từ chính sách hệ thống." 
      />
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-600 mb-4 font-bold text-xl">
          ⚙️
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Cơ chế hoa hồng v3.6 đã được kích hoạt</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
          Tất cả chính sách hoa hồng (SELF, DIRECT_NO_ID, DIRECT_WITH_ID, SPLIT, UPSTREAM_D1, UPSTREAM_D2) được đồng bộ tự động theo chuẩn Phase 2C.
        </p>
      </div>
    </div>
  );
}
