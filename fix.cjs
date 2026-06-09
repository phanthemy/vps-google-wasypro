const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// The submit function
content = content.replace(
  /const handleSubmit = async \(e\) => \{[\s\S]*?catch\(e\) \{ setError\('Lỗi kết nối'\); \}\n  \};/,
  `const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const url = editingUser ? '/api/internal-users/' + editingUser.userId : '/api/internal-users';
      const method = editingUser ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      }).then(r => r.json());
      if (res.success) {
        setFormData({ fullName: '', phone: '', role: 'accountant', password: '' });
        setEditingUser(null);
        loadUsers();
      } else setError(res.message || 'Lỗi server');
    } catch(e) { setError('Lỗi kết nối'); }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setFormData({ fullName: '', phone: '', role: 'accountant', password: '' });
    setError('');
  };`
);

content = content.replace(
  /<h3 className="text-primary font-bold mb-4 flex items-center gap-2"><UserCog size=\{18\}\/> Khởi tạo Tài khoản Mới<\/h3>/,
  '<h3 className="text-primary font-bold mb-4 flex items-center gap-2"><UserCog size={18}/> {editingUser ? `Chỉnh sửa: ${editingUser.fullName}` : `Khởi tạo Tài khoản Mới`}</h3>'
);

content = content.replace(
  /<label className="text-sm font-bold">Mật khẩu<\/label>\s*<input required className="input-field" type="text" value=\{formData\.password\} onChange=\{e => setFormData\(\{\.\.\.formData, password: e\.target\.value\}\)\} placeholder="123456" \/>/,
  '<label className="text-sm font-bold">Mật khẩu {editingUser && "(Để trống nếu không đổi)"}</label>\n            <input className="input-field" type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={editingUser ? "Không đổi thì bỏ trống..." : "123456"} required={!editingUser} />'
);

content = content.replace(
  /<button type="submit" className="btn btn-primary mt-2">Tạo Tài Khoản<\/button>/,
  '<div className="flex gap-2 mt-2">\n            {editingUser && <button type="button" onClick={handleCancelEdit} className="btn btn-secondary flex-1">Hủy</button>}\n            <button type="submit" className="btn btn-primary flex-1">{editingUser ? "Cập nhật" : "Tạo Tài Khoản"}</button>\n          </div>'
);

content = content.replace(
  /onClick=\{async \(\) => \{[\s\S]*?\}\}[\s\S]*?className="btn btn-secondary text-xs" style=\{\{ padding: '0\.25rem 0\.5rem' \}\}>Đổi Pass<\/button>/,
  `onClick={() => {
                        setEditingUser(u);
                        setFormData({ fullName: u.fullName, phone: u.phone, role: u.role, password: '' });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="btn btn-secondary text-xs" style={{ padding: '0.25rem 0.5rem' }}>Chỉnh sửa</button>`
);

fs.writeFileSync('src/App.jsx', content, 'utf8');
