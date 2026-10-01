import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Droplets, 
  HeartPulse, 
  Sparkles, 
  Flame, 
  Activity, 
  CheckCircle2,
  ChevronRight,
  Zap,
  RefreshCw
} from 'lucide-react';

export const HydrogenBenefits: React.FC = () => {
  const [activeBenefit, setActiveBenefit] = useState<number>(0);

  const benefits = [
    {
      id: 0,
      icon: ShieldAlert,
      title: 'Chống Oxy Hóa Mạnh Giúp Trẻ Hóa Tế Bào',
      short: 'Loại bỏ gốc tự do dư thừa, làm chậm quá trình lão hóa da & cơ quan nội tạng.',
      details: 'Khí Hydrogen (H2) hòa tan trong nước là chất chống oxy hóa chọn lọc nhỏ nhất và hiệu quả nhất hành tinh. Khác với vitamin C hay E, phân tử Hydro có khả năng xuyên qua màng tế bào và nhân tế bào để trung hòa các gốc tự do nguy hiểm hydroxyl (•OH), bảo vệ ADN khỏi bị tổn thương.',
      stat: 'Gấp 10x',
      statLabel: 'khả năng chống oxy hóa so với Trà Xanh',
      color: 'from-primary-dark to-primary',
    },
    {
      id: 1,
      icon: Droplets,
      title: 'Cụm Phân Tử Nước Siêu Nhỏ Thẩm Thấu Nhanh',
      short: 'Kích thước chỉ 0.5nm (gấp 5 lần nhỏ hơn nước thường) giúp bù nước trong vài giây.',
      details: 'Nhờ công nghệ điện giải tạo cụm phân tử nước siêu nhỏ (chỉ 5-6 phân tử/cụm thay vì 15-20 phân tử/cụm ở nước thường), nước Hydrogen WASY PRO nhanh chóng vận chuyển chất dinh dưỡng vào từng tế bào và đào thải độc tố ra ngoài qua hệ bài tiết nhanh gấp 5 lần.',
      stat: '0.5 nm',
      statLabel: 'kích thước phân tử nước siêu vi',
      color: 'from-primary to-primary-light',
    },
    {
      id: 2,
      icon: HeartPulse,
      title: 'Cân Bằng Kiềm Tính & Trung Hòa Axit Dạ Dày',
      short: 'pH 8.5 - 9.5 tự nhiên giúp giảm triệu chứng trào ngược, ợ chua, viêm loét dạ dày.',
      details: 'Thói quen ăn uống đồ chiên rán, rượu bia, thức khuya gây tích tụ lượng lớn axit uric và lactic trong cơ thể. Nước ion kiềm nhẹ giúp cân bằng độ pH nội môi về mức 7.35 - 7.45 chuẩn cơ thể sống khỏe mạnh.',
      stat: 'pH 9.5',
      statLabel: 'mức kiềm tự nhiên như rau xanh',
      color: 'from-sky-500 to-green-600',
    },
    {
      id: 3,
      icon: RefreshCw,
      title: 'Đào Thải Độc Tố & Kim Loại Nặng',
      short: 'Hỗ trợ gan thận lọc máu, thanh lọc cơ thể sau khi vận động mạnh hoặc dùng bia rượu.',
      details: 'Khả năng hòa tan cao của nước điện giải giúp làm sạch mảng bám tích tụ lâu ngày trong đường ruột, hỗ trợ gan bài tiết rượu bia và các độc tố kim loại nặng qua hệ bài tiết tự nhiên.',
      stat: '85%',
      statLabel: 'tăng hiệu quả giải độc rượu bia',
      color: 'from-accent to-accent-hover',
    },
    {
      id: 4,
      icon: Sparkles,
      title: 'Tăng Cường Năng Lượng & Hệ Miễn Dịch',
      short: 'Cung cấp vi khoáng thiết yếu (Ca2+, Mg2+, Na+, K+) giúp cơ thể luôn sung sức.',
      details: 'Nước Hydrogen bảo tồn nguyên vẹn các vi khoáng ion hóa dưới dạng cơ thể dễ hấp thụ nhất mà không cần qua quá trình chuyển hóa phức tạp, giúp tăng cường hệ miễn dịch tự nhiên.',
      stat: '+40%',
      statLabel: 'tăng sức bền thể chất sau 2 tuần',
      color: 'from-amber-500 to-orange-500',
    },
    {
      id: 5,
      icon: Activity,
      title: 'Hỗ Trợ Tiêu Hóa & Đường Ruột Khỏe Mạnh',
      short: 'Đã được Bộ Y Tế Nhật Bản & Hàn Quốc công nhận hiệu quả cải thiện đường ruột.',
      details: 'Nước ion kiềm giàu Hydro làm giảm triệu chứng táo bón, tiêu chảy mạn tính và chướng bụng. Nước được cấp chứng nhận thiết bị y tế gia đình tại Nhật Bản từ năm 1965.',
      stat: 'ISO 13485',
      statLabel: 'chuẩn thiết bị y tế quốc tế',
      color: 'from-primary-dark to-accent',
    },
  ];

  const current = benefits[activeBenefit];
  const IconComponent = current.icon;

  return (
    <section id="benefits" className="py-12 bg-gray-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-[24px] sm:text-[28px] font-heading font-bold text-gray-800 tracking-tight uppercase">
            SỨC KHỎE HYDROGEN
          </h2>
          <div className="w-16 h-1 bg-primary mx-auto mt-4 mb-4"></div>
        </div>

        {/* Interactive Infographic Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Grid: 6 Interactive Benefit Tabs */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((b) => {
              const BIcon = b.icon;
              const isActive = activeBenefit === b.id;
              return (
                <div
                  key={b.id}
                  onClick={() => setActiveBenefit(b.id)}
                  className={`p-4 rounded-md cursor-pointer transition-all duration-300 border flex flex-col justify-between ${
                    isActive
                      ? 'bg-white border-primary shadow-sm ring-1 ring-primary'
                      : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-primary shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center text-white bg-gradient-to-br ${b.color} shadow-sm`}>
                      <BIcon className="w-5 h-5" />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-heading font-bold text-gray-900 text-sm sm:text-base mb-1">
                      {b.title}
                    </h3>
                    <p className="text-[13px] text-gray-500 line-clamp-2 leading-relaxed">
                      {b.short}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[12px] font-bold text-primary">
                    <span>Xem chi tiết</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'translate-x-1' : ''}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Featured Card: Deep Dive Medical Detail Panel */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-md p-6 sm:p-8 h-full flex flex-col justify-between border border-gray-200 shadow-lg relative overflow-hidden">
              
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-md flex items-center justify-center text-white bg-gradient-to-br ${current.color} shadow-sm`}>
                    <IconComponent className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-[18px] sm:text-[20px] font-heading font-bold text-gray-900">
                      {current.title}
                    </h3>
                  </div>
                </div>

                {/* Big Metric Display */}
                <div className="p-4 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="text-[12px] text-gray-500 font-bold block uppercase tracking-wider mb-1">Tỷ lệ vượt trội</span>
                    <span className="text-[24px] sm:text-[28px] font-heading font-extrabold text-primary">
                      {current.stat}
                    </span>
                  </div>
                  <div className="text-right max-w-[160px]">
                    <span className="text-[12px] text-gray-500 font-bold block">{current.statLabel}</span>
                  </div>
                </div>

                {/* Medical Explanation Text */}
                <div className="space-y-3 text-gray-700 text-[14px] leading-relaxed">
                  <p>{current.details}</p>
                </div>

                {/* Visual Comparative Matrix */}
                <div className="space-y-2 pt-4">
                  <span className="text-[12px] font-bold text-gray-800 uppercase tracking-wider block">
                    So Sánh Khả Năng Thẩm Thấu Tế Bào
                  </span>
                  
                  <div className="space-y-3 text-[12px]">
                    <div>
                      <div className="flex justify-between text-gray-600 mb-1 font-bold">
                        <span>Nước Hydrogen Ion Kiềm WASY PRO</span>
                        <span className="text-primary">99.5%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: '99.5%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-gray-500 mb-1 font-bold">
                        <span>Nước RO Thông Thường</span>
                        <span>45%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-400 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Assurance */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-[12px] text-gray-500 font-bold">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Chứng nhận an toàn vệ sinh BYT</span>
                </div>
                <span className="text-primary-dark">WASY Water King</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
