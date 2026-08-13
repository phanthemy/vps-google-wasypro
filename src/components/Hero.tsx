import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight, PhoneCall, Droplets, Zap, Activity, ShieldCheck, Award, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroProps {
  onExploreClick: () => void;
  onContactClick: () => void;
}

const useCounter = (end: number, duration: number = 2200) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let startTime: number;
    let raf: number;
    const update = (ts: number) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(end * eased));
      if (p < 1) raf = requestAnimationFrame(update);
      else setCount(end);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, started]);

  return { count, ref };
};

const slides = [
  {
    image: '/images/banner-web.webp',
    badge: 'Công nghệ Hàn Quốc & Nhật Bản',
    headline1: 'Nước Hydrogen',
    headline2: 'Giàu Ion Kiềm Sạch',
    subtitle: 'Giải pháp nước uống khoẻ chống lão hóa, bảo vệ sức khỏe toàn diện cho cả gia đình.',
    highlight: 'Bảo hành 5 năm tại nhà.',
  },
  {
    image: '/images/banner-web.webp',
    badge: 'Máy Lọc Nước Cao Cấp',
    headline1: '9 Cấp Lọc',
    headline2: 'Chuẩn Y Tế Quốc Tế',
    subtitle: 'Hệ thống lọc 9 cấp loại bỏ 99.9% tạp chất, vi khuẩn, kim loại nặng. Giữ lại khoáng chất có lợi.',
    highlight: 'Miễn phí lắp đặt tận nhà.',
  },
  {
    image: '/images/banner-web.webp',
    badge: 'Khuyến Mãi Đặc Biệt',
    headline1: 'Ưu Đãi Lên Đến',
    headline2: '50% Cho Gia Đình Việt',
    subtitle: 'Đầu tư cho sức khỏe gia đình với máy lọc nước Water King chính hãng. Trả góp 0% lãi suất.',
    highlight: 'Hotline tư vấn 1900 98 98 78.',
  },
];

