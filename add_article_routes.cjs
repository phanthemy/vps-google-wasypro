const fs = require('fs');

const articleRoutesCode = `
// ============ ARTICLES / NEWS API ============
app.get('/api/articles', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM NewsArticle WHERE 1=1';
    const params = [];
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND (title LIKE ? OR excerpt LIKE ? OR content LIKE ?)';
      params.push(\`%\${search}%\`, \`%\${search}%\`, \`%\${search}%\`);
    }
    query += ' ORDER BY createdAt DESC, id ASC';
    const articles = await prisma.$queryRawUnsafe(query, ...params);
    res.json(articles);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/articles/:slugOrId', async (req, res) => {
  try {
    const articles = await prisma.$queryRawUnsafe(
      'SELECT * FROM NewsArticle WHERE id = ? OR slug = ? LIMIT 1',
      req.params.slugOrId, req.params.slugOrId
    );
    if (!articles || articles.length === 0) return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    res.json(articles[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/articles', async (req, res) => {
  try {
    const { title, slug, excerpt, content, category, author, date, image, videoUrl, readTime } = req.body;
    if (!title) return res.status(400).json({ error: 'Tiêu đề là bắt buộc' });
    const finalId = 'art-' + Date.now();
    const finalSlug = slug || title.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const now = new Date().toISOString();
    await prisma.$executeRawUnsafe(
      \`INSERT INTO NewsArticle (id, title, slug, excerpt, content, category, author, date, image, videoUrl, readTime, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
      finalId, title, finalSlug, excerpt || '', content || '', category || 'Sự Kiện', author || 'Ban Truyền Thông', date || new Date().toLocaleDateString('vi-VN'), image || '', videoUrl || '', readTime || 'Video', now, now
    );
    const newArt = await prisma.$queryRawUnsafe('SELECT * FROM NewsArticle WHERE id = ?', finalId);
    res.json({ success: true, article: newArt[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/articles/:id', async (req, res) => {
  try {
    const { title, slug, excerpt, content, category, author, date, image, videoUrl, readTime } = req.body;
    const now = new Date().toISOString();
    await prisma.$executeRawUnsafe(
      \`UPDATE NewsArticle SET
        title = COALESCE(?, title),
        slug = COALESCE(?, slug),
        excerpt = COALESCE(?, excerpt),
        content = COALESCE(?, content),
        category = COALESCE(?, category),
        author = COALESCE(?, author),
        date = COALESCE(?, date),
        image = COALESCE(?, image),
        videoUrl = COALESCE(?, videoUrl),
        readTime = COALESCE(?, readTime),
        updatedAt = ?
       WHERE id = ?\`,
      title, slug, excerpt, content, category, author, date, image, videoUrl, readTime, now, req.params.id
    );
    const updated = await prisma.$queryRawUnsafe('SELECT * FROM NewsArticle WHERE id = ?', req.params.id);
    res.json({ success: true, article: updated[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/articles/:id', async (req, res) => {
  try {
    await prisma.$executeRawUnsafe('DELETE FROM NewsArticle WHERE id = ?', req.params.id);
    res.json({ success: true, message: 'Đã xóa bài viết thành công' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
`;

function injectRoutes() {
  console.log('Injecting article routes into server.cjs...');
  let cjs = fs.readFileSync('/var/www/wasypro/server.cjs', 'utf8');
  if (!cjs.includes("app.get('/api/articles'")) {
    cjs = cjs.replace(
      "// ============ PRODUCT API ============",
      articleRoutesCode + "\n// ============ PRODUCT API ============"
    );
    fs.writeFileSync('/var/www/wasypro/server.cjs', cjs);
    console.log('server.cjs updated.');
  }

  console.log('Injecting article routes into server/index.js...');
  let idx = fs.readFileSync('/var/www/wasypro/server/index.js', 'utf8');
  if (!idx.includes("app.get('/api/articles'")) {
    idx = idx.replace(
      "// PROTECTED PRODUCT CRUD (Admin only)",
      articleRoutesCode + "\n// PROTECTED PRODUCT CRUD (Admin only)"
    );
    fs.writeFileSync('/var/www/wasypro/server/index.js', idx);
    console.log('server/index.js updated.');
  }
}

injectRoutes();
