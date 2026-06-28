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

export const api = {
  // Auth
  register: (payload) => request('/users/register', { method: 'POST', body: payload }),
  login: (payload) => request('/users/login', { method: 'POST', body: payload }),

  // Usuarios (admin)
  getClients: () => request('/users', { auth: true }),
  getTechnicians: () => request('/users/technicians', { auth: true }),

  // Citas
  createAppointment: (payload) =>
    request('/appointments', { method: 'POST', body: payload, auth: true }),
  getAllAppointments: () => request('/appointments', { auth: true }),
  getClientAppointments: (clientId) =>
    request(`/appointments/client/${clientId}`, { auth: true }),
  updateStatus: (id, status) =>
    request(`/appointments/${id}/status`, { method: 'PATCH', body: { status }, auth: true }),
  assignTechnician: (id, technicianId) =>
    request(`/appointments/${id}/assign`, { method: 'PATCH', body: { technicianId }, auth: true }),
};
