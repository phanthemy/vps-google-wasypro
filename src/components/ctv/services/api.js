// Centralized API services for CTV Portal
export async function getDashboardData() {
  const res = await fetch('/api/dashboard');
  return res.json();
}

export async function getUsers() {
  const res = await fetch('/api/users');
  return res.json();
}

export async function getCustomers() {
  const res = await fetch('/api/customers');
  return res.json();
}

export async function getServices() {
  const res = await fetch('/api/services');
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
  const res = await fetch('/api/auth/logout', { method: 'POST' });
  return res.json();
}
