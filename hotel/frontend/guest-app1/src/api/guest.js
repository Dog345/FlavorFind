import axios from 'axios';

/**
 * All network calls the guest app makes. Every call is scoped to a table's
 * QR token — there is no login, so the token in the URL IS the auth.
 */
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/v1/guest`,
  timeout: 15000,
});

/** Map a raw error into one friendly, human-readable message. Never surface raw error objects in the UI. */
export function toFriendlyError(error) {
  const status = error?.response?.status;
  const data = error?.response?.data;

  if (status === 404) return 'Not found. Please try again.';
  if (status === 410) return 'This session has expired. Please ask your waiter.';
  if (status === 422) {
    const firstError =
      data?.errors && typeof data.errors === 'object' ? Object.values(data.errors)[0] : null;
    const message = Array.isArray(firstError) ? firstError[0] : firstError;
    return message || 'Please check your details and try again.';
  }
  if (status === 500 || status === 502) return "Something went wrong on our end. Please try again in a moment.";
  if (!error?.response) return 'Connection lost. Check your wifi and try again.';
  return 'Something went wrong. Please try again.';
}

export const resolveSession = (token) => api.get(`/${token}`);
export const getMenu = (token) => api.get(`/${token}/menu`);
export const searchMenu = (token, q) => api.get(`/${token}/menu/search`, { params: { q } });
export const getPopular = (token) => api.get(`/${token}/popular`);
export const getUpsell = (token, itemIds) =>
  api.get(`/${token}/upsell`, { params: { item_ids: itemIds } });
export const placeOrder = (token, body) => api.post(`/${token}/orders`, body);
export const getOrders = (token) => api.get(`/${token}/orders`);
export const trackOrder = (token, orderId) => api.get(`/${token}/orders/${orderId}`);
export const initiateMpesa = (token, body) => api.post(`/${token}/payments/mpesa`, body);
export const pollPayment = (token, payId) => api.get(`/${token}/payments/${payId}/status`);

export default api;
