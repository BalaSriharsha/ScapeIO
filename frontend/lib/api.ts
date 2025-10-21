import axios from 'axios'
import React from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Helper function to safely extract error messages
export const getErrorMessage = (error: any): string => {
  // If it's already a string, return it
  if (typeof error === 'string') return error
  
  // Check for axios error response
  if (error?.response?.data?.detail) {
    const detail = error.response.data.detail
    if (typeof detail === 'string') return detail
    
    // Handle array of validation errors
    if (Array.isArray(detail)) {
      return detail.map((err: any) => {
        if (typeof err === 'string') return err
        if (typeof err === 'object' && err.msg) {
          const location = err.loc ? err.loc.join(' -> ') : ''
          return location ? `${location}: ${err.msg}` : err.msg
        }
        return JSON.stringify(err)
      }).join('; ')
    }
    
    // Handle single error object
    if (typeof detail === 'object' && detail.msg) {
      return detail.msg
    }
  }
  
  // Check for error message property
  if (error?.message && typeof error.message === 'string') {
    return error.message
  }
  
  // Fallback
  return 'An unexpected error occurred'
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Function to get Clerk token - will be called by axios interceptor
let getClerkToken: (() => Promise<string | null>) | null = null

export const setClerkTokenGetter = (getter: () => Promise<string | null>) => {
  getClerkToken = getter
}

api.interceptors.request.use(async (config) => {
  if (getClerkToken) {
    try {
      const token = await getClerkToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (error) {
      console.error('Failed to get Clerk token:', error)
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 errors by redirecting to login
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'
      }
    }
    
    // Format error messages properly for display
    if (error.response?.data) {
      const detail = error.response.data.detail
      
      // Handle Pydantic validation errors (array of error objects)
      if (Array.isArray(detail)) {
        const messages = detail.map((err: any) => {
          if (typeof err === 'object' && err.msg) {
            const location = err.loc ? err.loc.join(' -> ') : ''
            return location ? `${location}: ${err.msg}` : err.msg
          }
          return String(err)
        })
        error.response.data.detail = messages.join('; ')
      }
      // Handle object error with nested structure
      else if (typeof detail === 'object' && detail !== null && !React.isValidElement(detail)) {
        if (detail.msg) {
          error.response.data.detail = detail.msg
        } else {
          error.response.data.detail = JSON.stringify(detail)
        }
      }
    }
    
    return Promise.reject(error)
  }
)

// Auth is now handled by Clerk - these endpoints are kept for backward compatibility
// but should not be used in the frontend anymore
export const authAPI = {
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

