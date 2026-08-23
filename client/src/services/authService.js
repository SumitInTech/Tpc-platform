import api from './api';

const unwrap = (res) => res.data;

export default {
  login: (email, password) => api.post('/auth/login', { email, password }).then(unwrap),
  me: () => api.get('/auth/me').then(unwrap),
  logout: () => api.post('/auth/logout').then(unwrap),
};
