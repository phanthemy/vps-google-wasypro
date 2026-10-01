import React, { useState } from 'react';
import { WarrantyRecord } from '../types/schema';
import { api } from '../services/api';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  User, 
  Phone, 
  Calendar, 
  Wrench, 
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

export const WarrantyLookupSection: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [record, setRecord] = useState<WarrantyRecord | null>(null);
  
  // 4 UI States Management
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'empty' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleLookup = async (searchStr?: string) => {
    const term = (searchStr || query).trim();
    if (!term) {
      setErrorMessage('Vui lòng nhập Số điện thoại hoặc Mã bảo hành / Serial máy.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');
    setRecord(null);

    try {
      // Call Backend API
      const result = await api.lookupWarranty(term);
      setRecord(result);
      setStatus('success');
    } catch (err: any) {
      setRecord(null);
      setStatus('empty');
    }
  };

  const handleReset = () => {
    setQuery('');
    setRecord(null);
    setStatus('idle');
    setErrorMessage('');
  };

  const getStatusBadge = (st: WarrantyRecord['status']) => {
    switch (st) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-800 text-xs font-bold px-3 py-1 rounded-sm border border-green-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
            <span>Còn Hạn Bảo Hành</span>
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-sm border border-red-300">
            <Clock className="w-3.5 h-3.5 text-red-600" />
            <span>Đã Hết Hạn</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-sm border border-yellow-300">
            <Info className="w-3.5 h-3.5 text-yellow-600" />
            <span>Chờ Kích Hoạt</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <section id="warranty" className="py-12 bg-white relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-[24px] sm:text-[28px] font-heading font-bold text-gray-800 tracking-tight uppercase">
            BẢO HÀNH ĐIỆN TỬ
          </h2>
          <div className="w-16 h-1 bg-primary mx-auto mt-4 mb-4"></div>
          <p className="mt-2 text-gray-600 text-sm sm:text-base">
            Nhập số điện thoại mua hàng hoặc Mã máy/Serial ghi trên tem máy WASY PRO để kiểm tra.
          </p>
        </div>

        {/* Search Card Box */}
        <div className="bg-gray-50 rounded-md p-6 sm:p-8 shadow-sm border border-gray-100 mb-8">
          
          <form onSubmit={(e) => { e.preventDefault(); handleLookup(); }} className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ví dụ: 0900000000 hoặc WASY240811A"
                  className="w-full pl-12 pr-4 py-3 rounded-md bg-white border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full px-2 py-0.5"
                  >
                    Xóa
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full sm:w-auto px-8 py-3 rounded-md font-bold text-white bg-primary hover:bg-primary-dark shadow-sm transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap active:scale-95 disabled:opacity-50 uppercase"
              >
                {status === 'loading' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>ĐANG TRA CỨU...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>TRA CỨU NGAY</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Test Suggestions */}
          <div className="mt-4 pt-3 border-t border-gray-200 flex flex-wrap items-center gap-2 text-[12px] text-gray-500">
            <span className="font-bold text-gray-700">Mẫu tra cứu:</span>
            <button
              onClick={() => { setQuery('0900000000'); handleLookup('0900000000'); }}
              className="bg-sky-50 hover:bg-sky-100 text-primary font-mono font-bold px-2 py-1 rounded-sm border border-primary-light transition-colors"
            >
              0900000000
            </button>
            <button
              onClick={() => { setQuery('0912345678'); handleLookup('0912345678'); }}
              className="bg-red-50 hover:bg-red-100 text-price font-mono font-bold px-2 py-1 rounded-sm border border-red-200 transition-colors"
            >
              0912345678
            </button>
            <button
              onClick={() => { setQuery('WASY240811C'); handleLookup('WASY240811C'); }}
              className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-mono font-bold px-2 py-1 rounded-sm border border-yellow-200 transition-colors"
            >
              WASY240811C
            </button>
          </div>

        </div>

        {/* State 1: Error validation message */}
        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center text-[13px] text-red-700 font-bold mb-6">
            <AlertCircle className="w-5 h-5 inline mr-1 text-red-500" />
            {errorMessage}
          </div>
        )}

        {/* State 2: Empty Result State */}
        {status === 'empty' && (
          <div className="bg-white rounded-md p-8 sm:p-12 text-center border border-gray-200 shadow-sm my-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-gray-50 text-gray-300 flex items-center justify-center mx-auto">
              <Search className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-gray-800">Không tìm thấy dữ liệu bảo hành</h3>
              <p className="text-[13px] text-gray-500 mt-1 max-w-md mx-auto">
                Không tìm thấy máy lọc nước nào đăng ký với thông tin <strong className="text-gray-800">"{query}"</strong>. Vui lòng kiểm tra lại số điện thoại hoặc liên hệ hotline để hỗ trợ.
              </p>
            </div>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-[13px] font-bold text-primary bg-sky-50 border border-primary-light hover:bg-sky-100 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thử Tra Cứu Lại</span>
            </button>
          </div>
        )}

        {/* State 3: Loading Skeleton */}
        {status === 'loading' && (
          <div className="bg-white rounded-md p-8 border border-gray-200 shadow-sm animate-pulse space-y-6">
            <div className="h-6 bg-gray-100 rounded w-1/3"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-12 bg-gray-100 rounded-md"></div>
              <div className="h-12 bg-gray-100 rounded-md"></div>
            </div>
            <div className="h-24 bg-gray-100 rounded-md"></div>
          </div>
        )}

        {/* State 4: Success Result Display Card */}
        {status === 'success' && record && (
          <div className="bg-white rounded-md p-6 sm:p-8 border border-primary-light shadow-md space-y-6 animate-in fade-in duration-300">
            
            {/* Header Result */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-gray-100 gap-4">
              <div>
                <span className="text-[12px] font-mono font-bold text-primary bg-sky-50 px-2 py-1 rounded-sm border border-primary-light">
                  Mã Bảo Hành: {record.code}
                </span>
                <h3 className="text-[20px] font-heading font-bold text-gray-900 mt-2">
                  {record.productName}
                </h3>
              </div>
              <div>
                {getStatusBadge(record.status)}
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
              <div className="p-3 rounded-md bg-gray-50 border border-gray-100 space-y-1">
                <div className="flex items-center gap-1.5 text-gray-500 font-bold">
                  <User className="w-4 h-4 text-primary" />
                  <span>Chủ sở hữu:</span>
                </div>
                <div className="font-bold text-gray-900 text-[14px]">{record.customerName}</div>
              </div>

              <div className="p-3 rounded-md bg-gray-50 border border-gray-100 space-y-1">
                <div className="flex items-center gap-1.5 text-gray-500 font-bold">
                  <Phone className="w-4 h-4 text-primary" />
                  <span>Số điện thoại:</span>
                </div>
                <div className="font-bold text-gray-900 text-[14px] font-mono">{record.phone}</div>
              </div>

              <div className="p-3 rounded-md bg-gray-50 border border-gray-100 space-y-1">
                <div className="flex items-center gap-1.5 text-gray-500 font-bold">
                  <Calendar className="w-4 h-4 text-sky-600" />
                  <span>Ngày kích hoạt:</span>
                </div>
                <div className="font-bold text-gray-900 text-[14px]">{record.installDate}</div>
              </div>

              <div className="p-3 rounded-md bg-gray-50 border border-gray-100 space-y-1">
                <div className="flex items-center gap-1.5 text-gray-500 font-bold">
                  <Clock className="w-4 h-4 text-red-600" />
                  <span>Hạn bảo hành đến:</span>
                </div>
                <div className="font-bold text-gray-900 text-[14px]">{record.expiryDate}</div>
              </div>
            </div>

            {/* Serial Number */}
            <div className="p-3 rounded-md bg-sky-50 border border-primary flex items-center justify-between text-[13px]">
              <span className="text-gray-600 font-bold">Số Serial tem máy:</span>
              <span className="font-mono font-bold text-primary-dark">{record.serialNumber}</span>
            </div>

            {/* Maintenance History Timeline */}
            <div className="space-y-3 pt-2">
              <h4 className="text-[12px] font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-primary" />
                <span>Lịch Sử Bảo Dưỡng & Thay Lõi</span>
              </h4>

              <div className="space-y-2">
                {record.history && record.history.length > 0 ? (
                  record.history.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-md bg-gray-50 border border-gray-100 text-[13px]">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5"></div>
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-gray-800 font-bold">{item.note}</span>
                        <span className="text-gray-500 font-mono text-[11px]">{item.date}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[12px] text-gray-400 italic">Chưa có lịch sử bảo dưỡng.</p>
                )}
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-md text-[13px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Tra cứu máy khác
              </button>
            </div>

          </div>
        )}

      </div>
    </section>
  );
};
