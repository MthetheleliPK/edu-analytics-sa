import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (school, user) => api.post('/auth/register', { school, user }),
  getProfile: () => api.get('/auth/profile'),
};

export const studentService = {
  getAll: (params) => api.get('/students', { params }),
  create: (data) => api.post('/students', data),
  createBulk: (data) => api.post('/students/bulk', data),
};

export const analyticsService = {
  getClassPerformance: (params) => api.get('/analytics/class-performance', { params }),
  getStudentProgress: (params) => api.get('/analytics/student-progress', { params }),
  getAtRiskStudents: (params) => api.get('/analytics/at-risk-students', { params }),
  getSchoolOverview: () => api.get('/analytics/school-overview'),
};

export const gradesService = {
  getGrades: () => api.get('/grades'),
  getClasses: (params) => api.get('/grades/classes', { params }),
};

export const assessmentService = {
  getAssessments: (params) => api.get('/assessments', { params }),
  createAssessment: (data) => api.post('/assessments', data),
  enterMarks: (assessmentId, data) => api.post(`/assessments/${assessmentId}/marks`, data),
};

export const schoolService = {
  getProfile: () => api.get('/schools/profile'),
  updateProfile: (data) => api.put('/schools/profile', data),
  updateSettings: (data) => api.put('/schools/settings', data),
  getUsers: (params) => api.get('/schools/users', { params }),
  createUser: (data) => api.post('/schools/users', data),
  updateUser: (userId, data) => api.put(`/schools/users/${userId}`, data),
  getClasses: (params) => api.get('/schools/classes', { params }),
  getStatistics: () => api.get('/schools/statistics'),
  getParentRequests: () => api.get('/schools/parent-requests'),
  verifyParent: (parentId, data) => api.put(`/schools/parent-requests/${parentId}/verify`, data)
};

// ADD THE MISSING SERVICES HERE:

export const adminService = {
  getStats: (params) => api.get('/admin/stats', { params }),
  getRecentActivity: () => api.get('/admin/activity'),
  getSystemHealth: () => api.get('/admin/health'),
};

export const teacherService = {
  getDashboard: () => api.get('/teacher/dashboard'),
  getClasses: () => api.get('/teacher/classes'),
  getAssessments: (params) => api.get('/teacher/assessments', { params }),
  getStudents: (classId) => api.get(`/teacher/classes/${classId}/students`),
};

export const parentService = {
  getDashboard: () => api.get('/parent/dashboard'),
  getStudents: () => api.get('/parent/students'),
  getStudentProgress: (studentId) => api.get(`/parent/students/${studentId}/progress`),
};

export const principalService = {
  getDashboard: () => api.get('/principal/dashboard'),
  getSchoolStats: () => api.get('/principal/stats'),
  getTeacherPerformance: () => api.get('/principal/teacher-performance'),
};

export const hodService = {
  getDashboard: () => api.get('/hod/dashboard'),
  getDepartmentStats: () => api.get('/hod/stats'),
  getSubjectPerformance: () => api.get('/hod/subject-performance'),
};

export default api;