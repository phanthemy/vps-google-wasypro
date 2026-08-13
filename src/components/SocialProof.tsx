import React, { useState, useEffect, useRef } from 'react';
import { Users, ThumbsUp, Star, ChevronLeft, ChevronRight, Award, ShieldCheck, Wrench, Settings } from 'lucide-react';

const useCounter = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let startTime: number;
    let animationFrame: number;

    const updateCounter = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      setCount(Math.floor(end * percentage));

      if (progress < duration) {
        animationFrame = requestAnimationFrame(updateCounter);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(updateCounter);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, started]);

  return { count, ref };
};

const testimonials = [
  {
    name: "Anh Nguyễn Văn Minh",
    age: 45,
    city: "Hà Nội",
    content: "Sử dụng máy Water King Pro 9 được 6 tháng, cả nhà ai cũng thấy khỏe hơn. Nước uống mềm, ngọt tự nhiên.",
    initial: "M",
    rating: 5
  },
  {
    name: "Chị Trần Thị Lan",
    age: 38,
    city: "TP.HCM",
    content: "Ban đầu còn bán tín bán nghi, nhưng sau khi đo pH thấy đúng 9.0 thì tin luôn. Dịch vụ lắp đặt chuyên nghiệp.",
    initial: "L",
    rating: 5
  },
  {
    name: "Bác Nguyễn Xuân Kính",
    age: 62,
    city: "Đà Nẵng",
    content: "Máy chạy êm, lọc nhanh, nước trong vắt. Bảo hành 5 năm tại nhà rất yên tâm.",
    initial: "K",
    rating: 5
  },
  {
    name: "Chị Phạm Thu Hà",
    age: 42,
    city: "Hải Phòng",
    content: "Nước Hydrogen khác hẳn nước máy thường, da mặt tôi đẹp hơn từ khi uống nước này hàng ngày.",
    initial: "H",
    rating: 5
  },
  {
    name: "Anh Lê Hoàng",
    age: 50,
    city: "Cần Thơ",
    content: "Mua cho bố mẹ dùng, ông bà khen nước ngon, bụng dạ đỡ đầy hơi hẳn. Cảm ơn WASY PRO.",
    initial: "H",
    rating: 5
  }
];

export const SocialProof: React.FC = () => {
  const { count: usersCount, ref: usersRef } = useCounter(1500, 2000);
  const { count: percentCount, ref: percentRef } = useCounter(98, 2000);
  
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % testimonials.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="py-16 bg-green-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-primary-dark mb-3">Khách Hàng Tin Dùng</h2>
          <p className="text-gray-600 text-lg">Hàng ngàn gia đình Việt đã lựa chọn WASY PRO</p>
        </div>

        {/* Counter Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div ref={usersRef} className="bg-white rounded-2xl p-6 border border-green-100 shadow-md shadow-green-100/50 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div className="text-4xl font-bold text-gray-800 mb-2">{usersCount.toLocaleString()}+</div>
            <div className="text-gray-500 font-medium">Gia đình tin dùng</div>
          </div>
          
          <div ref={percentRef} className="bg-white rounded-2xl p-6 border border-green-100 shadow-md shadow-green-100/50 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
              <ThumbsUp className="w-6 h-6 text-accent" />
            </div>
            <div className="text-4xl font-bold text-gray-800 mb-2">{percentCount}%</div>
            <div className="text-gray-500 font-medium">Hài lòng dịch vụ</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-green-100 shadow-md shadow-green-100/50 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-amber-500" />
            </div>
            <div className="text-4xl font-bold text-gray-800 mb-2">4.9/5</div>
            <div className="text-gray-500 font-medium">Đánh giá trung bình</div>
          </div>
        </div>

        {/* Testimonial Carousel */}
        <div className="relative max-w-4xl mx-auto mb-16">
          <div className="overflow-hidden relative rounded-2xl bg-white shadow-xl shadow-green-100 border border-green-50 p-8 md:p-12">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {testimonials.map((testi, idx) => (
                <div key={idx} className="w-full flex-shrink-0 px-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center text-2xl font-bold mb-4 shadow-lg">
                      {testi.initial}
                    </div>
                    <div className="flex gap-1 mb-4">
                      {[...Array(testi.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-lg md:text-xl text-gray-700 italic mb-6 leading-relaxed">"{testi.content}"</p>
                    <div className="font-bold text-gray-900">{testi.name}</div>
                    <div className="text-sm text-gray-500">{testi.age} tuổi, {testi.city}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Carousel Controls */}
            <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:text-primary hover:bg-green-50 transition-colors z-10">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:text-primary hover:bg-green-50 transition-colors z-10">
              <ChevronRight className="w-6 h-6" />
            </button>
            
            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${currentSlide === idx ? 'bg-primary' : 'bg-gray-200'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Badges Row */}
        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
            <Award className="w-5 h-5 text-primary" />
            <span className="font-bold text-gray-700 text-sm">ISO 13485</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="font-bold text-gray-700 text-sm">KFDA Korea</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
            <Settings className="w-5 h-5 text-primary" />
            <span className="font-bold text-gray-700 text-sm">Bảo hành 5 Năm</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
            <Wrench className="w-5 h-5 text-primary" />
            <span className="font-bold text-gray-700 text-sm">Lắp đặt miễn phí</span>
          </div>
        </div>
      </div>
    </section>
  );
};
