import api from './api';

export const getOffers = (params = {}) => api.get('/offers', { params }).then((r) => r.data);
export const getOffer = (id) => api.get(`/offers/${id}`).then((r) => r.data);
export const createOffer = (data) => api.post('/offers', data).then((r) => r.data);
export const acceptOffer = (id) => api.post(`/offers/${id}/accept`).then((r) => r.data);
export const declineOffer = (id) => api.post(`/offers/${id}/decline`).then((r) => r.data);
export const withdrawOffer = (id) => api.post(`/offers/${id}/withdraw`).then((r) => r.data);
export const revokeOffer = (id) => api.post(`/offers/${id}/revoke`).then((r) => r.data);
// Policy pre-check used by UI before creating an offer (decision is still enforced server-side)
export const evaluatePolicy = (payload) => api.post('/policies/evaluate', payload).then((r) => r.data);

export default { getOffers, getOffer, createOffer, acceptOffer, declineOffer, withdrawOffer, revokeOffer, evaluatePolicy };
