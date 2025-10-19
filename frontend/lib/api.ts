import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post('/api/auth/register', data),
  
  login: (username: string, password: string) => {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)
    return api.post('/api/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  
  getMe: () => api.get('/api/auth/me'),
}

export const scraperAPI = {
  createJob: (data: { 
    website_url: string; 
    job_name: string; 
    depth?: number;
    auth_credentials?: any;
  }) =>
    api.post('/api/scraper/jobs', data),
  
  getJobs: () => api.get('/api/scraper/jobs'),
  
  getJob: (id: number) => api.get(`/api/scraper/jobs/${id}`),
  
  getJobPages: (id: number) => api.get(`/api/scraper/jobs/${id}/pages`),
  
  deleteJob: (id: number) => api.delete(`/api/scraper/jobs/${id}`),
}

export const chatbotAPI = {
  getEmbedCode: (jobId: number) =>
    api.post('/api/chatbot/embed', { job_id: jobId }),
  
  chat: (data: { job_id: number; message: string; conversation_history: any[] }) =>
    api.post('/api/chatbot/chat', data),
}

export const profileAPI = {
  getProfile: () => api.get('/api/profile'),
  
  updateProfile: (data: {
    full_name?: string;
    company?: string;
    phone?: string;
    avatar_url?: string;
    preferences?: any;
  }) => api.put('/api/profile', data),
  
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.put('/api/profile/password', data),
}

export const subscriptionAPI = {
  getPlans: () => api.get('/api/subscription/plans'),
  
  subscribe: (planId: number) => api.post(`/api/subscription/subscribe/${planId}`),
  
  contactEnterprise: (data: {
    name: string;
    email: string;
    company: string;
    message: string;
  }) => api.post('/api/subscription/contact-enterprise', data),
}

export const analyticsAPI = {
  getJobAnalytics: (jobId: number) => api.get(`/api/analytics/jobs/${jobId}/analytics`),
  
  getUserAnalytics: () => api.get('/api/analytics/user/analytics'),
}

