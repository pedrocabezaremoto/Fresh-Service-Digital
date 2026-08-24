/* Servicio centralizado de API — Fresh Service Digital
   Detecta entorno: local usa el puerto 4000, producción el subdominio del VPS. */
const isLocal =
  ['localhost', '127.0.0.1', ''].includes(window.location.hostname) ||
  window.location.protocol === 'file:';

export const API_BASE = isLocal
  ? 'http://localhost:4000'
  : 'https://api.pedroservicios.xyz';

function getToken() {
  return localStorage.getItem('fsd_token');
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message =
      (data && data.message) ||
      (Array.isArray(data?.message) ? data.message.join(', ') : null) ||
      'Ocurrió un error en el servidor';
    const err = new Error(Array.isArray(message) ? message.join(', ') : message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function uploadFile(path, file) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const body = new FormData();
  body.append('file', file);
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body });
  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const message =
      (data && data.message) ||
      (Array.isArray(data?.message) ? data.message.join(', ') : null) ||
      'Ocurrió un error en el servidor';
    const err = new Error(Array.isArray(message) ? message.join(', ') : message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  // Auth
  register: (payload) => request('/users/register', { method: 'POST', body: payload }),
  login: (payload) => request('/users/login', { method: 'POST', body: payload }),

  // Usuarios (admin)
  forgotPassword: (email) => request('/users/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token, password) => request('/users/reset-password', { method: 'POST', body: { token, password } }),
  getClients: () => request('/users', { auth: true }),
  getTechnicians: () => request('/users/technicians', { auth: true }),
  createTechnician: (payload) => request('/users/create-technician', { method: 'POST', body: payload, auth: true }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PATCH', body: data, auth: true }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE', auth: true }),

  // Servicios (catálogo)
  getServices: () => request('/services'),
  getAllServices: () => request('/services/all', { auth: true }),
  createService: (payload) => request('/services', { method: 'POST', body: payload, auth: true }),
  updateService: (id, data) => request(`/services/${id}`, { method: 'PATCH', body: data, auth: true }),
  deleteService: (id) => request(`/services/${id}`, { method: 'DELETE', auth: true }),

  // Imágenes del sitio
  getSiteImages: () => request('/site-images'),
  uploadSiteImage: (slot, file) => uploadFile(`/site-images/${slot}`, file),
  deleteSiteImage: (slot) => request(`/site-images/${slot}`, { method: 'DELETE', auth: true }),

  // Carrusel hero
  getCarousel: () => request('/carousel'),
  getCarouselAll: () => request('/carousel/all', { auth: true }),
  uploadCarouselImage: (file) => uploadFile('/carousel', file),
  toggleCarouselImage: (id) => request(`/carousel/${id}/toggle`, { method: 'PATCH', auth: true }),
  deleteCarouselImage: (id) => request(`/carousel/${id}`, { method: 'DELETE', auth: true }),

  // Citas
  createAppointment: (payload) =>
    request('/appointments', { method: 'POST', body: payload, auth: true }),
  createQuickAppointment: (payload) =>
    request('/appointments/quick', { method: 'POST', body: payload, auth: true }),
  getAllAppointments: () => request('/appointments', { auth: true }),
  getClientAppointments: (clientId) =>
    request(`/appointments/client/${clientId}`, { auth: true }),
  updateStatus: (id, status) =>
    request(`/appointments/${id}/status`, { method: 'PATCH', body: { status }, auth: true }),
  assignTechnician: (id, technicianId) =>
    request(`/appointments/${id}/assign`, { method: 'PATCH', body: { technicianId }, auth: true }),
};
