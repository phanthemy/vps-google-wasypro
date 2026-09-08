// Centralized API services for CTV Portal
export async function getDashboardData() {
  const res = await fetch('/api/dashboard', { credentials: 'include' });
  return res.json();
}

export async function getUsers() {
  const res = await fetch('/api/users', { credentials: 'include' });
  return res.json();
}

export async function getCustomers() {
  const res = await fetch('/api/customers', { credentials: 'include' });
  return res.json();
}

export async function getServices() {
  const res = await fetch('/api/services', { credentials: 'include' });
  return res.json();
}

export async function getOrders(userId) {
  const url = userId ? `/api/orders?userId=${userId}` : '/api/orders';
  const res = await fetch(url);
  return res.json();
}

export async function getCommissions(userId) {
  const url = userId ? `/api/commissions?userId=${userId}` : '/api/commissions';
  const res = await fetch(url);
  return res.json();
}

export async function logout() {
  const res = await fetch('/api/auth/logout', { credentials: 'include', method: 'POST' });
  return res.json();
}
