const { PrismaClient } = require('./server/node_modules/@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'file:/var/www/wasypro/server/dev.db' } } });

const initialArticles = [
  {
    id: "news-01",
    title: "HTV9 Nói Gì Về Máy Tạo Nước Hydrogen Wasy Pro Của Tập Đoàn Mall Ok",
    slug: "htv9-noi-gi-ve-may-tao-nuoc-hydrogen-wasy-pro-mall-ok",
    excerpt: "Phóng sự đặc biệt của Đài Truyền hình TP.HCM (HTV9) ghi nhận bước tiến công nghệ đột phá của máy tạo nước Hydrogen Wasy Pro trong việc chăm sóc sức khoẻ cộng đồng.",
    content: "Đài Truyền hình TP.HCM (HTV9) đã có buổi ghi hình và đưa tin phóng sự về dòng máy tạo nước Hydrogen Wasy Pro do Tập đoàn Mall Ok phát triển. Với công nghệ điện phân tiên tiến mang lại nguồn nước giàu Hydro tươi và ion kiềm sạch, Wasy Pro vinh dự nhận được sự đánh giá cao từ các chuyên gia y tế và sự tin tưởng của hàng nghìn gia đình Việt.",
    category: "Truyền Hình & Báo Chí",
    author: "HTV9 Phóng Sự",
    date: "15/03/2026",
    image: "https://img.youtube.com/vi/Md-1v66oJ4k/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=Md-1v66oJ4k",
    readTime: "Video HTV9"
  },
  {
    id: "news-02",
    title: "Tham Quan Nhà Máy Sản Xuất Nước Ion Kiềm Sạch Happy Life Tại Phú Thọ",
    slug: "tham-quan-nha-may-san-xuat-nuoc-ion-kiem-sach-happy-life-phu-tho",
    excerpt: "Trực tiếp khám phá quy trình sản xuất nước ion kiềm đóng bình và đóng chai tại tổ hợp nhà máy hiện đại bậc nhất của Happy Life tại Phú Thọ.",
    content: "Thước phim toàn cảnh ghi lại dây chuyền sản xuất tự động khép kín theo tiêu chuẩn ISO 13485 và FDA quốc tế tại nhà máy Phú Thọ. Từng giọt nước ion kiềm Happy Life được xử lý qua hệ thống lọc đa tầng và buồng điện phân công nghệ cao, giữ trọn khoáng chất tự nhiên và chỉ số chống oxy hóa vượt trội.",
    category: "Nhà Máy & Quy Trình",
    author: "Ban Truyền Thông",
    date: "20/02/2026",
    image: "https://img.youtube.com/vi/uG0KWvFcLgM/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=uG0KWvFcLgM",
    readTime: "Video Nhà Máy"
  },
  {
    id: "news-03",
    title: "Quy Trình Demo Test Nước Chuẩn Đến Từ Tập Đoàn Mall Ok & Wasy Pro",
    slug: "quy-trinh-demo-test-nuoc-chuan-tap-doan-mall-ok",
    excerpt: "Hướng dẫn thực nghiệm đo lường 3 chỉ số vàng: Nồng độ Hydrogen hoà tan, Độ pH kiềm tính và Chỉ số chống oxy hoá ORP âm sâu.",
    content: "Video hướng dẫn chi tiết các bước thí nghiệm trực quan giúp khách hàng và đối tác phân biệt rõ ràng giữa nước lọc thông thường và nước Hydrogen Ion Kiềm Wasy Pro qua bút đo chuyên dụng và chất thử pH tự nhiên.",
    category: "Hướng Dẫn Kỹ Thuật",
    author: "Chuyên Gia Kỹ Thuật",
    date: "10/01/2026",
    image: "https://img.youtube.com/vi/HD5oRa6Gnos/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=HD5oRa6Gnos",
    readTime: "Video Kỹ Thuật"
  },
  {
    id: "news-04",
    title: "Lễ Ký Kết Hợp Tác & Tri Ân Khách Hàng Tại Khách Sạn 5 Sao New World",
    slug: "le-ky-ket-va-tri-an-khach-hang-new-world",
    excerpt: "Sự kiện quy tụ hơn 500 đại sứ, nhà phân phối và đối tác chiến lược trên toàn quốc đánh dấu bước chuyển mình phát triển mạnh mẽ của thương hiệu.",
    content: "Đại tiệc tri ân và vinh danh những cá nhân, tập thể xuất sắc đã đồng hành lan tỏa giải pháp nước tốt đến mọi miền đất nước, cùng nghi thức ký kết các hợp đồng phân phối quy mô lớn.",
    category: "Sự Kiện & Tri Ân",
    author: "Ban Tổ Chức Sự Kiện",
    date: "08/03/2025",
    image: "https://img.youtube.com/vi/49nNzCGRGok/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=49nNzCGRGok",
    readTime: "Video Sự Kiện"
  },
  {
    id: "news-05",
    title: "Khai Trương Chuỗi Không Gian Trải Nghiệm Hydrogen Coffee Độc Đáo",
    slug: "khai-truong-chuoi-hydrogen-coffee-mall-ok",
    excerpt: "Mô hình kết hợp thưởng thức cà phê sạch cùng nguồn nước Hydrogen hoạt tính lần đầu tiên xuất hiện tại Việt Nam.",
    content: "Chuỗi Hydrogen Coffee mang đến không gian trải nghiệm thực tế nguồn nước kiềm và hydro tươi cho người tiêu dùng ngay tại các đô thị sầm uất, góp phần nâng cao thói quen sống khỏe mỗi ngày.",
    category: "Sự Kiện & Tri Ân",
    author: "Hydrogen Coffee",
    date: "01/01/2025",
    image: "https://img.youtube.com/vi/4_a-EMBnWYw/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=4_a-EMBnWYw",
    readTime: "Video Khai Trương"
  },
  {
    id: "news-06",
    title: "Tết Doanh Nhân HTV - Doanh Nghiệp Đổi Mới Sáng Tạo Tiêu Biểu",
    slug: "tet-doanh-nhan-htv-doanh-nghiep-tieu-bieu",
    excerpt: "Giao lưu doanh nhân và chương trình chào xuân trên sóng truyền hình TP.HCM cùng nhà sáng lập Nguyễn Đức Quang.",
    content: "Chương trình tôn vinh những doanh nghiệp tiên phong ứng dụng công nghệ xanh, bảo vệ sức khỏe cộng đồng và tạo ra giá trị bền vững cho xã hội.",
    category: "Truyền Hình & Báo Chí",
    author: "HTV Doanh Nhân",
    date: "25/01/2025",
    image: "https://img.youtube.com/vi/JP02smZmhP4/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=JP02smZmhP4",
    readTime: "Video HTV"
  },
  {
    id: "news-07",
    title: "Đón Tết Khỏe Mạnh Cùng Máy Tạo Nước Hydrogen Wasy Pro Chính Hãng",
    slug: "don-tet-cung-may-tao-nuoc-hydrogen-wasy-pro",
    excerpt: "Món quà sức khỏe ý nghĩa và thiết thực nhất dành tặng ông bà, cha mẹ và người thân yêu trong dịp đầu xuân.",
    content: "Video tổng hợp chia sẻ cảm nhận thực tế của khách hàng sau thời gian sử dụng nước Hydrogen trong việc hỗ trợ tiêu hóa, đào thải độc tố và thanh lọc cơ thể trong những ngày Tết.",
    category: "Khách Hàng Chia Sẻ",
    author: "Ban Chăm Sóc Khách Hàng",
    date: "15/01/2025",
    image: "https://img.youtube.com/vi/HRwxpWOncwU/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=HRwxpWOncwU",
    readTime: "Video Trải Nghiệm"
  },
  {
    id: "news-08",
    title: "Mall Ok Vun Đắp Thế Hệ Mầm Non Tương Lai Của Đất Nước",
    slug: "mall-ok-vun-dap-the-he-mam-non-tuong-lai",
    excerpt: "Hành trình thiện nguyện mang nguồn nước sạch và học bổng khuyến học đến với các điểm trường vùng cao và hoàn cảnh khó khăn.",
    content: "Hoạt động trách nhiệm xã hội (CSR) thường niên của Wasy Pro và Mall Ok nhằm đồng hành cùng sự phát triển khỏe mạnh của trẻ em Việt Nam.",
    category: "Hoạt Động Xã Hội",
    author: "Quỹ Nước Tốt Tương Lai",
    date: "01/06/2024",
    image: "https://img.youtube.com/vi/hCHuTO2U4JM/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=hCHuTO2U4JM",
    readTime: "Video Ý Nghĩa"
  },
  {
    id: "news-09",
    title: "Đại Tiệc Gala Dinner & Tri Ân Đội Ngũ Tiên Phong Mall Ok",
    slug: "dai-tiec-gala-dinner-tri-an-doi-ngu-tien-phong",
    excerpt: "Đêm hội ngập tràn cảm xúc nhìn lại chặng đường cống hiến và vinh danh những người thuyền trưởng xuất sắc.",
    content: "Chương trình tiệc tất niên trang trọng với sự tham dự của toàn thể ban lãnh đạo, nhân viên và các nhà phân phối cốt cán của hệ sinh thái Wasy Pro.",
    category: "Sự Kiện & Tri Ân",
    author: "Ban Truyền Thông",
    date: "10/01/2024",
    image: "https://img.youtube.com/vi/M5EfmvcWS_4/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=M5EfmvcWS_4",
    readTime: "Video Gala"
  }
];

async function initDB() {
  console.log('1. Creating NewsArticle table if not exists...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS NewsArticle (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      excerpt TEXT,
      content TEXT,
      category TEXT DEFAULT 'Sự Kiện',
      author TEXT DEFAULT 'Ban Truyền Thông',
      date TEXT,
      image TEXT,
      videoUrl TEXT,
      readTime TEXT DEFAULT 'Video',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('2. Inserting initial 9 video articles...');
  for (const art of initialArticles) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO NewsArticle (id, title, slug, excerpt, content, category, author, date, image, videoUrl, readTime)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title=excluded.title,
        slug=excluded.slug,
        excerpt=excluded.excerpt,
        content=excluded.content,
        category=excluded.category,
        author=excluded.author,
        date=excluded.date,
        image=excluded.image,
        videoUrl=excluded.videoUrl,
        readTime=excluded.readTime;
    `, art.id, art.title, art.slug, art.excerpt, art.content, art.category, art.author, art.date, art.image, art.videoUrl, art.readTime);
    console.log(`Inserted/Updated: ${art.title}`);
  }

  const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as cnt FROM NewsArticle;`);
  console.log('Total articles in DB:', count);
}

initDB().finally(() => prisma.$disconnect());
