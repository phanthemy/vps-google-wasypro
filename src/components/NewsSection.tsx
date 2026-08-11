import React, { useState, useEffect } from 'react';
import { Article } from '../types/schema';
import { api } from '../services/api';
import { 
  BookOpen, 
  Clock, 
  User, 
  X, 
  ArrowRight, 
  Calendar, 
  Share2, 
  Sparkles 
} from 'lucide-react';

export const NewsSection: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
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

  return (
    <section id="news" className="py-12 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-[24px] sm:text-[28px] font-heading font-bold text-gray-800 tracking-tight uppercase">
            TIN TỨC SỰ KIỆN
          </h2>
          <div className="w-16 h-1 bg-primary mx-auto mt-4 mb-4"></div>
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-md p-4 border border-gray-200 shadow-sm animate-pulse space-y-3">
                <div className="w-full aspect-video bg-gray-100 rounded-md"></div>
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                <div className="h-3 bg-gray-100 rounded w-full"></div>
                <div className="h-3 bg-gray-100 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          /* Article Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {articles.map((art) => (
              <div
                key={art.id}
                onClick={() => setSelectedArticle(art)}
                className="bg-white rounded-md overflow-hidden border border-gray-200 shadow-sm hover:shadow-md hover:border-primary transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Article Thumbnail Image */}
                  <div className="relative aspect-video overflow-hidden bg-gray-100">
                    <span className="absolute top-3 left-3 bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-sm z-10">
                      {art.category}
                    </span>

                    <img
                      src={art.image}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>

                  {/* Article Info */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-3 text-[12px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {art.date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {art.readTime}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-gray-900 text-[14px] sm:text-[15px] line-clamp-2 group-hover:text-primary transition-colors">
                      {art.title}
                    </h3>

                    <p className="text-[13px] text-gray-500 line-clamp-2 leading-relaxed">
                      {art.excerpt}
                    </p>
                  </div>
                </div>

                {/* Read More Footer */}
                <div className="px-4 pb-4 pt-2 border-t border-gray-100 flex items-center justify-between text-[12px] font-bold text-primary">
                  <span>Đọc tiếp</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Full Article Modal Reader */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/70 backdrop-blur-md overflow-y-auto">
          <div 
            className="bg-white w-full max-w-3xl rounded-md overflow-hidden shadow-xl relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedArticle(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white text-gray-700 flex items-center justify-center shadow-md hover:bg-gray-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Article Image Banner */}
            <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-gray-900">
              <img
                src={selectedArticle.image}
                alt={selectedArticle.title}
                className="w-full h-full object-cover opacity-80"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=800&auto=format&fit=crop&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent flex items-end p-6 sm:p-8">
                <div className="text-white space-y-2">
                  <span className="bg-primary text-white text-[12px] font-bold px-3 py-1 rounded-sm uppercase">
                    {selectedArticle.category}
                  </span>
                  <h2 className="text-[20px] sm:text-[24px] font-heading font-bold leading-tight mt-2">
                    {selectedArticle.title}
                  </h2>
                  <div className="flex items-center gap-4 text-[12px] text-gray-300 mt-2">
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {selectedArticle.author}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {selectedArticle.date}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {selectedArticle.readTime}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Article Content Body */}
            <div className="p-6 sm:p-8 space-y-6 bg-white text-gray-800 leading-relaxed text-[14px]">
              <p className="font-bold text-primary-dark text-[15px] border-l-4 border-primary pl-4 py-2 bg-green-50 rounded-r-md">
                {selectedArticle.excerpt}
              </p>

              <div className="space-y-4 text-gray-700">
                <p>
                  Nước Hydrogen ion kiềm đóng vai trò cực kỳ quan trọng đối với sức khỏe hiện đại. Nhờ vào quá trình điện phân phân tách phân tử nước và tái tạo khoáng chất, dòng nước sinh ra chứa nồng độ Hydrogen dồi dào, có khả năng đi qua màng tế bào một cách dễ dàng.
                </p>
                <p>
                  Các nghiên cứu y khoa tại Nhật Bản và Hàn Quốc chỉ ra rằng việc sử dụng nước Hydrogen đều đặn mỗi ngày hỗ trợ đẩy lùi hiện tượng oxy hóa tế bào, hỗ trợ hệ tiêu hóa hoạt động trơn tru và làm giảm cảm giác mệt mỏi sau ngày làm việc căng thẳng.
                </p>
                <h4 className="font-heading font-bold text-gray-900 text-[16px] pt-2">
                  Lời khuyên từ chuyên gia WASY PRO:
                </h4>
                <ul className="list-disc pl-5 space-y-2 text-gray-600 text-[14px]">
                  <li>Uống 1 cốc nước kiềm pH 8.5 ngay sau khi thức dậy để thanh lọc ruột.</li>
                  <li>Dùng nước Hydrogen tươi trực tiếp tại vòi máy lọc để đảm bảo nồng độ khí Hydro không bị bay hơi.</li>
                  <li>Kiểm tra và bảo dưỡng lõi lọc định kỳ từ 6-12 tháng.</li>
                </ul>
              </div>

              {/* Share & Modal Footer */}
              <div className="pt-6 border-t border-gray-100 flex items-center justify-end">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="px-5 py-2.5 rounded-md font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors text-[13px]"
                >
                  Đóng bài viết
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </section>
  );
};
