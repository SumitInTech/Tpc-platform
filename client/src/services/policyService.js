import api from './api';
import { downloadCSV } from '../utils/formatters';

export const getPolicies = () => api.get('/policies').then((r) => r.data);
export const getPolicy = (id) => api.get(`/policies/${id}`).then((r) => r.data);
export const createPolicy = (data) => api.post('/policies', data).then((r) => r.data);
export const updatePolicy = (id, data) => api.put(`/policies/${id}`, data).then((r) => r.data);
export const activatePolicy = (id) => api.post(`/policies/${id}/activate`).then((r) => r.data);
export const deactivatePolicy = (id) => api.post(`/policies/${id}/deactivate`).then((r) => r.data);
// Explainable policy decision — the backend remains authoritative at enforcement time
export const evaluatePolicy = (payload) => api.post('/policies/evaluate', payload).then((r) => r.data);
export const exportPoliciesCSV = async () => {
  const res = await getPolicies();
  const rows = (res?.data || []).map((p) => ({
    Name: p.name,
    Type: p.type,
    Scope: p.scope,
    Version: p.version,
    Status: p.isActive ? 'ACTIVE' : 'INACTIVE',
    Configuration: JSON.stringify(p.configuration || {}),
    EffectiveFrom: p.effectiveFrom || '',
  }));
  downloadCSV(rows, 'placement-policies.csv');
};

export default {
  getPolicies, getPolicy, createPolicy, updatePolicy, activatePolicy, deactivatePolicy, evaluatePolicy, exportPoliciesCSV,
};
