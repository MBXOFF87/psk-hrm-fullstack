import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 30000,
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (data) => api.post('/auth/login', data);
export const logout = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');
export const changePassword = (data) => api.post('/auth/change-password', data);

// Staff
export const getStaff = () => api.get('/staff');
export const getStaffMember = (id) => api.get(`/staff/${id}`);
export const createStaff = (data) => api.post('/staff', data);
export const updateStaff = (id, data) => api.put(`/staff/${id}`, data);
export const deleteStaff = (id) => api.delete(`/staff/${id}`);
export const uploadPhoto = (id, formData) => api.post(`/staff/${id}/photo`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Loans
export const getLoans = () => api.get('/loans');
export const createLoan = (data) => api.post('/loans', data);
export const updateLoan = (id, data) => api.put(`/loans/${id}`, data);
export const deleteLoan = (id) => api.delete(`/loans/${id}`);

// Payroll
export const getPayroll = () => api.get('/payroll');
export const getPayrollPeriod = (period) => api.get(`/payroll/${period}`);
export const runPayroll = (data) => api.post('/payroll/run', data);
export const lockPayroll = (period) => api.post(`/payroll/${period}/lock`);

// Attendance
export const getAttendance = (period) => api.get(`/attendance/${period}`);
export const saveAttendanceBulk = (data) => api.post('/attendance/bulk', data);

// Users
export const getUsers = () => api.get('/users');
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);

// Audit
export const getAuditLog = () => api.get('/audit');

// Analytics
export const getAnalytics = () => api.get('/analytics/summary');

// Backup
export const exportBackup = () => window.open('/api/backup/export', '_blank');

export default api;
