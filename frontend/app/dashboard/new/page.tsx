'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { scraperAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Globe } from 'lucide-react'
import Link from 'next/link'

interface JobForm {
  website_url: string
  job_name: string
  depth: number
  auth_username?: string
  auth_password?: string
  auth_custom_fields?: string
}

export default function NewJobPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [customFields, setCustomFields] = useState<{name: string, value: string}[]>([])
  const [mounted, setMounted] = useState(false)
  const { register, handleSubmit, formState: { errors }, watch } = useForm<JobForm>({
    defaultValues: {
      depth: 2
    }
  })

  // Check authentication on mount
  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }
    }
  }, [router])

  const onSubmit = async (data: JobForm) => {
    setLoading(true)
    try {
      // Build auth_credentials if authentication fields are filled
      let auth_credentials = null
      if (showAuth && (data.auth_username || data.auth_password || customFields.length > 0)) {
        auth_credentials = {}
        if (data.auth_username) auth_credentials.username = data.auth_username
        if (data.auth_password) auth_credentials.password = data.auth_password
        
        // Add custom fields
        customFields.forEach(field => {
          if (field.name && field.value) {
            auth_credentials[field.name] = field.value
          }
        })
      }
      
      await scraperAPI.createJob({
        website_url: data.website_url,
        job_name: data.job_name,
        depth: data.depth,
        auth_credentials
      })
      toast.success('Job created successfully! Scraping will begin shortly.')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create job')
    } finally {
      setLoading(false)
    }
  }
  
  const addCustomField = () => {
    setCustomFields([...customFields, { name: '', value: '' }])
  }
  
  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index))
  }
  
  const updateCustomField = (index: number, field: 'name' | 'value', value: string) => {
    const updated = [...customFields]
    updated[index][field] = value
    setCustomFields(updated)
  }
  
  const depthValue = watch('depth', 2)

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDF4E3]">
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Globe size={64} className="mx-auto text-primary mb-4" />
            <h1 className="text-4xl font-bold text-primary mb-2">Create Scraping Job</h1>
            <p className="text-primary/70">Enter a website URL to scrape and create a chatbot</p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-primary">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Job Name
                </label>
                <input
                  type="text"
                  {...register('job_name', { required: 'Job name is required' })}
                  className="w-full px-4 py-2 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                  placeholder="My Website Chatbot"
                />
                {errors.job_name && (
                  <p className="text-secondary text-sm mt-1">{errors.job_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  {...register('website_url', { 
                    required: 'Website URL is required',
                    pattern: {
                      value: /^https?:\/\/.+/,
                      message: 'Please enter a valid URL starting with http:// or https://'
                    }
                  })}
                  className="w-full px-4 py-2 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                  placeholder="https://example.com"
                />
                {errors.website_url && (
                  <p className="text-secondary text-sm mt-1">{errors.website_url.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Scraping Depth: {depthValue}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  {...register('depth', { 
                    valueAsNumber: true,
                    required: true
                  })}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-primary/60 mt-1">
                  <span>Depth 1 (Main page only)</span>
                  <span>Depth 5 (Deep crawl)</span>
                </div>
                <p className="text-sm text-primary/60 mt-2">
                  Controls how many levels of links to follow. Higher depth = more pages scraped (up to 50 pages max)
                </p>
              </div>

              <div className="border-2 border-primary/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-primary">
                    Authentication (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAuth(!showAuth)}
                    className="text-sm text-secondary hover:underline"
                  >
                    {showAuth ? 'Hide' : 'Show'}
                  </button>
                </div>
                
                {showAuth && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-primary/70 mb-1">
                        Username / Email
                      </label>
                      <input
                        type="text"
                        {...register('auth_username')}
                        className="w-full px-3 py-2 border border-primary/30 rounded focus:outline-none focus:ring-1 focus:ring-secondary"
                        placeholder="username or email"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-primary/70 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        {...register('auth_password')}
                        className="w-full px-3 py-2 border border-primary/30 rounded focus:outline-none focus:ring-1 focus:ring-secondary"
                        placeholder="password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-primary/70 mb-2">
                        Additional Fields
                      </label>
                      {customFields.map((field, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => updateCustomField(index, 'name', e.target.value)}
                            className="flex-1 px-3 py-2 border border-primary/30 rounded focus:outline-none focus:ring-1 focus:ring-secondary"
                            placeholder="Field name"
                          />
                          <input
                            type="text"
                            value={field.value}
                            onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                            className="flex-1 px-3 py-2 border border-primary/30 rounded focus:outline-none focus:ring-1 focus:ring-secondary"
                            placeholder="Field value"
                          />
                          <button
                            type="button"
                            onClick={() => removeCustomField(index)}
                            className="px-3 py-2 bg-secondary text-white rounded hover:bg-secondary/90"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addCustomField}
                        className="text-sm text-secondary hover:underline"
                      >
                        + Add Field
                      </button>
                    </div>

                    <p className="text-xs text-primary/60">
                      Credentials are encrypted and used only for this scraping job
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-lg font-semibold hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Job...' : 'Create Job'}
              </button>
            </form>
          </div>

          <div className="mt-8 bg-accent/10 p-6 rounded-lg border-2 border-accent">
            <h3 className="font-bold text-primary mb-2">What happens next?</h3>
            <ul className="space-y-2 text-primary/70 text-sm">
              <li>• The system will crawl the website up to the selected depth</li>
              <li>• Links are prioritized (header, footer, main content first)</li>
              <li>• If authentication is provided, the scraper will log in first</li>
              <li>• Content will be processed and stored as vector embeddings</li>
              <li>• Once complete, you can generate an embed code for your chatbot</li>
              <li>• The chatbot will answer questions based on all scraped content</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}

