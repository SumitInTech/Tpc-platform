import api from './api';

export const getMyProfile = () => api.get('/students/me').then((r) => r.data);
export const getStudents = (params = {}) => api.get('/students', { params }).then((r) => r.data);
export const getStudent = (id) => api.get(`/students/${id}`).then((r) => r.data);
export const createStudent = (data) => api.post('/students', data).then((r) => r.data);
export const updateStudent = (id, data) => api.put(`/students/${id}`, data).then((r) => r.data);
export const updateMyProfile = (data) => api.put('/students/me', data).then((r) => r.data);
export const deleteStudent = (id) => api.delete(`/students/${id}`).then((r) => r.data);

export default { getMyProfile, getStudents, getStudent, createStudent, updateStudent, updateMyProfile, deleteStudent };
