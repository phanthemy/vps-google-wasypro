const fs = require('fs');
const path = 'src/components/admin/AdminNppManagement.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldFetch =       const [regRes, actRes, pkgRes, usrRes] = await Promise.all([
        fetch('/api/admin/npp/registrations' + (statusFilter ? \\\?status=\\\\\\ : ''), { credentials: 'include', headers: getAuthHeaders() }),
        fetch('/api/admin/npp/activations', { credentials: 'include', headers: getAuthHeaders() }),
        fetch('/api/admin/npp/packages', { credentials: 'include', headers: getAuthHeaders() }),
        fetch('/api/admin/ctv', { credentials: 'include', headers: getAuthHeaders() }),
      ]);
      const [regD, actD, pkgD, usrD] = await Promise.all([regRes.json(), actRes.json(), pkgRes.json(), usrRes.json()]);
      setRegistrations((regD.data || []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setActivations(actD.data || []);
      setPackages((pkgD.data || []).filter((p: NppPackage) => p).sort((a: NppPackage, b: NppPackage) => a.code.localeCompare(b.code)));
      const u = Array.isArray(usrD) ? usrD : usrD.data || [];
      setUsers(u);;

const newFetch =       const [regRes, actRes, pkgRes, usrRes, memRes] = await Promise.all([
        fetch('/api/admin/npp/registrations' + (statusFilter ? \\\?status=\\\\\\ : ''), { credentials: 'include', headers: getAuthHeaders() }),
        fetch('/api/admin/npp/activations', { credentials: 'include', headers: getAuthHeaders() }),
        fetch('/api/admin/npp/packages', { credentials: 'include', headers: getAuthHeaders() }),
        fetch('/api/admin/ctv', { credentials: 'include', headers: getAuthHeaders() }),
        fetch('/api/users/members', { credentials: 'include', headers: getAuthHeaders() }),
      ]);
      const [regD, actD, pkgD, usrD, memD] = await Promise.all([regRes.json(), actRes.json(), pkgRes.json(), usrRes.json(), memRes.json()]);
      setRegistrations((regD.data || []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setActivations(actD.data || []);
      setPackages((pkgD.data || []).filter((p: NppPackage) => p).sort((a: NppPackage, b: NppPackage) => a.code.localeCompare(b.code)));
      const u1 = Array.isArray(usrD) ? usrD : usrD.data || [];
      const u2 = Array.isArray(memD) ? memD : memD.data || [];
      const allUsers = [...u1, ...u2].filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
      setUsers(allUsers);;

// Replace carefully using indexOf
const idx = content.indexOf(const [regRes, actRes, pkgRes, usrRes] = await Promise.all([);
if (idx > -1) {
  const endIdx = content.indexOf(setUsers(u);, idx) + 12;
  const replaced = content.substring(0, idx) + newFetch.replace(/\\\\/g, '') + content.substring(endIdx);
  fs.writeFileSync(path, replaced);
  console.log('REPLACED SUCCESSFULLY');
} else {
  console.log('NOT FOUND. PLEASE CHECK.');
}
