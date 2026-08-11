import { Product, Category, WarrantyRecord, Article, FAQ, AdminUser, Lead } from '../types/schema';

export const mockCategories: Category[] = [
  {
    id: 'cat-01',
    name: 'Máy Lọc Nước Ion Kiềm',
    slug: 'may-loc-nuoc-ion-kiem',
    description: 'Dòng máy lọc và tạo nước điện giải ion kiềm cao cấp.',
    image: '/images/categories/cat-1.webp',
    icon: 'droplet'
  },
  {
    id: 'cat-02',
    name: 'Máy Lọc Nước Hydrogen',
    slug: 'may-loc-nuoc-hydrogen',
    description: 'Máy lọc nước bổ sung Hydrogen tự nhiên.',
    image: '/images/categories/cat-2.webp',
    icon: 'activity'
  },
  {
    id: 'cat-03',
    name: 'Bình & Ly Thủy Tinh Hydrogen',
    slug: 'binh-ly-hydrogen',
    description: 'Thiết bị tạo Hydrogen di động.',
    image: '/images/categories/cat-3.webp',
    icon: 'coffee'
  },
  {
    id: 'cat-04',
    name: 'Lõi Lọc & Phụ Kiện',
    slug: 'loi-loc-phu-kien',
    description: 'Lõi lọc thay thế định kỳ và phụ kiện chính hãng.',
    image: '/images/categories/cat-4.webp',
    icon: 'tool'
  },
  {
    id: 'cat-05',
    name: 'Thiết Bị Kiểm Tra',
    slug: 'thiet-bi-kiem-tra',
    description: 'Bút đo độ pH, chỉ số ORP, nồng độ Hydrogen.',
    image: '/images/categories/cat-5.webp',
    icon: 'sliders'
  }
];

export const mockProducts: Product[] = [
  {
    id: 'prod-01',
    title: 'Máy Tạo Nước Hydrogen Water King Pro 9',
    slug: 'may-tao-nuoc-hydrogen-water-king-pro-9',
    categoryId: 'cat-02',
    price: 15900000,
    originalPrice: 18000000,
    rating: 5,
    reviewsCount: 124,
    image: '/images/products/prod-1.webp',
    gallery: [
      '/images/products/prod-1.webp',
      '/images/gallery/May-tao-nuoc-Hydrogen-giau-ion-kiem-sach-Model-WS-03-2.webp',
      '/images/gallery/loi-loc.png'
    ],
    description: 'Máy lọc nước tạo hydrogen cao cấp với 9 cấp lọc.',
    specs: {
      pH: '8.5 - 9.5',
      orp: '-400mV đến -600mV',
      hydrogenPpb: '1200 - 1500 ppb',
      filterCount: 9,
      origin: 'Hàn Quốc',
      warrantyYears: 5
    },
    isHot: true,
    isNew: false,
    stock: 50
  },
  {
    id: 'prod-02',
    title: 'Bình Nước Hydrogen 500ml Cầm Tay',
    slug: 'binh-nuoc-hydrogen-500ml',
    categoryId: 'cat-03',
    price: 2500000,
    originalPrice: 3000000,
    rating: 4.8,
    reviewsCount: 89,
    image: '/images/products/prod-2.webp',
    gallery: [],
    description: 'Bình tạo nước Hydrogen cầm tay tiện lợi mang đi.',
    specs: {
      pH: '7.5 - 8.5',
      orp: '-200mV đến -300mV',
      hydrogenPpb: '800 - 1000 ppb',
      filterCount: 1,
      origin: 'Nhật Bản',
      warrantyYears: 1
    },
    isHot: false,
    isNew: true,
    stock: 120
  },
  {
    id: 'prod-03',
    title: 'Lõi lọc Hydrogen Ion Kiềm',
    slug: 'loi-loc-hydrogen-ion-kiem',
    categoryId: 'cat-04',
    price: 650000,
    rating: 4.9,
    reviewsCount: 230,
    image: '/images/products/prod-3.webp',
    gallery: [],
    description: 'Lõi lọc thay thế định kỳ.',
    specs: {
      pH: '8.5',
      orp: '-200mV',
      hydrogenPpb: 'N/A',
      filterCount: 1,
      origin: 'Việt Nam',
      warrantyYears: 0
    },
    isHot: true,
    isNew: false,
    stock: 500
  },
  {
    id: 'prod-04',
    title: 'Bút đo chỉ số Hydro/pH',
    slug: 'but-do-chi-so-hydro-ph',
    categoryId: 'cat-05',
    price: 1200000,
    rating: 4.7,
    reviewsCount: 45,
    image: '/images/products/prod-4.jpg',
    gallery: [],
    description: 'Công cụ đo chính xác các chỉ số nước.',
    specs: {
      pH: '0-14',
      orp: 'Đo ORP chính xác',
      hydrogenPpb: 'Đo Hydrogen',
      filterCount: 0,
      origin: 'Nhật Bản',
      warrantyYears: 1
    },
    isHot: false,
    isNew: false,
    stock: 80
  },
  {
    id: 'prod-05',
    title: 'Màn chống sóng điện từ EMF Guard',
    slug: 'man-chong-song-dien-tu-emf-guard',
    categoryId: 'cat-04',
    price: 450000,
    rating: 4.6,
    reviewsCount: 12,
    image: '/images/products/prod-5.webp',
    gallery: [],
    description: 'Bảo vệ mạch điện máy lọc.',
    specs: {
      pH: 'N/A',
      orp: 'N/A',
      hydrogenPpb: 'N/A',
      filterCount: 0,
      origin: 'Việt Nam',
      warrantyYears: 1
    },
    isHot: false,
    isNew: true,
    stock: 200
  },
  {
    id: 'prod-06',
    title: 'Máy Lọc Nước Ion Kiềm WASY Max',
    slug: 'may-loc-nuoc-ion-kiem-wasy-max',
    categoryId: 'cat-01',
    price: 28900000,
    originalPrice: 32000000,
    rating: 5,
    reviewsCount: 56,
    image: '/images/products/prod-6.webp',
    gallery: [],
    description: 'Máy lọc nước ion kiềm y tế.',
    specs: {
      pH: '3.0 - 11.0',
      orp: '-800mV',
      hydrogenPpb: '1600 ppb',
      filterCount: 11,
      origin: 'Nhật Bản',
      warrantyYears: 5
    },
    isHot: true,
    isNew: true,
    stock: 30
  },
  {
    id: 'prod-07',
    title: 'Lõi Lọc Thô PP 5 Micron',
    slug: 'loi-loc-tho-pp-5-micron',
    categoryId: 'cat-04',
    price: 150000,
    rating: 4.8,
    reviewsCount: 512,
    image: '/images/products/prod-7.webp',
    gallery: [],
    description: 'Lõi lọc số 1 loại bỏ cặn bẩn.',
    specs: {
      pH: 'N/A',
      orp: 'N/A',
      hydrogenPpb: 'N/A',
      filterCount: 1,
      origin: 'Việt Nam',
      warrantyYears: 0
    },
    isHot: false,
    isNew: false,
    stock: 1000
  },
  {
    id: 'prod-08',
    title: 'Lõi Lọc Carbon CTO',
    slug: 'loi-loc-carbon-cto',
    categoryId: 'cat-04',
    price: 180000,
    rating: 4.9,
    reviewsCount: 305,
    image: '/images/products/prod-8.webp',
    gallery: [],
    description: 'Khử mùi, clo trong nước.',
    specs: {
      pH: 'N/A',
      orp: 'N/A',
      hydrogenPpb: 'N/A',
      filterCount: 1,
      origin: 'Việt Nam',
      warrantyYears: 0
    },
    isHot: false,
    isNew: false,
    stock: 800
  }
];