export const Hero: React.FC<HeroProps> = ({ onExploreClick, onContactClick }) => {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const { count: phCount, ref: phRef } = useCounter(95, 2200);
  const { count: orpCount, ref: orpRef } = useCounter(600, 2200);
  const { count: h2Count, ref: h2Ref } = useCounter(1600, 2200);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent(index);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [isTransitioning]);

  const next = useCallback(() => goToSlide((current + 1) % slides.length), [current, goToSlide]);
  const prev = useCallback(() => goToSlide((current - 1 + slides.length) % slides.length), [current, goToSlide]);

  // Auto-play
  useEffect(() => {
    timerRef.current = setInterval(next, 6000);
    return () => clearInterval(timerRef.current);
  }, [next]);

  // Touch swipe for mobile
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { diff > 0 ? next() : prev(); }
  };

  const slide = slides[current];

  return (
    <section
      id="hero"
      className="relative pt-[88px] overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background images — stacked for transition */}
      {slides.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <img src={s.image} alt="" className="w-full h-full object-cover" />
        </div>
      ))}

      {/* Dark overlay — stronger on mobile for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a1f12]/95 via-[#0f2d1a]/90 to-[#1a472a]/60 md:from-[#0a1f12]/95 md:via-[#0f2d1a]/80 md:to-[#1a472a]/40" />
      
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-50 to-transparent z-10" />

      {/* Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        <div className="max-w-2xl">
          {/* Badge */}
          <div
            key={`badge-${current}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/90 font-semibold text-[12px] sm:text-[13px] mb-6 sm:mb-8 border border-white/15 animate-[fadeInUp_0.5s_ease-out]"
          >
            <Award className="w-4 h-4 text-accent" />
            <span>{slide.badge}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          
          {/* Headline */}
          <h1
            key={`h1-${current}`}
            className="font-heading leading-[1.08] mb-4 sm:mb-6 animate-[fadeInUp_0.6s_ease-out]"
          >
            <span className="block text-[32px] sm:text-[44px] lg:text-[58px] font-extrabold text-white drop-shadow-lg">
              {slide.headline1}
            </span>
            <span className="block text-[32px] sm:text-[44px] lg:text-[58px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-accent">
              {slide.headline2}
            </span>
          </h1>
          
          {/* Subtitle */}
          <p
            key={`sub-${current}`}
            className="text-white/70 text-[14px] sm:text-[16px] lg:text-[18px] leading-relaxed mb-8 sm:mb-10 max-w-lg animate-[fadeInUp_0.7s_ease-out]"
          >
            {slide.subtitle}{' '}
            <span className="text-accent font-bold">{slide.highlight}</span>
          </p>

          {/* Counter Cards */}
          <div ref={phRef} className="grid grid-cols-3 gap-2 sm:gap-3 mb-8 sm:mb-10">
            <div className="bg-white/[0.08] backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10 hover:bg-white/[0.12] transition-all group">
              <Droplets className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-extrabold text-[20px] sm:text-[26px] lg:text-[30px] text-white tracking-tight leading-none">
                pH {(phCount / 10).toFixed(1)}
              </div>
              <div className="text-[9px] sm:text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Nước kiềm</div>
            </div>
            
            <div ref={orpRef} className="bg-white/[0.08] backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10 hover:bg-white/[0.12] transition-all group">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-accent mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-extrabold text-[20px] sm:text-[26px] lg:text-[30px] text-white tracking-tight leading-none">
                -{orpCount}<span className="text-[13px] sm:text-[16px]">mV</span>
              </div>
              <div className="text-[9px] sm:text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Chống oxy hóa</div>
            </div>

            <div ref={h2Ref} className="bg-white/[0.08] backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10 hover:bg-white/[0.12] transition-all group">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400 mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-extrabold text-[20px] sm:text-[26px] lg:text-[30px] text-white tracking-tight leading-none">
                {h2Count}<span className="text-[13px] sm:text-[16px]">ppb</span>
              </div>
              <div className="text-[9px] sm:text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Hydrogen</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 sm:mb-8">
            <button
              onClick={onExploreClick}
              className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold text-white bg-gradient-to-r from-primary to-emerald-500 hover:from-primary-dark hover:to-primary transition-all duration-300 flex items-center justify-center gap-2 text-[14px] sm:text-[15px] shadow-lg shadow-emerald-900/40 hover:shadow-xl hover:-translate-y-0.5"
            >
              Khám Phá Sản Phẩm
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onContactClick}
              className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold text-white bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2 text-[14px] sm:text-[15px] hover:-translate-y-0.5"
            >
              <PhoneCall className="w-5 h-5 text-accent" />
              Tư Vấn Miễn Phí
            </button>
          </div>

          {/* Trust row */}
          <div className="hidden sm:flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5 text-white/40 text-[12px] font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400/70" /> ISO 13485
            </div>
            <div className="w-px h-3 bg-white/15" />
            <div className="flex items-center gap-1.5 text-white/40 text-[12px] font-medium">
              <Award className="w-4 h-4 text-accent/70" /> KFDA Korea
            </div>
            <div className="w-px h-3 bg-white/15" />
            <div className="flex items-center gap-1.5 text-white/40 text-[12px] font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400/70" /> Lắp đặt miễn phí
            </div>
          </div>
        </div>

        {/* Slide Navigation — arrows */}
        <button
          onClick={prev}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-white/70 hover:text-white hover:bg-white/20 transition-all flex items-center justify-center z-30"
          aria-label="Banner trước"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <button
          onClick={next}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-white/70 hover:text-white hover:bg-white/20 transition-all flex items-center justify-center z-30"
          aria-label="Banner sau"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`transition-all duration-300 rounded-full ${
                i === current
                  ? 'w-8 h-2.5 bg-accent'
                  : 'w-2.5 h-2.5 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* CSS animation */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
};
