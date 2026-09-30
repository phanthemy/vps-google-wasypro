import React, { useState, useEffect } from 'react';
import {
  Newspaper,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  X,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  FileText,
  Filter,
  Play,
  Video,
  ExternalLink,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import { api } from '../../services/api';
import { Article, ArticleInput } from '../../types/schema';

// Helper to extract YouTube video ID
const getYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
};

export const AdminNews: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<ArticleInput>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'Tin Tức & Sự Kiện',
    author: 'WASY PRO',
    date: new Date().toISOString().split('T')[0],
    image: '',
    videoUrl: '',
    readTime: '3 phút',
  });

  const categoriesList = [
    'Tin Tức & Sự Kiện',
    'Video & Sự Kiện',
    'Kiến thức Sức Khỏe',
    'Kiến thức Sản Phẩm',
    'Hướng dẫn',
    'Bảo dưỡng',
  ];

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getArticles();
      setArticles(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Không thể tải danh sách bài viết');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const openCreateModal = () => {
    setEditingArticle(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: 'Tin Tức & Sự Kiện',
      author: 'WASY PRO',
      date: new Date().toISOString().split('T')[0],
      image: '',
      videoUrl: '',
      readTime: '3 phút',
    });
    setModalError(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      category: article.category,
      author: article.author,
      date: article.date,
      image: article.image || '',
      videoUrl: article.videoUrl || '',
      readTime: article.readTime || '3 phút',
    });
    setModalError(null);
    setIsFormModalOpen(true);
  };

  const handleVideoUrlChange = (url: string) => {
    const ytId = getYouTubeId(url);
    // If user enters YouTube URL and image is empty or default, suggest YouTube thumbnail
    if (ytId && (!formData.image || formData.image.includes('img.youtube.com'))) {
      setFormData({
        ...formData,
        videoUrl: url,
        image: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      });
    } else {
      setFormData({ ...formData, videoUrl: url });
    }
  };

  const handleApplyYouTubeThumbnail = () => {
    const ytId = getYouTubeId(formData.videoUrl || '');
    if (ytId) {
      setFormData({
        ...formData,
        image: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setModalError('Vui lòng nhập tiêu đề bài viết');
      return;
    }
    if (!formData.excerpt.trim()) {
      setModalError('Vui lòng nhập tóm tắt bài viết');
      return;
    }
    if (!formData.image.trim()) {
      setModalError('Vui lòng nhập link ảnh đại diện / thumbnail');
      return;
    }

    setSubmitting(true);
    setModalError(null);
    try {
      const generatedSlug =
        formData.slug.trim() ||
        formData.title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[đĐ]/g, 'd')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

      const payload: ArticleInput = {
        ...formData,
        slug: generatedSlug,
        videoUrl: formData.videoUrl?.trim() || undefined,
      };

      if (editingArticle) {
        await api.updateArticle(editingArticle.id, payload);
      } else {
        await api.createArticle(payload);
      }
      setIsFormModalOpen(false);
      await fetchArticles();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Lỗi lưu bài viết');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteArticle = async () => {
    if (!deletingArticle) return;
    setSubmitting(true);
    try {
      await api.deleteArticle(deletingArticle.id);
      setDeletingArticle(null);
      await fetchArticles();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Xóa thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered List
  const filteredArticles = articles.filter((a) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      a.title.toLowerCase().includes(q) ||
      a.excerpt.toLowerCase().includes(q) ||
      (a.category && a.category.toLowerCase().includes(q));
    const matchesCat = selectedCategory ? a.category === selectedCategory : true;
    return matchesSearch && matchesCat;
  });

  const currentYtId = getYouTubeId(formData.videoUrl || '');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-ocean-600" />
            Quản Lý Bài Viết & Sự Kiện ({filteredArticles.length})
          </h2>
          <p className="text-xs text-slate-500">
            Quản lý tin tức, video sự kiện truyền hình và chia sẻ kiến thức nước Hydrogen trên trang chủ
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-ocean-600 to-cyan-600 hover:from-ocean-700 hover:to-cyan-700 text-white font-bold text-sm shadow-md shadow-ocean-500/20 hover:shadow-ocean-500/30 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Thêm Bài Viết / Video Mới
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề bài viết, video, tóm tắt..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-ocean-500 transition-all shadow-xs"
          />
        </div>

        <div className="w-full md:w-64 relative">
          <Filter className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-11 pr-8 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-ocean-500 transition-all shadow-xs"
          >
            <option value="">Tất cả chuyên mục</option>
            {categoriesList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table / Content */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center min-h-[350px] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-9 h-9 text-ocean-600 animate-spin" />
          <p className="text-slate-500 font-medium text-sm">Đang tải danh sách bài viết & sự kiện...</p>
        </div>
      ) : error ? (
        <div className="bg-white p-8 rounded-3xl border border-rose-200 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <p className="text-slate-700 font-bold text-sm">{error}</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        /* Empty State */
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center py-16 space-y-3">
          <Newspaper className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">Chưa Có Bài Viết Nào</h3>
          <p className="text-xs text-slate-500">Bấm nút Thêm Bài Viết / Video Mới để tạo nội dung chuẩn SEO.</p>
        </div>
      ) : (
        /* Data Table */
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider">
                  <th className="py-4 px-5">Bài Viết / Video</th>
                  <th className="py-4 px-5">Chuyên Mục</th>
                  <th className="py-4 px-5">Tác Giả & Ngày Đăng</th>
                  <th className="py-4 px-5">Thời Lượng</th>
                  <th className="py-4 px-5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredArticles.map((a) => {
                  const hasVideo = !!a.videoUrl;
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Image & Title */}
                      <td className="py-4 px-5 max-w-md">
                        <div className="flex items-start gap-3">
                          <div className="relative w-16 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {a.image ? (
                              <img
                                src={a.image}
                                alt={a.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <FileText className="w-6 h-6 text-slate-400" />
                            )}
                            {hasVideo && (
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xs">
                                  <Play className="w-3 h-3 fill-current ml-0.5" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 line-clamp-1 flex items-center gap-1.5">
                              {a.title}
                              {hasVideo && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 text-[10px] font-bold border border-red-200">
                                  <Video className="w-3 h-3" />
                                  Video
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 line-clamp-2 mt-0.5">{a.excerpt}</div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-5">
                        <span className="px-3 py-1 rounded-full bg-ocean-50 text-ocean-700 text-xs font-bold inline-block whitespace-nowrap">
                          {a.category}
                        </span>
                      </td>

                      {/* Author & Date */}
                      <td className="py-4 px-5 text-xs text-slate-600 space-y-0.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {a.author}
                        </div>
                        <div className="text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {a.date}
                        </div>
                      </td>

                      {/* Read Time / Duration */}
                      <td className="py-4 px-5 text-xs font-semibold text-slate-600 whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {a.readTime || '3 phút'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasVideo && (
                            <a
                              href={a.videoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Xem video YouTube"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => openEditModal(a)}
                            className="p-2 rounded-xl text-slate-500 hover:text-ocean-600 hover:bg-ocean-50 transition-colors"
                            title="Sửa bài viết"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingArticle(a)}
                            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Xóa bài viết"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Article */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 my-8 overflow-hidden">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Newspaper className="w-6 h-6 text-cyan-400" />
                <div>
                  <h3 className="text-lg font-bold">
                    {editingArticle ? 'Chỉnh Sửa Bài Viết / Video' : 'Thêm Bài Viết / Video Mới'}
                  </h3>
                  <p className="text-xs text-slate-300">Quản lý nội dung tin tức, video sự kiện hiển thị trên website</p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {modalError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  {modalError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tiêu Đề Bài Viết / Video *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ví dụ: HTV9 Phóng sự Máy Lọc Nước Hydrogen Ion Kiềm WASY PRO..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              {/* YouTube Video URL */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-red-600" />
                    Đường dẫn Video YouTube (Tùy chọn)
                  </label>
                  {currentYtId && (
                    <button
                      type="button"
                      onClick={handleApplyYouTubeThumbnail}
                      className="text-[11px] font-bold text-ocean-600 hover:text-ocean-700 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Lấy thumbnail từ YouTube
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  value={formData.videoUrl || ''}
                  onChange={(e) => handleVideoUrlChange(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... hoặc https://youtu.be/..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Khi nhập link YouTube, bài viết sẽ có nút phát video trực tiếp dạng popup trên trang chủ.
                </p>
              </div>

              {/* Thumbnail Image URL & Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-slate-500" />
                  Ảnh Bìa / Thumbnail *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://img.youtube.com/vi/.../hqdefault.jpg hoặc URL ảnh bìa"
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500"
                  />
                </div>
                {formData.image && (
                  <div className="mt-2 relative w-40 h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img
                      src={formData.image}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    {formData.videoUrl && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Category & Read Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Chuyên Mục</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ocean-500"
                  >
                    {categoriesList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tác Giả</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="WASY PRO"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Thời Lượng / Đọc
                  </label>
                  <input
                    type="text"
                    value={formData.readTime}
                    onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                    placeholder="03:45 hoặc 5 phút"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Đoạn Tóm Tắt (Excerpt) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Tóm tắt ngắn gọn hiển thị trên card..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nội Dung Bài Viết / Mô Tả Video (Tùy chọn)
                </label>
                <textarea
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Nội dung bài viết chi tiết hoặc mô tả sự kiện..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500 font-mono text-xs"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-xs flex items-center gap-2 shadow-md disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {editingArticle ? 'Cập Nhật Bài Viết' : 'Xuất Bản Bài Viết'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Xác Nhận Xóa Bài Viết?</h3>
            <p className="text-xs text-slate-500">
              Bạn có chắc chắn muốn xóa bài viết <strong>"{deletingArticle.title}"</strong> không?
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingArticle(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleDeleteArticle}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-md disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Xóa Bài Viết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
