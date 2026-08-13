export interface ProductSpecs {
  pH: string;
  orp: string;
  hydrogenPpb: string;
  filterCount: number;
  origin: string;
  warrantyYears: number;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  gallery: string[];
  description: string;
  specs: ProductSpecs;
  isHot: boolean;
  isNew: boolean;
  stock: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  icon: string;
}

export interface WarrantyHistory {
  date: string;
  note: string;
  status?: string;
}

export interface WarrantyRecord {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  productName: string;
  serialNumber: string;
  installDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'pending';
  history: WarrantyHistory[];
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  date: string;
  image: string;
  readTime: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff';
  avatar?: string;
}

export interface Lead {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  message?: string;
  address?: string;
  productName?: string;
  status: 'new' | 'contacted' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: 'new' | 'confirmed' | 'shipping' | 'completed' | 'cancelled';
  note?: string;
  createdAt: string;
}

export type ProductInput = Omit<Product, 'id'>;

export type WarrantyInput = Omit<WarrantyRecord, 'id'>;

export type ArticleInput = Omit<Article, 'id'>;
