import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/v1/guest`,
  timeout: 15000,
});

export const resolveSession = (token) => api.get(`/${token}`);
export const getMenu        = (token) => api.get(`/${token}/menu`);
export const placeOrder     = (token, body) => api.post(`/${token}/orders`, body);
export const trackOrder     = (token, orderId) => api.get(`/${token}/orders/${orderId}`);

export function friendlyError(err) {
  const s = err?.response?.status;
  if (s === 410) return 'This table session has closed. Ask your waiter.';
  if (s === 404) return 'QR code not recognised.';
  if (s === 422) {
    const e = err?.response?.data?.errors;
    if (e) return Object.values(e).flat()[0];
  }
  if (!err?.response) return 'No connection. Check your wifi.';
  return 'Something went wrong. Please try again.';
}

export default api;
