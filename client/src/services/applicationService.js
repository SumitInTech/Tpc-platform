import api from './api';
import { downloadCSV } from '../utils/formatters';

export const getApplications = (params = {}) => api.get('/applications', { params }).then((r) => r.data);
export const getApplication = (id) => api.get(`/applications/${id}`).then((r) => r.data);
// Backend re-evaluates eligibility + policy before creating the application.
// `payload` may include { resume, resumeName, whyThisRole } captured at apply time.
export const applyToDrive = (driveId, payload = {}) => api.post(`/drives/${driveId}/apply`, payload).then((r) => r.data);
export const updateStatus = (id, status, remarks) =>
  api.patch(`/applications/${id}/status`, { status, remarks }).then((r) => r.data);

export const exportApplicationsCSV = async () => {
  const res = await getApplications({ limit: 1000 });
  const rows = (res?.data || []).map((a) => ({
    Student: a.studentId?.name || '',
    StudentID: a.studentId?.studentId || '',
    Branch: a.studentId?.branch || '',
    Drive: a.driveId?.title || '',
    Status: a.status,
    AppliedAt: a.appliedAt ? new Date(a.appliedAt).toISOString().slice(0, 10) : '',
  }));
  downloadCSV(rows, 'applications.csv');
};

export default { getApplications, getApplication, applyToDrive, updateStatus, exportApplicationsCSV };
