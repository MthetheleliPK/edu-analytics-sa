import api from './api';

export const parentService = {
  register: (data) => api.post('/parents/register', data),
  login: (data) => api.post('/parents/login', data),
  getDashboard: () => api.get('/parent/dashboard'),
  getStudentReport: (studentId, params) => api.get(`/parent/students/${studentId}/report`, { params }),
  updateProfile: (data) => api.put('/parent/profile', data),
  getNotifications: () => api.get('/parent/notifications'),
  updateNotificationSettings: (data) => api.put('/parent/notification-settings', data)
};