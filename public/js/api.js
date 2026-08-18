/* ============================================================
   AOC Image Storage Utility
   Supports:
   1. Google Drive URLs (https://drive.google.com/file/d/FILE_ID/view?usp=sharing, etc.)
   2. Normal external URLs (https://images.unsplash.com/...)
   3. Local relative assets (/images/...)
   ============================================================ */
function extractGoogleDriveFileId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  // Regex to extract 25-50 char Google Drive file ID from view, uc, open, or d/ paths
  const driveRegex = /(?:drive\.google\.com\/(?:file\/d\/|uc\?(?:[^&]+&)*id=|open\?id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]{25,50})/;
  const match = trimmed.match(driveRegex);
  return match ? match[1] : null;
}

function getImageUrl(source) {
  if (!source || typeof source !== 'string') return '';
  const fileId = extractGoogleDriveFileId(source);
  if (fileId) {
    // Generate high-reliability Google Drive direct thumbnail/image viewing URL
    return `https://lh3.googleusercontent.com/d/${fileId}=s1600`;
  }
  return source.trim();
}

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
