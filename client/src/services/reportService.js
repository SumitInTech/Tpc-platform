import api from './api';
import { downloadCSV } from '../utils/formatters';

export const getOverview = (params = {}) => api.get('/reports/overview', { params }).then((r) => r.data);
export const getBranchWise = (params = {}) => api.get('/reports/branch-wise', { params }).then((r) => r.data);
export const getCompanyWise = (params = {}) => api.get('/reports/company-wise', { params }).then((r) => r.data);
export const getPackageDistribution = (params = {}) => api.get('/reports/package-distribution', { params }).then((r) => r.data);
export const getYearWise = (params = {}) => api.get('/reports/year-wise', { params }).then((r) => r.data);
export const exportReport = async (params = {}, filename = 'placement-report.csv') => {
  const res = await api.get('/reports/export', { params });
  if (res.data?.success && Array.isArray(res.data.data)) downloadCSV(res.data.data, filename);
  return res.data;
};
export const getNIRFGO = (params = {}) => api.get('/reports/nirf-go', { params }).then((r) => r.data);
export const exportNIRFGO = async (params = {}, filename = 'nirf-go.csv') => {
  const res = await api.get('/reports/nirf-go-export', { params });
  if (res.data?.success && Array.isArray(res.data.data)) downloadCSV(res.data.data, filename);
  return res.data;
};

export default {
  getOverview, getBranchWise, getCompanyWise, getPackageDistribution, getYearWise, exportReport, getNIRFGO, exportNIRFGO,
};
