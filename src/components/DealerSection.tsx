import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, Navigation } from 'lucide-react';

interface Dealer {
  id: string;
  name: string;
  code: string;
  phone: string;
  address: string;
  province: string;
  district: string;
  latitude: number;
  longitude: number;
  openHours: string;
  type: string;
  description: string;
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

  useEffect(() => {
    const fetchDealers = async () => {
      try {
        const response = await fetch('/api/dealers');
        if (response.ok) {
          const data: ApiResponse = await response.json();
          setDealers(data.dealers.filter(d => d.isActive));
          setProvinces(data.provinces);
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

  const getMapUrl = () => {
    if (activeDealer && activeDealer.latitude && activeDealer.longitude) {
      return `https://maps.google.com/maps?q=${activeDealer.latitude},${activeDealer.longitude}&z=15&output=embed`;
    }
    return 'https://maps.google.com/maps?q=WasyPro+Vietnam&z=6&output=embed';
  };

  const getTypeBadge = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'showroom':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-[#0072F5] text-xs font-semibold rounded-md">🏪 Showroom</span>;
      case 'ttbh':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-600 text-xs font-semibold rounded-md">🔧 TTBH</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-[#00B050] text-xs font-semibold rounded-md">🤝 Đại Lý</span>;
    }
  };

  return (
    <section id="dealers" className="py-12 bg-[#F0F7FF]">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A] mb-2">🏪 HỆ THỐNG ĐẠI LÝ</h2>
          <p className="text-[#475569]">Tìm điểm bán & showroom gần bạn nhất</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/3 flex flex-col gap-4">
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full h-[48px] px-4 rounded-[14px] border border-[#EEF2F6] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0072F5] shadow-sm"
            >
              <option value="">Tất cả Tỉnh/Thành</option>
              {provinces.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <div className="flex-1 overflow-y-auto max-h-[600px] flex flex-col gap-4">
              {loading ? (
                <div className="text-center py-8 text-[#475569]">Đang tải...</div>
              ) : filteredDealers.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-[18px] border border-[#EEF2F6] shadow-sm">
                  <p className="text-[#475569]">Không tìm thấy đại lý nào.</p>
                </div>
              ) : (
                filteredDealers.map((dealer) => (
                  <div
                    key={dealer.id}
                    onClick={() => setActiveDealer(dealer)}
                    className={`bg-white rounded-[18px] border ${activeDealer?.id === dealer.id ? 'border-[#0072F5] ring-1 ring-[#0072F5]' : 'border-[#EEF2F6]'} shadow-sm p-4 cursor-pointer transition-all hover:shadow-md`}
                  >
                    <div className="mb-2">{getTypeBadge(dealer.type)}</div>
                    <h3 className="font-bold text-[#0F172A] mb-2">{dealer.name}</h3>
                    
                    <div className="flex items-start gap-2 text-sm text-[#475569] mb-2">
                      <MapPin size={16} className="mt-0.5 shrink-0" />
                      <span>{dealer.address}{dealer.district ? `, ${dealer.district}` : ''}{dealer.province ? `, ${dealer.province}` : ''}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-[#475569] mb-2">
                      <Phone size={16} className="shrink-0" />
                      <span>{dealer.phone}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-[#475569] mb-4">
                      <Clock size={16} className="shrink-0" />
                      <span>{dealer.openHours || '08:00 - 17:30'}</span>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${dealer.latitude},${dealer.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 h-[44px] bg-[#0072F5] text-white rounded-[14px] font-medium hover:bg-blue-600 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Navigation size={18} />
                        <span>Chỉ đường</span>
                      </a>
                      <a
                        href={`tel:${dealer.phone}`}
                        className="flex-1 flex items-center justify-center gap-2 h-[44px] bg-[#00B050] text-white rounded-[14px] font-medium hover:bg-green-600 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone size={18} />
                        <span>Gọi ngay</span>
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="w-full md:w-2/3 h-[400px] md:h-auto min-h-[400px] bg-white rounded-[18px] border border-[#EEF2F6] shadow-sm overflow-hidden">
            <iframe
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
    </section>
  );
};
