import React, { useState, useEffect } from 'react';
import ImageUpload from './ImageUpload';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  X,
  Filter,
  CheckCircle2,
  SlidersHorizontal,
  Flame,
  Sparkles,
  Droplet
} from 'lucide-react';
import { api } from '../../services/api';
import { Product, Category, ProductInput } from '../../types/schema';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<ProductInput>({
    title: '',
    slug: '',
    categoryId: 'cat-01',
    price: 0,
    promotion: '',
    originalPrice: 0,
    rating: 5,
    reviewsCount: 0,
    image: '/images/products/wasy-max.jpg',
    gallery: [],
    description: '',
    specs: {
      pH: '8.5 - 9.5',
      orp: '-400mV',
      hydrogenPpb: '1200 ppb',
      filterCount: 9,
      origin: 'Nhật Bản',
      warrantyYears: 5,
    },
    isHot: false,
    isNew: true,
    stock: 50,
    commissionPoints: 0,
  });


  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodData, catData] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
      ]);
      setProducts(prodData);
      setCategories(catData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Không thể tải danh sách sản phẩm');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      title: '',
      slug: '',
      categoryId: categories[0]?.id || 'cat-01',
      price: 15000000,
      originalPrice: 18000000,
      rating: 5,
      reviewsCount: 1,
      image: '/images/products/water-king-pro-9.jpg',
      gallery: [],
      description: 'Máy lọc nước ion kiềm giàu hydrogen công nghệ hiện đại.',
      specs: {
        pH: '3.5 - 10.5',
        orp: '-600mV',
        hydrogenPpb: '1500 ppb',
        filterCount: 9,
        origin: 'Hàn Quốc',
        warrantyYears: 5,
      },
      isHot: true,
      isNew: true,
      stock: 30,
      commissionPoints: 0,
    });
    setModalError(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      slug: product.slug,
      categoryId: product.categoryId,
      price: product.price,
      promotion: product.promotion || '',
      originalPrice: product.originalPrice || product.price,
      rating: product.rating,
      reviewsCount: product.reviewsCount,
      image: product.image,
      gallery: product.gallery,
      description: product.description,
      specs: { ...product.specs },
      isHot: product.isHot,
      isNew: product.isNew,
      stock: product.stock,
      commissionPoints: product.commissionPoints || 0,
    });
    setModalError(null);
    setIsFormModalOpen(true);
  };


  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setModalError('Vui lòng nhập tên sản phẩm');
      return;
    }
    if (formData.price < 0) {
      setModalError('Giá bán không được âm. Nhập 0 = Liên hệ');
      return;
    }

    setSubmitting(true);
    setModalError(null);
    try {
      const generatedSlug = formData.slug.trim() || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const payload: ProductInput = {
        ...formData,
        slug: generatedSlug,
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
      } else {
        await api.createProduct(payload);
      }
      setIsFormModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setModalError(err.message);
      } else {
        setModalError('Lỗi lưu thông tin sản phẩm');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setSubmitting(true);
    try {
      await api.deleteProduct(deletingProduct.id);
      setDeletingProduct(null);
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Xóa thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered List
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory ? p.categoryId === selectedCategory : true;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-ocean-600" />
            Quản Lý Sản Phẩm ({filteredProducts.length})
          </h2>
          <p className="text-xs text-slate-500">Quản lý danh sách máy lọc nước, lõi lọc & thiết bị đo</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-ocean-600 to-cyan-600 hover:from-ocean-700 hover:to-cyan-700 text-white font-bold text-sm shadow-md shadow-ocean-500/20 hover:shadow-ocean-500/30 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Thêm Sản Phẩm Mới
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên sản phẩm, mô tả..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-ocean-500 transition-all shadow-xs"
          />
        </div>

        {/* Category Select */}
        <div className="w-full md:w-64 relative">
          <Filter className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-11 pr-8 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-ocean-500 transition-all shadow-xs"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content / Table Area */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center min-h-[350px] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-9 h-9 text-ocean-600 animate-spin" />
          <p className="text-slate-500 font-medium text-sm">Đang tải danh sách sản phẩm...</p>
        </div>
      ) : error ? (
        <div className="bg-white p-8 rounded-3xl border border-rose-200 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <p className="text-slate-700 font-bold text-sm">{error}</p>
          <button
            onClick={fetchData}
            className="px-5 py-2.5 bg-ocean-600 text-white rounded-xl text-xs font-bold"
          >
            Tải lại
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        /* Empty State */
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center py-16 space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">Không Tìm Thấy Sản Phẩm Phù Hợp</h3>
          <p className="text-xs text-slate-500">Thử thay đổi từ khóa tìm kiếm hoặc lọc danh mục khác.</p>
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider">
                  <th className="py-4 px-5">Sản Phẩm</th>
                  <th className="py-4 px-5">Danh Mục</th>
                  <th className="py-4 px-5">Giá Bán</th>
                  <th className="py-4 px-5">Điểm HH (CP)</th>
                  <th className="py-4 px-5">Thông Số Kiềm / Hydro</th>
                  <th className="py-4 px-5">Tồn Kho</th>
                  <th className="py-4 px-5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredProducts.map((p) => {
                  const categoryName = categories.find((c) => c.id === p.categoryId)?.name || 'Khác';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product Thumbnail & Title */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            <img
                              src={p.image}
                              alt={p.title}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            <Droplet className="w-6 h-6 text-ocean-400" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 line-clamp-1 flex items-center gap-1.5">
                              {p.title}
                              {p.isHot && (
                                <span className="p-1 rounded-md bg-rose-100 text-rose-600" title="Hot Deal">
                                  <Flame className="w-3 h-3" />
                                </span>
                              )}
                              {p.isNew && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-700 font-extrabold">
                                  NEW
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 font-medium">Mã: {p.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-5">
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                          {categoryName}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-5">
                        <div className="font-extrabold text-ocean-600">
                          {p.price > 0 ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price) : <span className="text-primary font-semibold">Liên hệ</span>}
                        </div>
                        {p.originalPrice && p.originalPrice > p.price && (
                          <div className="text-xs text-slate-400 line-through">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.originalPrice)}
                          </div>
                        )}
                      
                          {p.promotion && <div className="text-[11px] text-orange-600 font-bold mt-1">🎁 {p.promotion}</div>}
                        </td>

                      {/* Commission Points */}
                      <td className="py-4 px-5">
                        {p.commissionPoints > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-extrabold text-emerald-600 text-sm">
                              {(p.commissionPoints).toLocaleString('vi-VN')} CP
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                            ⚠ Chưa cấu hình
                          </span>
                        )}
                      </td>

                      {/* Specs (pH, ORP, Hydrogen) */}
                      <td className="py-4 px-5 text-xs font-medium text-slate-600">
                        <div className="space-y-0.5">
                          <div>
                            pH: <strong className="text-slate-900">{p.specs.pH}</strong>
                          </div>
                          <div>
                            ORP: <strong className="text-cyan-700">{p.specs.orp}</strong>
                          </div>
                          <div>
                            Hydrogen: <strong className="text-ocean-700">{p.specs.hydrogenPpb}</strong>
                          </div>
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                          p.stock > 10 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {p.stock} sản phẩm
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-2 rounded-xl text-slate-500 hover:text-ocean-600 hover:bg-ocean-50 transition-colors"
                            title="Sửa sản phẩm"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingProduct(p)}
                            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Xóa sản phẩm"
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

      {/* Modal Add / Edit Product */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 my-8 overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-ocean-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-ocean-500/20 border border-ocean-400/30 flex items-center justify-center text-cyan-400">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    {editingProduct ? 'Chỉnh Sửa Thông Số Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
                  </h3>
                  <p className="text-xs text-slate-300">Nhập đầy đủ thông tin máy ion kiềm, ORP, Hydro & lõi lọc</p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {modalError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  {modalError}
                </div>
              )}

              {/* Basic Info Group */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ocean-600 border-b border-slate-100 pb-2">
                  Thông Tin Cơ Bản
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Tên Sản Phẩm *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Máy lọc nước WASY PRO..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Danh Mục
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ocean-500"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Giá Bán (VND) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Giá Niêm Yết (Gốc)
                    </label>
                    <input
                      type="number"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Số Lượng Tồn Kho
                    </label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500"
                    />
                  </div>
                </div>

                {/* Commission Points — độc lập với giá */}
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-emerald-700 font-extrabold text-xs uppercase tracking-wider">💰 Điểm Hoa Hồng (Commission Points)</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">ĐỘC LẬP VỚI GIÁ BÁN</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Điểm Hoa Hồng (CP) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.commissionPoints ?? 0}
                          onChange={(e) => setFormData({ ...formData, commissionPoints: Math.max(0, Math.round(Number(e.target.value))) })}
                          placeholder="VD: 1800"
                          className="w-full px-4 py-2.5 bg-white border-2 border-emerald-300 rounded-xl text-sm font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">CP</span>
                      </div>
                      {(formData.commissionPoints ?? 0) === 0 && (
                        <p className="mt-1.5 text-xs text-amber-600 font-bold flex items-center gap-1">
                          ⚠ Chưa cấu hình — CTV sẽ không nhận hoa hồng từ sản phẩm này
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 space-y-1 pt-1">
                      <p className="font-semibold text-slate-700">Ví dụ tính hoa hồng:</p>
                      {formData.commissionPoints > 0 ? (
                        <>
                          <p>Director SELF: <strong className="text-emerald-700">{Math.round(formData.commissionPoints * 0.3).toLocaleString('vi-VN')} CP</strong> (30%)</p>
                          <p>Manager SELF: <strong className="text-emerald-700">{Math.round(formData.commissionPoints * 0.25).toLocaleString('vi-VN')} CP</strong> (25%)</p>
                          <p>F1 Upstream: <strong className="text-sky-700">{Math.round(formData.commissionPoints * 0.1).toLocaleString('vi-VN')} CP</strong> (10%)</p>
                          <p className="text-slate-500">1 CP = 1.000 ₫</p>
                        </>
                      ) : (
                        <p className="text-amber-600">Nhập số CP để xem preview tính hoa hồng</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Promotion */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    🎁 Khuyến Mãi / Quà Tặng
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Tặng bộ lọc thô trị giá 500.000đ"
                    value={formData.promotion || ''}
                    onChange={(e) => setFormData({ ...formData, promotion: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500"
                  />
                </div>
              </div>

                {/* Image Upload */}
                <div className="col-span-2 pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ocean-600 border-b border-slate-100 pb-2 mb-4">
                    Hình Ảnh Sản Phẩm
                  </h4>
                  <ImageUpload
                    images={(formData.gallery || []).map((g: any) => typeof g === 'string' ? { url: g } : g)}
                    mainImage={formData.image || ''}
                    onImagesChange={(imgs) => setFormData({ ...formData, gallery: imgs as any })}
                    onMainImageChange={(url) => setFormData({ ...formData, image: url })}
                  />
                </div>


              {/* Specs Group */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ocean-600 border-b border-slate-100 pb-2">
                  Thông Số Kỹ Thuật (pH / ORP / Hydrogen / Lõi Lọc)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Độ pH
                    </label>
                    <input
                      type="text"
                      value={formData.specs.pH}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specs: { ...formData.specs, pH: e.target.value },
                        })
                      }
                      placeholder="vd: 3.5 - 10.5"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Chỉ Số ORP (mV)
                    </label>
                    <input
                      type="text"
                      value={formData.specs.orp}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specs: { ...formData.specs, orp: e.target.value },
                        })
                      }
                      placeholder="vd: -600mV đến -800mV"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Nồng Độ Hydrogen (ppb)
                    </label>
                    <input
                      type="text"
                      value={formData.specs.hydrogenPpb}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specs: { ...formData.specs, hydrogenPpb: e.target.value },
                        })
                      }
                      placeholder="vd: 1500 ppb"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Số Cấp Lọc
                    </label>
                    <input
                      type="number"
                      value={formData.specs.filterCount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specs: { ...formData.specs, filterCount: Number(e.target.value) },
                        })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Xuất Xứ
                    </label>
                    <input
                      type="text"
                      value={formData.specs.origin}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specs: { ...formData.specs, origin: e.target.value },
                        })
                      }
                      placeholder="Nhật Bản / Hàn Quốc"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Bảo Hành (Năm)
                    </label>
                    <input
                      type="number"
                      value={formData.specs.warrantyYears}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specs: { ...formData.specs, warrantyYears: Number(e.target.value) },
                        })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500"
                    />
                  </div>
                </div>
              </div>

              {/* Highlights & Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.isHot}
                    onChange={(e) => setFormData({ ...formData, isHot: e.target.checked })}
                    className="w-4 h-4 rounded text-ocean-600 focus:ring-ocean-500"
                  />
                  Sản Phẩm Bán Chạy (HOT)
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.isNew}
                    onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                    className="w-4 h-4 rounded text-ocean-600 focus:ring-ocean-500"
                  />
                  Sản Phẩm Mới (NEW)
                </label>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mô Tả Sản Phẩm
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả chi tiết đặc điểm nổi bật..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              {/* Action Buttons */}
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
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Lưu Sản Phẩm
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Xác Nhận Xóa Sản Phẩm?</h3>
            <p className="text-xs text-slate-500">
              Bạn có chắc chắn muốn xóa sản phẩm <strong>"{deletingProduct.title}"</strong> không? Thao tác này không thể hoàn tác.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingProduct(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-md disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Xóa Vĩnh Viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};