import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, Navigation, ExternalLink, ChevronDown, ChevronUp, Map, ListFilter } from 'lucide-react';

export interface Dealer {
  id: string;
  name: string;
  code: string;
  phone: string | null;
  address: string;
  province: string;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapUrl: string | null;
  openHours: string | null;
  type: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface ApiResponse {
  dealers: Dealer[];
  provinces: string[];
}

export const DealerSection: React.FC = () => {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [activeDealer, setActiveDealer] = useState<Dealer | null>(null);

  // Mobile UX: View switcher ('list' | 'map') and progressive disclosure (isExpanded)
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    const fetchDealers = async () => {
      try {
        const response = await fetch('/api/dealers');
        if (response.ok) {
          const data: ApiResponse = await response.json();
          const activeDealers = (data.dealers || []).filter(d => d.isActive);
          setDealers(activeDealers);
          setProvinces(data.provinces || []);
          if (activeDealers.length > 0 && !activeDealer) {
            setActiveDealer(activeDealers[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch dealers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDealers();
  }, []);

  const filteredDealers = selectedProvince
    ? dealers.filter(d => d.province === selectedProvince)
    : dealers;

  // Mobile limit: show top 2 unless expanded or filtered by a specific province
  const displayedDealers = (!selectedProvince && !isExpanded)
    ? filteredDealers.slice(0, 2)
    : filteredDealers;

  const getMapUrl = () => {
    if (activeDealer) {
      if (activeDealer.latitude && activeDealer.longitude) {
        return `https://maps.google.com/maps?q=${activeDealer.latitude},${activeDealer.longitude}&z=15&output=embed`;
      }
      if (activeDealer.address) {
        const query = encodeURIComponent(`${activeDealer.name}, ${activeDealer.address}`);
        return `https://maps.google.com/maps?q=${query}&z=15&output=embed`;
      }
    }
    return 'https://maps.google.com/maps?q=WasyPro+Vietnam&z=6&output=embed';
  };

  const getDirectionsUrl = (dealer: Dealer) => {
    if (dealer.googleMapUrl && dealer.googleMapUrl.trim()) {
      return dealer.googleMapUrl.trim();
    }
    if (dealer.latitude && dealer.longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${dealer.latitude},${dealer.longitude}`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dealer.name + ' ' + dealer.address)}`;
  };

  const formatAddress = (dealer: Dealer) => {
    let addr = (dealer.address || '').trim();
    if (dealer.district && !addr.toLowerCase().includes(dealer.district.toLowerCase())) {
      addr += `, ${dealer.district}`;
    }
    if (dealer.province && !addr.toLowerCase().includes(dealer.province.toLowerCase())) {
      addr += `, ${dealer.province}`;
    }
    return addr;
  };

  const getTypeBadge = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'showroom':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-[#0072F5] text-[11px] font-bold rounded-md">🏪 Showroom</span>;
      case 'ttbh':
      case 'service_center':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[11px] font-bold rounded-md">🔧 TTBH</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-[#00B050] text-[11px] font-bold rounded-md">🤝 Đại Lý</span>;
    }
  };

  const handleSelectDealerAndShowMap = (dealer: Dealer) => {
    setActiveDealer(dealer);
    setMobileView('map');
  };

  return (
    <section id="dealers" className="py-8 md:py-12 bg-[#F0F7FF]">
      <div className="container mx-auto px-3.5 sm:px-4 max-w-6xl">
        {/* Header Title */}
        <div className="text-center mb-5 md:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100/70 text-[#0072F5] rounded-full text-xs font-bold mb-2">
            <span>🏪</span>
            <span>ĐIỂM BÁN & SHOWROOM</span>
          </div>
          <h2 className="text-xl md:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            HỆ THỐNG ĐẠI LÝ TOÀN QUỐC
          </h2>
          <p className="text-[#475569] text-xs md:text-sm mt-1">Tìm điểm bán, showroom và trạm bảo hành gần bạn nhất</p>
        </div>

        {/* Mobile View Switcher (List vs Map) */}
        <div className="flex md:hidden bg-slate-200/70 p-1 rounded-xl mb-4 shadow-inner">
          <button
            type="button"
            onClick={() => setMobileView('list')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mobileView === 'list' 
                ? 'bg-white text-[#0072F5] shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListFilter size={14} />
            <span>Danh sách ({filteredDealers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileView('map')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mobileView === 'map' 
                ? 'bg-white text-[#0072F5] shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Map size={14} />
            <span>Bản đồ vị trí</span>
          </button>
        </div>

        {/* Horizontal Quick-Filter Chips */}
        <div className="mb-4 overflow-x-auto no-scrollbar -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-1.5 min-w-max pb-1">
            <button
              type="button"
              onClick={() => { setSelectedProvince(''); setIsExpanded(false); }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedProvince === ''
                  ? 'bg-[#0072F5] text-white shadow-xs scale-[1.02]'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-[#EEF2F6]'
              }`}
            >
              Tất cả ({dealers.length})
            </button>
            {provinces.map(p => {
              const count = dealers.filter(d => d.province === p).length;
              const isSelected = selectedProvince === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setSelectedProvince(p); setIsExpanded(true); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#0072F5] text-white shadow-xs scale-[1.02]'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-[#EEF2F6]'
                  }`}
                >
                  {p} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Layout: Responsive Split on Desktop, Tabbed on Mobile */}
        <div className="flex flex-col md:flex-row gap-5">
          {/* List Column (Hidden on mobile if user chose 'map' view) */}
          <div className={`w-full md:w-5/12 flex flex-col gap-3 ${mobileView === 'map' ? 'hidden md:flex' : 'flex'}`}>
            {loading ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-[#EEF2F6]">
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-[#0072F5] border-t-transparent mr-2"></div>
                <span className="text-xs text-slate-500 font-medium">Đang tải danh sách điểm bán...</span>
              </div>
            ) : filteredDealers.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-[#EEF2F6] p-5">
                <p className="text-slate-600 font-medium text-xs">Không tìm thấy đại lý nào tại khu vực này.</p>
                <button
                  onClick={() => setSelectedProvince('')}
                  className="mt-2 text-xs text-[#0072F5] font-bold hover:underline"
                >
                  Xem tất cả các tỉnh thành
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {displayedDealers.map((dealer) => {
                    const isSelected = activeDealer?.id === dealer.id;
                    return (
                      <div
                        key={dealer.id}
                        onClick={() => setActiveDealer(dealer)}
                        className={`bg-white rounded-2xl border transition-all p-3.5 cursor-pointer shadow-xs ${
                          isSelected 
                            ? 'border-[#0072F5] ring-2 ring-[#0072F5]/15 shadow-sm' 
                            : 'border-[#EEF2F6] hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div>{getTypeBadge(dealer.type)}</div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleSelectDealerAndShowMap(dealer); }}
                            className="text-[11px] font-semibold text-[#0072F5] hover:underline flex items-center gap-1 md:hidden"
                          >
                            <span>Xem bản đồ</span>
                            <Map size={11} />
                          </button>
                        </div>

                        <h3 className="font-bold text-[#0F172A] text-sm leading-snug mb-1.5">
                          {dealer.name}
                        </h3>
                        
                        <div className="flex items-start gap-1.5 text-xs text-[#475569] mb-1.5 leading-relaxed">
                          <MapPin size={13} className="mt-0.5 shrink-0 text-[#0072F5]" />
                          <span>{formatAddress(dealer)}</span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#475569] mb-3">
                          {dealer.phone ? (
                            <div className="flex items-center gap-1 font-semibold text-[#0F172A]">
                              <Phone size={11} className="text-[#00B050]" />
                              <span>{dealer.phone}</span>
                            </div>
                          ) : null}
                          <div className="flex items-center gap-1 text-slate-500">
                            <Clock size={11} className="text-slate-400" />
                            <span>{dealer.openHours || '08:00 - 18:00'}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <a
                            href={getDirectionsUrl(dealer)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 h-[36px] bg-[#0072F5] hover:bg-blue-600 text-white rounded-xl font-bold text-xs transition-all shadow-xs active:scale-[0.98]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Navigation size={13} />
                            <span>Chỉ đường</span>
                          </a>

                          {dealer.phone ? (
                            <a
                              href={`tel:${dealer.phone}`}
                              className="flex-1 flex items-center justify-center gap-1.5 h-[36px] bg-[#00B050] hover:bg-green-600 text-white rounded-xl font-bold text-xs transition-all shadow-xs active:scale-[0.98]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone size={13} />
                              <span>Gọi ngay</span>
                            </a>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Progressive Disclosure (Thu gọn / Xem thêm) on Mobile */}
                {!selectedProvince && filteredDealers.length > 2 && (
                  <div className="text-center pt-1 md:hidden">
                    <button
                      type="button"
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="w-full py-2.5 bg-white border border-[#EEF2F6] hover:bg-slate-50 text-[#0072F5] rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
                    >
                      {isExpanded ? (
                        <>
                          <span>Thu gọn danh sách</span>
                          <ChevronUp size={14} />
                        </>
                      ) : (
                        <>
                          <span>Xem thêm {filteredDealers.length - 2} điểm bán khác</span>
                          <ChevronDown size={14} />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Map Column (Hidden on mobile if user chose 'list' view) */}
          <div className={`w-full md:w-7/12 ${mobileView === 'list' ? 'hidden md:block' : 'block'}`}>
            <div className="bg-white rounded-2xl border border-[#EEF2F6] shadow-xs overflow-hidden sticky top-24">
              {/* Map header info on mobile */}
              {activeDealer && (
                <div className="p-3 bg-white border-b border-[#EEF2F6] flex items-center justify-between md:hidden">
                  <div className="min-w-0 pr-2">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Đang xem vị trí:</div>
                    <div className="text-xs font-bold text-slate-800 truncate">{activeDealer.name}</div>
                  </div>
                  <a
                    href={getDirectionsUrl(activeDealer)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-[#0072F5] text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1"
                  >
                    <Navigation size={12} />
                    <span>Dẫn đường</span>
                  </a>
                </div>
              )}
              
              <div className="h-[280px] sm:h-[350px] md:h-[600px] w-full">
                <iframe
                  title="Bản đồ đại lý WasyPro"
                  src={getMapUrl()}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
