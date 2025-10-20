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

// Track if we've already shown a logout notification to avoid spam
let isLoggingOut = false

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only auto-logout on 401 if it's not during an active user session
    // This prevents automatic logouts due to token expiration
    if (error.response?.status === 401 && !isLoggingOut) {
      // Check if this is a token expiration or actual unauthorized access
      const token = localStorage.getItem('token')
      
      // If there's a token but it's expired, don't auto-logout
      // The user should only be logged out when they explicitly logout
      if (token && error.response?.data?.detail?.includes('expired')) {
        console.warn('Token expired, but user session maintained')
        return Promise.reject(error)
      }
      
      // Only auto-logout for actual unauthorized access (no token, invalid token, etc.)
      // And not for expired tokens
      if (!token || error.response?.data?.detail?.includes('Invalid')) {
        if (typeof window !== 'undefined' && !isLoggingOut) {
          isLoggingOut = true
          localStorage.removeItem('token')
          window.location.href = '/auth/login'
        }
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
  
  exportJobMarkdown: (id: number) => 
    api.get(`/api/scraper/jobs/${id}/export/markdown`, {
      responseType: 'blob'
    }),
  
  exportPageMarkdown: (jobId: number, pageId: number) =>
    api.get(`/api/scraper/jobs/${jobId}/pages/${pageId}/export/markdown`, {
      responseType: 'blob'
    }),
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

