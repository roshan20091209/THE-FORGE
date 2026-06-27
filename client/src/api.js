const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  auth: {
    register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request('/auth/me'),
    updateProfile: (body) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
  },
  simulations: {
    list: () => request('/simulations'),
    get: (id) => request(`/simulations/${id}`),
    create: (body) => request('/simulations', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/simulations/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/simulations/${id}`, { method: 'DELETE' }),
  },
  attempts: {
    create: (simulation_id) => request('/attempts', { method: 'POST', body: JSON.stringify({ simulation_id }) }),
    get: (id) => request(`/attempts/${id}`),
    active: () => request('/attempts/active'),
    sendMessage: (id, message) => request(`/attempts/${id}/message`, { method: 'POST', body: JSON.stringify({ message }) }),
    getMessages: (id) => request(`/attempts/${id}/messages`),
    submit: (id, solution_text, solution_url) => request(`/attempts/${id}/submit`, { method: 'POST', body: JSON.stringify({ solution_text, solution_url }) }),
    evaluate: (id) => request(`/attempts/${id}/evaluate`, { method: 'POST' }),
    getEvaluation: (id) => request(`/attempts/${id}/evaluation`),
    checkCrisis: (id) => request(`/attempts/${id}/crisis/check`),
  },
  credentials: {
    create: (attempt_id) => request('/credentials', { method: 'POST', body: JSON.stringify({ attempt_id }) }),
    list: () => request('/credentials'),
    get: (id) => request(`/credentials/${id}`),
  },
  reviews: {
    pending: () => request('/reviews/pending'),
    submit: (body) => request('/reviews', { method: 'POST', body: JSON.stringify(body) }),
    get: (attemptId) => request(`/reviews/${attemptId}`),
  },
  employers: {
    candidates: (params) => request(`/employers/candidates?${new URLSearchParams(params)}`),
    analytics: () => request('/employers/analytics'),
  },
  admin: {
    sql: (sql) => request('/admin/sql', { method: 'POST', body: JSON.stringify({ sql }) }),
    stats: () => request('/admin/stats'),
    seed: () => request('/admin/seed', { method: 'POST' }),
  },
};
