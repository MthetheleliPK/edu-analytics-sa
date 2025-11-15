import api from './api';

export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getRecentActivity: () => api.get('/admin/activity'),
  getSystemHealth: () => api.get('/admin/health'),
  getSchools: (params) => api.get('/admin/schools', { params }),
  updateSchool: (schoolId, data) => api.put(`/admin/schools/${schoolId}`, data),
  getUsers: (params) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  exportData: (params) => api.get('/admin/export', { params, responseType: 'blob' }),
  getBackups: () => api.get('/admin/backups'),
  createBackup: (data) => api.post('/admin/backups', data),
  restoreBackup: (backupId, data) => api.post(`/admin/backups/${backupId}/restore`, data)
};