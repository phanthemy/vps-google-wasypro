import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, Droplet, Coffee, Wrench, Tag, Package, AlertTriangle, Layers, FolderTree } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  _count?: {
    products: number;
  };
}

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', icon: 'tag' });
  const [submitting, setSubmitting] = useState(false);

  const iconOptions = ['droplet', 'coffee', 'tool', 'tag', 'box', 'layers', 'folder-tree'];

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(csrfMeta ? { 'X-CSRF-Token': csrfMeta.getAttribute('content') || '' } : {}),
    };
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/product-categories', {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenForm = (cat?: Category) => {
    if (cat) {
      setEditingCat(cat);
      setFormData({
        name: cat.name,
        slug: cat.slug,
        description: cat.description || '',
        icon: cat.icon || 'tag'
      });
    } else {
      setEditingCat(null);
      setFormData({ name: '', slug: '', description: '', icon: 'tag' });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingCat ? `/api/product-categories/${editingCat.id}` : '/api/product-categories';
      const method = editingCat ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Failed to save category');
      
      await fetchCategories();
      setIsFormOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (cat: Category) => {
    setDeletingCat(cat);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingCat) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/product-categories/${deletingCat.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!res.ok) throw new Error('Failed to delete category');
      
      await fetchCategories();
      setIsDeleteOpen(false);
      setDeletingCat(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'droplet': return <Droplet size={18} />;
      case 'coffee': return <Coffee size={18} />;
      case 'tool': return <Wrench size={18} />;
      case 'box': return <Package size={18} />;
      case 'layers': return <Layers size={18} />;
      case 'folder-tree': return <FolderTree size={18} />;
      case 'tag':
      default: return <Tag size={18} />;
    }
  };

  if (loading) return <div className="p-6 text-slate-300">Loading categories...</div>;
  if (error) return <div className="p-6 text-red-400">Error: {error}</div>;

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-cyan-400">Quản Lý Danh Mục</h2>
        <button 
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-md transition-colors"
        >
          <Plus size={18} /> Thêm Mới
        </button>
      </div>

      <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 shadow-xl">
        <table className="w-full text-left">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="p-4 font-semibold text-slate-300">Tên danh mục</th>
              <th className="p-4 font-semibold text-slate-300">Slug</th>
              <th className="p-4 font-semibold text-slate-300">Icon</th>
              <th className="p-4 font-semibold text-slate-300">Số sản phẩm</th>
              <th className="p-4 font-semibold text-slate-300 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {categories.map(cat => (
              <tr key={cat.id} className="hover:bg-slate-750 transition-colors">
                <td className="p-4 font-medium">{cat.name}</td>
                <td className="p-4 text-slate-400">{cat.slug}</td>
                <td className="p-4 text-cyan-400">
                  <div className="flex items-center gap-2">
                    {renderIcon(cat.icon || '')}
                    <span className="text-sm text-slate-400">{cat.icon}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="bg-slate-700 px-2 py-1 rounded-full text-xs font-bold text-cyan-300">
                    {cat._count?.products || 0}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleOpenForm(cat)}
                      className="p-2 bg-slate-700 hover:bg-slate-600 text-cyan-400 rounded transition-colors"
                      title="Sửa"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => confirmDelete(cat)}
                      className="p-2 bg-slate-700 hover:bg-red-900/50 text-red-400 rounded transition-colors"
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  Chưa có danh mục nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800/80">
              <h3 className="text-lg font-bold text-cyan-400">
                {editingCat ? 'Sửa Danh Mục' : 'Thêm Danh Mục Mới'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tên danh mục *</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Slug</label>
                <input 
                  type="text" 
                  value={formData.slug}
                  onChange={e => setFormData({...formData, slug: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  placeholder="De trong de tu tao tu ten"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Icon</label>
                <select 
                  value={formData.icon}
                  onChange={e => setFormData({...formData, icon: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {iconOptions.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Mô tả</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  rows={3}
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Check size={18} /> {submitting ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {isDeleteOpen && deletingCat && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700 overflow-hidden p-6">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-xl font-bold">Xác nhận xóa</h3>
            </div>
            <p className="text-slate-300 mb-4">
              Bạn có chắc chắn muốn xóa danh mục <strong>{deletingCat.name}</strong>?
            </p>
            {deletingCat._count && deletingCat._count.products > 0 && (
              <div className="bg-yellow-900/30 border border-yellow-700/50 p-3 rounded mb-4 text-yellow-200 text-sm">
                <strong>Chú ý:</strong> Có {deletingCat._count.products} sản phẩm đang thuộc danh mục này. 
                Khi xóa, các sản phẩm này sẽ được chuyển sang một danh mục khác hoặc không có danh mục.
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleDelete}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-white font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? 'Đang xóa...' : 'Xóa ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