export const mockWarranties: WarrantyRecord[] = [
  {
    id: 'war-001',
    code: 'WASY240811A',
    customerName: 'Nguyễn Văn A',
    phone: '0900000000',
    productName: 'Máy Tạo Nước Hydrogen Water King Pro 9',
    serialNumber: 'SN987654321',
    installDate: '2023-12-01',
    expiryDate: '2028-12-01',
    status: 'active',
    history: [
      { date: '2023-12-01', note: 'Kích hoạt bảo hành điện tử', status: 'active' },
      { date: '2024-06-05', note: 'Bảo dưỡng định kỳ lần 1' }
    ]
  },
  {
    id: 'war-002',
    code: 'WASY240811B',
    customerName: 'Trần Thị B',
    phone: '0912345678',
    productName: 'Bình Nước Hydrogen 500ml',
    serialNumber: 'SN123456789',
    installDate: '2022-05-15',
    expiryDate: '2023-05-15',
    status: 'expired',
    history: [
      { date: '2022-05-15', note: 'Kích hoạt bảo hành điện tử', status: 'active' }
    ]
  },
  {
    id: 'war-003',
    code: 'WASY240811C',
    customerName: 'Lê Văn C',
    phone: '0988888888',
    productName: 'Máy Lọc Nước Ion Kiềm WASY Max',
    serialNumber: 'SN111222333',
    installDate: '2024-08-10',
    expiryDate: '2029-08-10',
    status: 'pending',
    history: [
      { date: '2024-08-10', note: 'Chờ xác nhận kích hoạt', status: 'pending' }
    ]
  }
];

