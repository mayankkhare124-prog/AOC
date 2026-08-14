/* ============================================================
   AOC — API helper
   All frontend fetch calls go through here so error handling,
   base URL, and auth headers stay in one place.

   Auth model: httpOnly cookie ONLY. The server never returns a JWT in the
   response body, and the frontend never stores or reads a token — every
   request simply sends credentials:'include' and the browser attaches the
   cookie automatically. This keeps the token out of reach of any XSS/JS.
   ============================================================ */
const API_BASE = '/api';

async function apiRequest(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new Error('Something interrupted the signal. Check your connection and try again.');
  }

  let data;
  try {
    data = await res.json();
  } catch (parseErr) {
    throw new Error('Unexpected response from the server.');
  }

  if (!res.ok || data.success === false) {
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }
  return data;
}

const AOC_API = {
  // Public reads
  getEvents: (status) => apiRequest(`/events${status ? `?status=${status}` : ''}`),
  getEventBySlug: (slug) => apiRequest(`/events/slug/${encodeURIComponent(slug)}`),
  getSessions: () => apiRequest('/sessions'),
  getGallery: () => apiRequest('/gallery'),
  getTestimonials: () => apiRequest('/testimonials'),
  getTeam: () => apiRequest('/team'),
  getSettings: () => apiRequest('/settings'),

  // Public writes (forms)
  register: (payload) => apiRequest('/registrations', { method: 'POST', body: payload }),
  joinAoc: (payload) => apiRequest('/join', { method: 'POST', body: payload }),
  contact: (payload) => apiRequest('/contact', { method: 'POST', body: payload }),

  // Auth
  login: (email, password) => apiRequest('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => apiRequest('/auth/me'),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),

  // Admin CRUD (generic) — cookie carries auth automatically, no explicit flag needed
  adminList: (resource, query = '') => apiRequest(`/${resource}${query}`),
  adminGet: (resource, id) => apiRequest(`/${resource}/${id}`),
  adminCreate: (resource, payload) => apiRequest(`/${resource}`, { method: 'POST', body: payload }),
  adminUpdate: (resource, id, payload) => apiRequest(`/${resource}/${id}`, { method: 'PUT', body: payload }),
  adminDelete: (resource, id) => apiRequest(`/${resource}/${id}`, { method: 'DELETE' }),
  adminOverview: () => apiRequest('/overview'),
  adminUpdateSettings: (payload) => apiRequest('/settings', { method: 'PUT', body: payload }),
};
