import React, { useState, useEffect, useMemo } from 'react';
import { Article } from '../types/schema';
import { api } from '../services/api';
import { 
  Play, 
  X, 
  Calendar, 
  Sparkles, 
  Tv, 
  Factory, 
  Users, 
  ExternalLink,
  ChevronRight,
  Video
} from 'lucide-react';

// Hàm lấy YouTube Embed URL
function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  let videoId = '';
  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split('?')[0];
  } else if (url.includes('watch?v=')) {
    videoId = url.split('watch?v=')[1].split('&')[0];
  } else if (url.includes('embed/')) {
    videoId = url.split('embed/')[1].split('?')[0];
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : null;
}

export const NewsSection: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadArticles = async () => {
      setIsLoading(true);
      try {
        const data = await api.getArticles();
        setArticles(data);
      } catch (err) {
        console.error('Error fetching articles:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadArticles();
  }, []);

  // Danh sách các categories thực tế
  const categories = useMemo(() => {
    const set = new Set<string>();
    articles.forEach(a => { if (a.category) set.add(a.category); });
    return ['all', ...Array.from(set)];
  }, [articles]);

  // Lọc bài viết / video theo danh mục
  const filteredArticles = useMemo(() => {
    if (activeCategory === 'all') return articles;
    return articles.filter(a => a.category === activeCategory);
  }, [articles, activeCategory]);

  const activeEmbedUrl = selectedArticle ? getYouTubeEmbedUrl(selectedArticle.videoUrl) : null;

  return (
    <section id="news" className="py-12 sm:py-20 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Tiêu đề mục */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-sky-50 text-primary text-xs font-bold uppercase tracking-wider mb-2 border border-primary/10">
            <Sparkles className="w-3.5 h-3.5" />
            Truyền Thông & Hoạt Động
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            TIN TỨC & VIDEO SỰ KIỆN
          </h2>
          <p className="mt-2 text-xs sm:text-sm md:text-base text-slate-500 font-medium">
            Hành trình lan tỏa nguồn nước tốt, quy mô nhà máy và sự ghi nhận từ đài truyền hình HTV
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-primary to-accent mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Dải Tabs Phân Loại */}
        {categories.length > 2 && (
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = activeCategory === cat;
              const label = cat === 'all' ? 'Tất Cả Sự Kiện' : cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                    isSelected
                      ? 'bg-gradient-to-r from-primary to-sky-600 text-white shadow-md shadow-sky-500/25'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm animate-pulse space-y-3">
                <div className="w-full aspect-video bg-slate-100 rounded-xl"></div>
                <div className="h-4 bg-slate-100 rounded-md w-3/4"></div>
                <div className="h-3 bg-slate-100 rounded-md w-full"></div>
              </div>
            ))}
          </div>
        ) : (
          /* Lưới Video Sự Kiện & Tin Tức */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
            {filteredArticles.map((art) => (
              <div
                key={art.id}
                onClick={() => setSelectedArticle(art)}
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-sky-200/80 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail Video chuẩn 16:9 với Nút Play YouTube */}
                  <div className="relative aspect-video overflow-hidden bg-slate-950">
                    <img
                      src={art.image}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=80';
                      }}
                    />

                    {/* Lớp phủ chuyển sắc nhẹ */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none group-hover:from-black/40 transition-colors" />

                    {/* Badge Chuyên Mục */}
                    <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/15 shadow-sm z-10">
                      {art.category}
                    </span>

                    {/* Nút Play Tròn Đỏ (Phong cách Video YouTube nổi bật) */}
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 group-hover:scale-115 group-hover:bg-rose-600 transition-all duration-300">
                        <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white ml-1" />
                      </div>
                    </div>

                    {/* Thời lượng / Tag góc dưới */}
                    <div className="absolute bottom-2.5 right-3 text-[11px] pointer-events-none font-semibold text-white/90 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded flex items-center gap-1">
                      <Video className="w-3 h-3 text-accent" />
                      <span>{art.readTime || 'Video'}</span>
                    </div>
                  </div>

                  {/* Thông tin Bài viết / Video */}
                  <div className="p-4 sm:p-5 space-y-2.5">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{art.date}</span>
                      <span>•</span>
                      <span className="text-sky-700 font-semibold">{art.author}</span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-[14px] sm:text-[15px] leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {art.title}
                    </h3>

                    {art.excerpt && (
                      <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed line-clamp-2">
                        {art.excerpt}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer card: Xem Video */}
                <div className="px-4 sm:px-5 pb-4 pt-1 flex items-center justify-between text-xs font-bold text-primary group-hover:text-sky-600 border-t border-slate-50">
                  <span className="flex items-center gap-1">
                    Xem video chi tiết
                  </span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ===== POPUP XEM VIDEO YOUTUBE & BÀI VIẾT ===== */}
      {selectedArticle && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedArticle(null)}
        >
          <div 
            className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
              <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {selectedArticle.category}
              </span>
              <button
                onClick={() => setSelectedArticle(null)}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors"
                title="Đóng popup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Trình chiếu Video YouTube hoặc Hình Ảnh */}
            <div className="relative w-full aspect-video bg-black">
              {activeEmbedUrl ? (
                <iframe
                  src={activeEmbedUrl}
                  title={selectedArticle.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <img
                  src={selectedArticle.image}
                  alt={selectedArticle.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Nội dung chi tiết bài viết */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-3.5">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>{selectedArticle.date}</span>
                <span>•</span>
                <span className="font-semibold text-slate-700">{selectedArticle.author}</span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                {selectedArticle.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                {selectedArticle.excerpt}
              </p>

              {selectedArticle.content && (
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2 pt-1">
                  {selectedArticle.content}
                </div>
              )}

              {/* Link xem trên YouTube */}
              {selectedArticle.videoUrl && (
                <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                  <a
                    href={selectedArticle.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
                  >
                    <span>Mở xem trên YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                  >
                    Đóng
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
