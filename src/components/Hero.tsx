import React from 'react';
import { ArrowRight, Zap } from 'lucide-react';

interface HeroProps {
  onExploreClick: () => void;
  onContactClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreClick, onContactClick }) => {
  return (
    <section id="hero" className="pt-[88px]">
      {/* Banner Image - Full width, giống hệt wasypro.com */}
      <div className="relative w-full">
        <img 
          src="/images/banner-web.webp" 
          alt="WASY PRO HYDROGEN - Giải Pháp Nước Hydrogen Giàu Ion Kiềm Sạch" 
          className="w-full h-auto block"
        />
        
        {/* CTA Buttons overlay ở dưới banner */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 flex flex-col sm:flex-row items-center gap-3 z-10">
          <button
            onClick={onExploreClick}
            className="px-6 py-2.5 rounded-md font-bold text-white bg-primary hover:bg-primary-dark transition-colors duration-300 flex items-center gap-2 text-[13px] uppercase shadow-lg whitespace-nowrap"
          >
            <span>Khám Phá Sản Phẩm</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onContactClick}
            className="px-6 py-2.5 rounded-md font-bold text-primary-dark bg-white/90 backdrop-blur-sm border-2 border-primary hover:bg-white transition-colors duration-300 flex items-center gap-2 text-[13px] uppercase shadow-lg whitespace-nowrap"
          >
            <Zap className="w-4 h-4 text-accent" />
            <span>Đăng Ký Tư Vấn Free</span>
          </button>
        </div>
      </div>
    </section>
  );
};
