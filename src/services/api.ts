import { Product, Category, WarrantyRecord, Article, FAQ, AdminUser, Lead, ProductInput, WarrantyInput, ArticleInput } from '../types/schema';
import { mockProducts, mockCategories, mockWarranties, mockArticles, mockFAQs, mockLeads, mockAdminUser } from '../data/mockData';

export const api = {
  getProducts: async (params?: { categoryId?: string; search?: string; sort?: string; limit?: number; isHot?: boolean }): Promise<Product[]> => {
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

  adminLogin: async (email: string, password: string): Promise<{ success: boolean; user?: AdminUser; token?: string; message: string }> => {
    if (email === mockAdminUser.email && password === '123456') {
      return { success: true, user: mockAdminUser, token: 'mock-jwt-token-xyz', message: 'Đăng nhập thành công' };
    }
    throw new Error('Email hoặc mật khẩu không chính xác');
  },

  createProduct: async (productInput: ProductInput): Promise<Product> => {
    const newProduct: Product = {
      ...productInput,
      id: `prod-${Date.now()}`
    };
    mockProducts.push(newProduct);
    return newProduct;
  },

  updateProduct: async (id: string, productInput: Partial<ProductInput>): Promise<Product> => {
    const index = mockProducts.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Không tìm thấy sản phẩm');
    
    mockProducts[index] = { ...mockProducts[index], ...productInput };
    return mockProducts[index];
  },

  deleteProduct: async (id: string): Promise<boolean> => {
    const index = mockProducts.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Không tìm thấy sản phẩm');
    
    mockProducts.splice(index, 1);
    return true;
  },

  getLeads: async (status?: string): Promise<Lead[]> => {
    let result = [...mockLeads];
    if (status) {
      result = result.filter(l => l.status === status);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  updateLeadStatus: async (id: string, status: 'new' | 'contacted' | 'completed' | 'cancelled'): Promise<Lead> => {
    const lead = mockLeads.find(l => l.id === id);
    if (!lead) throw new Error('Không tìm thấy đơn tư vấn');
    
    lead.status = status;
    return lead;
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
    const totalProducts = mockProducts.length;
    const newLeads = mockLeads.filter(l => l.status === 'new').length;
    const activeWarranties = mockWarranties.filter(w => w.status === 'active').length;
    const revenue = 1500000000; 

    return { totalProducts, newLeads, activeWarranties, revenue };
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
  }
};
