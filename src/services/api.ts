import { Product, Category, WarrantyRecord, Article, FAQ, AdminUser, Lead, ProductInput, WarrantyInput, ArticleInput, Order } from '../types/schema';
import { mockProducts, mockCategories, mockWarranties, mockArticles, mockFAQs, mockLeads, mockAdminUser, mockOrders } from '../data/mockData';

function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^|;\\s*)csrf_token=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : '';
}

function getAuthHeaders(headers: Record<string, string> = {}): Record<string, string> {
  const csrfToken = getCsrfToken();
  const authHeaders: Record<string, string> = { ...headers };
  if (csrfToken) {
    authHeaders['X-CSRF-Token'] = csrfToken;
  }
  return authHeaders;
}

export const api = {
  getProducts: async (params?: { categoryId?: string; search?: string; sort?: string; limit?: number; isHot?: boolean }): Promise<Product[]> => {
    try {
      const q = new URLSearchParams();
      if (params?.categoryId) q.set('categoryId', params.categoryId);
      if (params?.search) q.set('search', params.search);
      if (params?.sort) q.set('sort', params.sort);
      if (params?.limit) q.set('limit', String(params.limit));
      if (params?.isHot) q.set('isHot', 'true');
      const res = await fetch('/api/products?' + q.toString());
      if (res.ok) { const data = await res.json(); if (data.length) return data; }
    } catch(e) { console.warn('API fallback', e); }
    let result = [...mockProducts];
    
    if (params?.categoryId) {
      result = result.filter(p => p.categoryId === params.categoryId);
    }
    
    if (params?.search) {
      const s = params.search.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(s) || p.description.toLowerCase().includes(s));
    }
    
    if (params?.isHot !== undefined) {
      result = result.filter(p => p.isHot === params.isHot);
    }
    
    if (params?.sort) {
      if (params.sort === 'price_asc') result.sort((a, b) => a.price - b.price);
      else if (params.sort === 'price_desc') result.sort((a, b) => b.price - a.price);
    }
    
    if (params?.limit) {
      result = result.slice(0, params.limit);
    }
    
    return result;
  },

  getProductBySlug: async (slug: string): Promise<Product> => {
    const product = mockProducts.find(p => p.slug === slug);
    if (!product) throw new Error('Product not found');
    return product;
  },

  getCategories: async (): Promise<Category[]> => {
    try { const res = await fetch('/api/product-categories', { credentials: 'include' }); if (res.ok) return await res.json(); } catch(e) {}
    return mockCategories;
  },

  lookupWarranty: async (query: string): Promise<WarrantyRecord> => {
    const record = mockWarranties.find(w => w.phone === query || w.code === query || w.serialNumber === query);
    if (!record) throw new Error('Warranty record not found');
    return record;
  },

  getArticles: async (params?: { category?: string; search?: string }): Promise<Article[]> => {
    let result = [...mockArticles];
    if (params?.category) {
      result = result.filter(a => a.category === params.category);
    }
    if (params?.search) {
      const s = params.search.toLowerCase();
      result = result.filter(a => a.title.toLowerCase().includes(s) || a.excerpt.toLowerCase().includes(s));
    }
    return result;
  },

  getArticleBySlug: async (slug: string): Promise<Article> => {
    const article = mockArticles.find(a => a.slug === slug);
    if (!article) throw new Error('Article not found');
    return article;
  },

  getFAQs: async (): Promise<FAQ[]> => {
    return mockFAQs;
  },

  submitContact: async (formData: { name: string; phone: string; email?: string; message: string; address?: string }) => {
    if (!formData.name || formData.name.trim() === '') {
      throw new Error('Name is required');
    }
    
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    if (!formData.phone || !phoneRegex.test(formData.phone)) {
      throw new Error('Invalid phone number format');
    }
    
    if (!formData.message || formData.message.trim() === '') {
      throw new Error('Message is required');
    }
    
    // Simulated API delay and success
    return new Promise<{ success: boolean; message: string }>((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'Contact submitted successfully' });
      }, 500);
    });
  },

  // --- ADMIN API ---

  adminLogin: async (phone: string, password: string): Promise<{ success: boolean; user?: AdminUser; message: string }> => {
    try {
      const res = await fetch('/api/auth/login', { credentials: 'include', method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Đăng nhập thất bại');
      return data;
    } catch (e) {
      throw e;
    }
  },

  createProduct: async (productInput: ProductInput): Promise<Product> => {
    const res = await fetch('/api/products', {
      credentials: 'include', method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(productInput)
    });
    if (!res.ok) throw new Error('Tạo sản phẩm thất bại');
    return await res.json();
  },

  updateProduct: async (id: string, productInput: Partial<ProductInput>): Promise<Product> => {
    const res = await fetch('/api/products/' + id, {
      credentials: 'include', method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(productInput)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Cập nhật sản phẩm thất bại');
    }
    return await res.json();
  },

  deleteProduct: async (id: string): Promise<boolean> => {
    const res = await fetch('/api/products/' + id, {
      credentials: 'include', method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Xóa sản phẩm thất bại');
    return true;
  },

  getLeads: async (status?: string): Promise<Lead[]> => {
    const token = localStorage.getItem('token') || localStorage.getItem('crm_token');
    const csrfToken = (document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/) || [])[1] || '';
    const res = await fetch('/api/leads', {
      headers: { 'Authorization': 'Bearer ' + token, 'X-CSRF-Token': csrfToken },
      credentials: 'include',
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch leads');
    let result = json.data;
    if (status) {
      result = result.filter((l: Lead) => l.status === status);
    }
    return result;
  },

  updateLeadStatus: async (id: string, status: 'new' | 'contacted' | 'completed' | 'cancelled'): Promise<Lead> => {
    const token = localStorage.getItem('token') || localStorage.getItem('crm_token');
    const csrfToken = (document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/) || [])[1] || '';
    const res = await fetch('/api/leads/' + id + '/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token, 'X-CSRF-Token': csrfToken },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Update failed');
    return json.data;
  },

  createWarranty: async (warrantyInput: WarrantyInput): Promise<WarrantyRecord> => {
    const newWarranty: WarrantyRecord = {
      ...warrantyInput,
      id: `war-${Date.now()}`
    };
    mockWarranties.push(newWarranty);
    return newWarranty;
  },

  addWarrantyMaintenance: async (warrantyId: string, log: { actionTitle: string; technicianName: string; notes?: string }): Promise<WarrantyRecord> => {
    const warranty = mockWarranties.find(w => w.id === warrantyId);
    if (!warranty) throw new Error('Không tìm thấy bản ghi bảo hành');
    
    warranty.history.push({
      date: new Date().toISOString().split('T')[0],
      note: `${log.actionTitle} - Kỹ thuật viên: ${log.technicianName}${log.notes ? ` - Ghi chú: ${log.notes}` : ''}`
    });
    
    return warranty;
  },

  getAdminStats: async (): Promise<{ totalProducts: number; newLeads: number; activeWarranties: number; revenue: number }> => {
    try {
      const [prods, orders, leads, warranties, nppPurchases] = await Promise.all([
        fetch('/api/products', { credentials: 'include' }),
        fetch('/api/orders', { credentials: 'include' }),
        fetch('/api/leads', { credentials: 'include' }),
        fetch('/api/warranties', { credentials: 'include' }),
        fetch('/api/admin/npp/purchases', { credentials: 'include' }),
      ]);
      const pData = prods.ok ? await prods.json() : { data: [] };
      const oData = orders.ok ? await orders.json() : { data: [] };
      const lData = leads.ok ? await leads.json() : { data: [] };
      const wData = warranties.ok ? await warranties.json() : { data: [] };
      const nData = nppPurchases.ok ? await nppPurchases.json() : { data: [] };

      const productList: any[] = Array.isArray(pData) ? pData : (pData.data || []);
      const orderList: any[] = Array.isArray(oData) ? oData : (oData.data || []);
      const leadList: any[] = Array.isArray(lData) ? lData : (lData.data || []);
      const warrantyList: any[] = Array.isArray(wData) ? wData : (wData.data || []);
      const nppList: any[] = Array.isArray(nData) ? nData : (nData.data || []);

      const orderRevenue = orderList
        .filter((o: any) => o.status === 'COMPLETED')
        .reduce((s: number, o: any) => s + (o.totalAmount || 0), 0);
        
      const nppRevenue = nppList
        .filter((o: any) => o.status === 'COMPLETED')
        .reduce((s: number, o: any) => s + (Number(o.netPayableAmount) || 0), 0);

      const revenue = orderRevenue + nppRevenue;
      const newLeads = leadList.filter((l: any) => l.status === 'new').length;
      const activeWarranties = warrantyList.filter((w: any) => w.status === 'active').length;

      return { totalProducts: productList.length, newLeads, activeWarranties, revenue };
    } catch(e) {
      return { totalProducts: 0, newLeads: 0, activeWarranties: 0, revenue: 0 };
    }
  },

  createArticle: async (articleInput: ArticleInput): Promise<Article> => {
    const newArticle: Article = {
      ...articleInput,
      id: `art-${Date.now()}`
    };
    mockArticles.unshift(newArticle);
    return newArticle;
  },

  updateArticle: async (id: string, articleInput: Partial<ArticleInput>): Promise<Article> => {
    const index = mockArticles.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Không tìm thấy bài viết');
    mockArticles[index] = { ...mockArticles[index], ...articleInput };
    return mockArticles[index];
  },

  deleteArticle: async (id: string): Promise<boolean> => {
    const index = mockArticles.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Không tìm thấy bài viết');
    mockArticles.splice(index, 1);
    return true;
  },

  getOrders: async (params?: { status?: string; search?: string; ctvUserId?: string; ordererUserId?: string }): Promise<any[]> => {
    try {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.search) q.set('search', params.search);
      if (params?.ctvUserId) q.set('ctvUserId', params.ctvUserId);
      if (params?.ordererUserId) q.set('ordererUserId', params.ordererUserId);
      const res = await fetch('/api/orders?' + q.toString());
      if (res.ok) {
        const body = await res.json();
        // Server returns { success: true, data: [...] }
        const data = Array.isArray(body) ? body : (body?.data ?? []);
        if (data.length > 0 || body?.success) return data;
      }
    } catch(e) { console.warn('Orders API fallback', e); }
    return [];
  },

  updateOrderStatus: async (id: string, status: Order['status']): Promise<Order> => {
    const res = await fetch('/api/orders/' + id + '/status', { credentials: 'include', method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (res.ok) return await res.json();
    const order = mockOrders.find((o: Order) => o.id === id);
    if (!order) throw new Error('Không tìm thấy đơn hàng');
    order.status = status;
    return { ...order };
  },

  // Admin user management
  getAdminUsers: async () => {
    const res = await fetch('/api/internal-users', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to get users');
    const data = await res.json();
    const list = data.data || data;
    // Map DB fields (fullName, userId, phone, role) to what AdminUsers expects
    return list.map((u: any) => ({
      id: u.userId,
      email: u.phone,      // dùng phone làm identifier (ko có email trong schema)
      name: u.fullName,
      role: u.role,
      isActive: u.status !== 'INACTIVE',
      createdAt: u.createdAt,
    }));
  },

  createAdminUser: async (data: { email: string; password: string; name: string; role?: string }) => {
    const csrf = (document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/) || [])[1] || '';
    const res = await fetch('/api/internal-users', { credentials: 'include', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
      body: JSON.stringify({ fullName: data.name, phone: data.email, password: data.password, role: data.role || 'admin' }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || e.error || 'Failed'); }
    return await res.json();
  },

  updateAdminUser: async (id: string, data: any) => {
    const csrf = (document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/) || [])[1] || '';
    const payload: any = {};
    if (data.role) payload.role = data.role;
    if (data.isActive === false) payload.status = 'INACTIVE';
    if (data.isActive === true) payload.status = 'ACTIVE';
    const res = await fetch('/api/internal-users/' + id, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
      body: JSON.stringify(payload),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || e.error || 'Failed'); }
    return await res.json();
  },

  deleteAdminUser: async (id: string) => {
    // Backend chưa có DELETE endpoint — báo lỗi rõ ràng
    throw new Error('Chức năng xóa tài khoản admin chưa được hỗ trợ. Liên hệ kỹ thuật.');
  },

  changePassword: async (userId: string, currentPassword: string, newPassword: string) => {
    const csrf = (document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/) || [])[1] || '';
    const res = await fetch('/api/internal-users/' + userId, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
      body: JSON.stringify({ password: newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'Failed');
    return data;
  },
};
