import api from './api';

export const getAuditLogs = (params = {}) => api.get('/audit-logs', { params }).then((r) => r.data);
export const getAuditStats = () => api.get('/audit-logs/stats').then((r) => r.data);

export default { getAuditLogs, getAuditStats };
