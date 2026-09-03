import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global Secure API Interceptor (HttpOnly Cookies & CSRF Double-Submit Protection)
function getCsrfToken() {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^|;\\s*)csrf_token=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : '';
}

const originalFetch = window.fetch;
window.fetch = async function(url, options = {}) {
  const opts = { ...options };
  opts.credentials = opts.credentials || 'include';
  opts.headers = { ...(options && options.headers ? options.headers : {}) };
  
  const method = (opts.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && typeof url === 'string' && url.startsWith('/api/')) {
    const csrfToken = getCsrfToken();
    if (csrfToken && !opts.headers['X-CSRF-Token'] && !opts.headers['x-csrf-token']) {
      opts.headers['X-CSRF-Token'] = csrfToken;
    }
  }

  const response = await originalFetch(url, opts);

  if (response.status === 401 && typeof url === 'string' && !url.includes('/api/auth/login')) {
    // Ch? clear localStorage ? KH?NG reload
    // App.jsx s? t? detect currentUser = null v? show LoginView
    localStorage.removeItem('crm_user');
    // Dispatch event ?? App.jsx bi?t session h?t h?n
    window.dispatchEvent(new CustomEvent('session-expired'));
  }

  return response;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