export const mockArticles: Article[] = [
  {
    id: 'art-01',
    title: 'Tác dụng thần kỳ của nước Hydrogen ion kiềm đối với sức khỏe',
    slug: 'tac-dung-than-ky-nuoc-hydrogen-ion-kiem',
    excerpt: 'Nước Hydrogen ion kiềm được xem là "nước sống" giúp trung hòa axit, chống lão hóa.',
    content: '<p>Nước ion kiềm giàu hydrogen giúp...</p>',
    category: 'Kiến thức Sức Khỏe',
    author: 'WASY PRO',
    date: '2024-08-10',
    image: '/images/articles/art-1.webp',
    readTime: '5 phút'
  },
  {
    id: 'art-02',
    title: 'Phân biệt nước tinh khiết và nước ion kiềm',
    slug: 'phan-biet-nuoc-tinh-khiet-va-nuoc-ion-kiem',
    excerpt: 'Làm thế nào để chọn đúng loại nước cho gia đình bạn?',
    content: '<p>Chi tiết phân biệt...</p>',
    category: 'Kiến thức Sản Phẩm',
    author: 'WASY PRO',
    date: '2024-08-05',
    image: '/images/articles/art-2.webp',
    readTime: '4 phút'
  },
  {
    id: 'art-03',
    title: 'Cách kiểm tra chỉ số ORP và Hydrogen trong nước',
    slug: 'cach-kiem-tra-chi-so-orp-hydrogen',
    excerpt: 'Hướng dẫn sử dụng bút đo và dung dịch để biết chính xác chất lượng nước.',
    content: '<p>Bạn có thể đo bằng...</p>',
    category: 'Hướng dẫn',
    author: 'Admin',
    date: '2024-07-20',
    image: '/images/articles/art-3.webp',
    readTime: '3 phút'
  },
  {
    id: 'art-04',
    title: 'Tại sao cần thay lõi lọc nước đúng hạn?',
    slug: 'tai-sao-can-thay-loi-loc-dung-han',
    excerpt: 'Bảo vệ tuổi thọ máy và đảm bảo chất lượng nước.',
    content: '<p>Lõi lọc quá hạn sẽ...</p>',
    category: 'Bảo dưỡng',
    author: 'Kỹ thuật',
    date: '2024-07-15',
    image: '/images/articles/art-4.webp',
    readTime: '6 phút'
  }
];

export const mockFAQs: FAQ[] = [
  {
    id: 'faq-01',
    question: 'Máy lọc nước Hydrogen khác gì máy RO thông thường?',
    answer: 'Khác biệt lớn nhất là bộ lõi tạo Hydrogen và kiềm tính, giúp nước không chỉ sạch mà còn tốt cho sức khỏe.',
    category: 'Sản phẩm'
  },
  {
    id: 'faq-02',
    question: 'Bao lâu thì cần thay lõi lọc?',
    answer: 'Lõi số 1,2,3 thường 3-6 tháng. Lõi RO và lõi chức năng từ 12-24 tháng.',
    category: 'Bảo dưỡng'
  },
  {
    id: 'faq-03',
    question: 'Tôi có thể tự thay lõi lọc tại nhà không?',
    answer: 'Có, thiết kế máy WASY PRO hỗ trợ thay thế lõi dễ dàng bằng tay không.',
    category: 'Sử dụng'
  },
  {
    id: 'faq-04',
    question: 'Bảo hành điện tử kích hoạt như thế nào?',
    answer: 'Quý khách gửi tin nhắn SMS theo cú pháp hoặc đăng ký trên website mục Bảo hành.',
    category: 'Bảo hành'
  },
  {
    id: 'faq-05',
    question: 'Nước kiềm có đun sôi được không?',
    answer: 'Được, tuy nhiên đun sôi sẽ làm bay hơi khí Hydrogen, nên uống trực tiếp là tốt nhất.',
    category: 'Sức khỏe'
  },
  {
    id: 'faq-06',
    question: 'Máy có tốn điện không?',
    answer: 'Máy chỉ tiêu thụ điện khi bơm hoạt động, chi phí điện năng chưa tới 20.000đ/tháng.',
    category: 'Sử dụng'
  }
];

export const mockAdminUser: AdminUser = {
  id: 'admin-01',
  email: 'admin@wasypro.com',
  name: 'Admin',
  role: 'admin',
};

export const mockLeads: Lead[] = [
  {
    id: 'lead-01',
    customerName: 'Nguyễn Văn Phát',
    phone: '0901111111',
    email: 'phat@email.com',
    message: 'Cần tư vấn máy lọc nước Ion Kiềm',
    address: 'Quận 1, TP.HCM',
    productName: 'Máy Tạo Nước Hydrogen Water King Pro 9',
    status: 'new',
    createdAt: '2024-08-11T10:00:00Z'
  },
  {
    id: 'lead-02',
    customerName: 'Trần Thị Trang',
    phone: '0902222222',
    message: 'Tôi muốn mua lõi lọc thay thế',
    status: 'contacted',
    createdAt: '2024-08-10T14:30:00Z'
  },
  {
    id: 'lead-03',
    customerName: 'Lê Hoàng Anh',
    phone: '0903333333',
    address: 'Hà Nội',
    productName: 'Bình Nước Hydrogen 500ml Cầm Tay',
    status: 'completed',
    createdAt: '2024-08-09T09:15:00Z'
  },
  {
    id: 'lead-04',
    customerName: 'Phạm Minh',
    phone: '0904444444',
    message: 'Hỏi về chính sách bảo hành',
    status: 'cancelled',
    createdAt: '2024-08-08T16:45:00Z'
  }
];
