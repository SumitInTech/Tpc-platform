import api from './api';

export const getDrives = (params = {}) => api.get('/drives', { params }).then((r) => r.data);
export const getDriveSummary = (params = {}) => api.get('/drives/summary', { params }).then((r) => r.data);
export const getDrive = (id) => api.get(`/drives/${id}`).then((r) => r.data);
export const createDrive = (data) => api.post('/drives', data).then((r) => r.data);
export const updateDrive = (id, data) => api.put(`/drives/${id}`, data).then((r) => r.data);
export const publishDrive = (id) => api.post(`/drives/${id}/publish`).then((r) => r.data);
export const closeDrive = (id) => api.post(`/drives/${id}/close`).then((r) => r.data);
export const deleteDrive = (id) => api.delete(`/drives/${id}`).then((r) => r.data);
// Student: authoritative eligibility evaluation for self
export const getMyEligibility = (driveId) => api.get(`/drives/${driveId}/eligibility`).then((r) => r.data);
// TPC: evaluate a specific student against drive
export const evaluateEligibility = (driveId, studentId) =>
  api.post(`/drives/${driveId}/eligibility/evaluate`, { studentId }).then((r) => r.data);

export default {
  getDrives, getDrive, createDrive, updateDrive, publishDrive, closeDrive, deleteDrive,
  getMyEligibility, evaluateEligibility, getDriveSummary,
};
