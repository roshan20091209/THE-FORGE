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

async function uploadFile(endpoint, formData) {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${endpoint}`, { method: 'POST', headers, body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
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

  textbooks: {
    upload: (formData) => uploadFile('/textbooks', formData),
    list: (params) => request(`/textbooks?${new URLSearchParams(params || {})}`),
    get: (id) => request(`/textbooks/${id}`),
    delete: (id) => request(`/textbooks/${id}`, { method: 'DELETE' }),
    index: (id) => request(`/textbooks/${id}/index`, { method: 'POST' }),
    status: (id) => request(`/textbooks/${id}/status`),
    chapters: (id) => request(`/textbooks/${id}/chapters`),
  },
  ask: {
    question: (body) => request('/ask', { method: 'POST', body: JSON.stringify(body) }),
    explain: (body) => request('/ask/explain', { method: 'POST', body: JSON.stringify(body) }),
    assignment: (body) => request('/ask/assignment', { method: 'POST', body: JSON.stringify(body) }),
    generateQuestions: (body) => request('/ask/generate-questions', { method: 'POST', body: JSON.stringify(body) }),
    history: (limit) => request(`/ask/history?limit=${limit || 50}`),
  },
  questionPapers: {
    upload: (formData) => uploadFile('/question-papers', formData),
    list: (params) => request(`/question-papers?${new URLSearchParams(params || {})}`),
    get: (id) => request(`/question-papers/${id}`),
    extract: (id) => request(`/question-papers/${id}/extract`, { method: 'POST' }),
  },
  subscriptions: {
    plans: () => request('/subscriptions/plans'),
    current: () => request('/subscriptions/current'),
    create: (body) => request('/subscriptions', { method: 'POST', body: JSON.stringify(body) }),
    cancel: () => request('/subscriptions/cancel', { method: 'POST' }),
    check: () => request('/subscriptions/check'),
  },
  payments: {
    createOrder: (body) => request('/payments/create-order', { method: 'POST', body: JSON.stringify(body) }),
    verify: (body) => request('/payments/verify', { method: 'POST', body: JSON.stringify(body) }),
    upi: (body) => request('/payments/upi', { method: 'POST', body: JSON.stringify(body) }),
    history: () => request('/payments/history'),
  },
};
