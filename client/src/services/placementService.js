import api from './api';

export const getPlacements = (params = {}) => api.get('/placements', { params }).then((r) => r.data);
export const getPlacement = (id) => api.get(`/placements/${id}`).then((r) => r.data);

export default { getPlacements, getPlacement };
