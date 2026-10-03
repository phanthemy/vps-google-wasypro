import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowRight, 
  PhoneCall, 
  Droplets, 
  Zap, 
  Activity, 
  ShieldCheck, 
  Award, 
  ChevronLeft, 
  ChevronRight,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Video as VideoIcon,
  Image as ImageIcon
} from 'lucide-react';

interface HeroProps {
  onExploreClick: () => void;
  onContactClick: () => void;
}

interface SlideItem {
  id: string;
  type: 'video' | 'image';
  src: string;
  poster?: string;
  badge: string;
  title: string;
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

const slides: SlideItem[] = [
  {
    id: 'slide-video',
    type: 'video',
    src: '/videos/hero-video.mp4',
    poster: '/images/video-thumb.jpg',
    badge: 'Video Trải Nghiệm',
    title: 'Công Nghệ Hydrogen Tươi Đột Phá'
  },
  {
    id: 'slide-banner1',
    type: 'image',
    src: '/images/banner1.jpg?v=20261001',
    badge: 'Wasy Pro Hydrogen',
    title: 'Nước Tốt - Thân An - Trí Sáng'
  },
  {
    id: 'slide-banner2',
    type: 'image',
    src: '/images/banner2.jpg?v=20261001',
    badge: 'Sản Phẩm Water King',
    title: 'Tinh Khiết - Giàu Khoáng - Cân Bằng pH'
  },
  {
    id: 'slide-banner3',
    type: 'image',
    src: '/images/banner3.jpg?v=20261001',
    badge: 'Bộ Sưu Tập Máy Lọc',
    title: 'WS-03 PRO · WS-01 PRO · WS-01 PRO MAX'
  }
];

export const Hero: React.FC<HeroProps> = ({ onExploreClick, onContactClick }) => {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const videoRef = useRef<HTMLVideoElement>(null);

  const { count: phCount, ref: phRef } = useCounter(95, 2200);
  const { count: orpCount, ref: orpRef } = useCounter(600, 2200);
  const { count: h2Count, ref: h2Ref } = useCounter(1600, 2200);

  // Điều khiển Video theo slide
  useEffect(() => {
    if (!videoRef.current) return;
    const currentSlide = slides[current];
    if (currentSlide.type === 'video') {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      }
    } else {
      videoRef.current.pause();
    }
  }, [current, isPlaying]);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent(index);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [isTransitioning]);

  const next = useCallback(() => goToSlide((current + 1) % slides.length), [current, goToSlide]);
  const prev = useCallback(() => goToSlide((current - 1 + slides.length) % slides.length), [current, goToSlide]);

  // Tự động chuyển slide sau mỗi 9 giây
  useEffect(() => {
    timerRef.current = setInterval(next, 9000);
    return () => clearInterval(timerRef.current);
  }, [next]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <section className="relative w-full bg-slate-950 text-white overflow-hidden">
      {/* ===== HERO BANNER SLIDER SẮC NÉT (KHÔNG PHỦ LỚP MỜ) ===== */}
      <div className="relative w-full overflow-hidden bg-black">
        {/* Khung chứa tỉ lệ chuẩn theo Backdrop 1.92:1 (256x133cm) */}
        <div className="relative w-full aspect-[21/9] min-h-[220px] max-h-[520px] lg:max-h-[560px] xl:max-h-[600px] flex items-center justify-center">
          {slides.map((s, i) => {
            const isActive = i === current;
            return (
              <div
                key={s.id}
                className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                  isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                {s.type === 'video' ? (
                  <div className="relative w-full h-full flex items-center justify-center bg-black">
                    <video
                      ref={videoRef}
                      src={s.src}
                      poster={s.poster}
                      autoPlay
                      loop
                      muted={isMuted}
                      playsInline
                      preload="auto"
                      className="w-full h-full object-cover object-center"
                    />

                    {/* Nút điều khiển Video */}
                    <div className="absolute bottom-3 sm:bottom-5 right-3 sm:right-5 z-20 flex items-center gap-1.5 sm:gap-2">
                      <button
                        onClick={togglePlay}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 transition-all flex items-center justify-center shadow-lg active:scale-95"
                        title={isPlaying ? 'Tạm dừng video' : 'Phát tiếp video'}
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5 text-accent" />}
                      </button>
                      <button
                        onClick={toggleMute}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 transition-all flex items-center justify-center shadow-lg active:scale-95"
                        title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                      >
                        {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-300" /> : <Volume2 className="w-3.5 h-3.5 text-sky-400" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Slide Backdrop PDF: Ảnh 4K sắc nét 100% nguyên bản
                  <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
                    <img
                      src={s.src}
                      alt={s.title}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Nút Prev / Next */}
        <button
          onClick={prev}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/15 transition-all flex items-center justify-center z-20 shadow-xl active:scale-95"
          aria-label="Slide trước"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={next}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/15 transition-all flex items-center justify-center z-20 shadow-xl active:scale-95"
          aria-label="Slide sau"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Thanh chuyển slide nhanh (Dots có icon) */}
        <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-20 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goToSlide(i)}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                i === current
                  ? 'bg-gradient-to-r from-primary to-sky-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {s.type === 'video' ? <VideoIcon className="w-3 h-3 text-accent" /> : <ImageIcon className="w-3 h-3" />}
              <span className="hidden sm:inline text-[11px]">{s.badge}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== KHU VỰC THÔNG SỐ & HÀNH ĐỘNG (TÁCH BIỆT, KHÔNG CHE BANNER) ===== */}
      <div className="relative z-10 bg-white text-slate-800 border-b border-slate-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          
          {/* Hàng thông số & Nút hành động */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
            
            {/* 3 Thông số cốt lõi */}
            <div ref={phRef} className="grid grid-cols-3 gap-3 sm:gap-6 w-full lg:w-auto flex-1 divide-x divide-slate-100">
              <div className="flex items-center justify-center sm:justify-start gap-2.5 sm:gap-3.5 px-1">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-sky-50 flex items-center justify-center text-primary flex-shrink-0 shadow-xs">
                  <Droplets className="w-5 h-5 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <div className="font-black text-[20px] sm:text-[26px] text-slate-900 leading-none">
                    pH {(phCount / 10).toFixed(1)}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-1">Nước kiềm giàu ion</div>
                </div>
              </div>
              
              <div ref={orpRef} className="flex items-center justify-center sm:justify-start gap-2.5 sm:gap-3.5 px-2">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-50 flex items-center justify-center text-accent flex-shrink-0 shadow-xs">
                  <Zap className="w-5 h-5 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <div className="font-black text-[20px] sm:text-[26px] text-slate-900 leading-none">
                    -{orpCount}<span className="text-[13px] sm:text-[14px] font-bold ml-0.5">mV</span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-1">Chống oxy hoá</div>
                </div>
              </div>

              <div ref={h2Ref} className="flex items-center justify-center sm:justify-start gap-2.5 sm:gap-3.5 px-2">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500 flex-shrink-0 shadow-xs">
                  <Activity className="w-5 h-5 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <div className="font-black text-[20px] sm:text-[26px] text-slate-900 leading-none">
                    {h2Count}<span className="text-[13px] sm:text-[14px] font-bold ml-0.5">ppb</span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-1">Hàm lượng Hydrogen</div>
                </div>
              </div>
            </div>

            {/* Dải phân cách trên màn hình lớn */}
            <div className="hidden lg:block w-px h-12 bg-slate-200 flex-shrink-0" />

            {/* Cụm nút CTA */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-center flex-shrink-0">
              <button
                onClick={onExploreClick}
                className="flex-1 sm:flex-none px-6 sm:px-7 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-primary to-sky-600 hover:from-primary-dark hover:to-primary transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-md shadow-sky-500/20 active:scale-95"
              >
                Khám Phá Sản Phẩm
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onContactClick}
                className="flex-1 sm:flex-none px-5 sm:px-6 py-3 rounded-xl font-bold text-primary bg-slate-50 border border-primary/20 hover:bg-sky-50 transition-all duration-300 flex items-center justify-center gap-2 text-sm active:scale-95"
              >
                <PhoneCall className="w-4 h-4 text-accent" />
                Tư Vấn Miễn Phí
              </button>
            </div>
          </div>

          {/* Dòng cam kết chứng nhận */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 mt-4 pt-3.5 border-t border-slate-100 text-slate-500 text-[11px] sm:text-[12px] font-medium flex-wrap">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Chuẩn Y tế ISO 13485
            </div>
            <span className="text-slate-200 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-accent" /> Chứng nhận KFDA Hàn Quốc
            </div>
            <span className="text-slate-200 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Miễn phí vận chuyển & Lắp đặt
            </div>
            <span className="text-slate-200 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-accent" /> Bảo hành 5 năm chính hãng
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
