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
    callback: (access_token) => request('/auth/callback', { method: 'POST', body: JSON.stringify({ access_token }) }),
  },
  simulations: {
    list: () => request('/simulations'),
    get: (id) => request(`/simulations/${id}`),
  },
  attempts: {
    create: (simulation_id) => request('/attempts', { method: 'POST', body: JSON.stringify({ simulation_id }) }),
    get: (id) => request(`/attempts/${id}`),
    active: () => request('/attempts/active'),
    sendMessage: (id, message) => request(`/attempts/${id}/message`, { method: 'POST', body: JSON.stringify({ message }) }),
    getMessages: (id) => request(`/attempts/${id}/messages`),
    submit: (id, solution_text) => request(`/attempts/${id}/submit`, { method: 'POST', body: JSON.stringify({ solution_text }) }),
    evaluate: (id) => request(`/attempts/${id}/evaluate`, { method: 'POST' }),
    getEvaluation: (id) => request(`/attempts/${id}/evaluation`),
  },
  credentials: {
    create: (attempt_id) => request('/credentials', { method: 'POST', body: JSON.stringify({ attempt_id }) }),
    list: () => request('/credentials'),
    get: (id) => request(`/credentials/${id}`),
  },
  leaderboard: {
    get: (params) => request(`/leaderboard?${new URLSearchParams(params || {})}`),
    schools: () => request('/leaderboard/schools'),
  },
};
