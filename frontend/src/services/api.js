import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

let clerkGetToken = null;

export const setGetToken = (fn) => {
  clerkGetToken = fn;
};

// Request interceptor to automatically attach a fresh Clerk token before every API call
API.interceptors.request.use(
  async (config) => {
    if (clerkGetToken) {
      try {
        const token = await clerkGetToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.error("Failed to fetch fresh Clerk token in interceptor", err);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Income API calls
export const incomeAPI = {
  getAll: (search = '', month = '') => 
    API.get(`/incomes?search=${encodeURIComponent(search)}&month=${month}`),
  create: (data) => API.post('/incomes', data),
  update: (id, data) => API.put(`/incomes/${id}`, data),
  delete: (id) => API.delete(`/incomes/${id}`)
};

// Income Source API calls
export const incomeSourceAPI = {
  getAll: () => API.get('/income-sources'),
  create: (data) => API.post('/income-sources', data),
  delete: (id) => API.delete(`/income-sources/${id}`)
};

// Expense API calls
export const expenseAPI = {
  getAll: (search = '', category = '', month = '') => 
    API.get(`/expenses?search=${encodeURIComponent(search)}&category=${category}&month=${month}`),
  create: (data) => API.post('/expenses', data),
  update: (id, data) => API.put(`/expenses/${id}`, data),
  delete: (id) => API.delete(`/expenses/${id}`)
};

// Budget API calls
export const budgetAPI = {
  getAll: (month = '', year = '') => 
    API.get(`/budgets?month=${month}&year=${year}`),
  upsert: (data) => API.post('/budgets', data),
  getMonthlyStatus: (month, year) => 
    API.get(`/budgets/monthly-status?month=${month}&year=${year}`)
};

// Reports API calls
export const reportAPI = {
  getOverview: () => API.get('/reports/overview'),
  getRecentTransactions: () => API.get('/reports/recent-transactions'),
  getTransactions: (search = '', month = '', category = '', type = '') =>
    API.get('/reports/transactions', { params: { search, month, category, type } }),
  getChartData: () => API.get('/reports/chart-data'),
  getMonthlyDetails: (month) => API.get(`/reports/monthly?month=${month}`)
};

export default API;
