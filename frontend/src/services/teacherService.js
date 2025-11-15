import api from './api';

export const teacherService = {
  getDashboard: () => api.get('/teachers/dashboard'),
  getMyClasses: () => api.get('/teachers/my-classes'),
  getClassStudents: (classId) => api.get(`/teachers/classes/${classId}/students`),
  getAssessments: (params) => api.get('/teachers/assessments', { params }),
  getAssessmentMarks: (assessmentId) => api.get(`/teachers/assessments/${assessmentId}/marks`),
  enterBulkMarks: (assessmentId, data) => api.post(`/teachers/assessments/${assessmentId}/marks/bulk`, data),
  getClassPerformance: (params) => api.get('/teachers/analytics/class-performance', { params })
};