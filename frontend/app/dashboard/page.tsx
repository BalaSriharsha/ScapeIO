'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { scraperAPI, authAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, LogOut, Loader2, Globe, CheckCircle, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'

interface Job {
  id: number
  website_url: string
  job_name: string
  status: string
  created_at: string
  completed_at: string | null
  error_message: string | null
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, setAuth, clearAuth, isAuthenticated } = useAuthStore()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      try {
        const response = await authAPI.getMe()
        setAuth(response.data, token)
      } catch (error) {
        clearAuth()
        router.push('/auth/login')
      }
    }

    if (!isAuthenticated) {
      initAuth()
    }
  }, [isAuthenticated, router, setAuth, clearAuth])

  useEffect(() => {
    if (isAuthenticated) {
      loadJobs()
    }
  }, [isAuthenticated])

  const loadJobs = async () => {
    try {
      const response = await scraperAPI.getJobs()
      setJobs(response.data)
    } catch (error) {
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    clearAuth()
    router.push('/')
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this job?')) return

    try {
      await scraperAPI.deleteJob(id)
      toast.success('Job deleted')
      loadJobs()
    } catch (error) {
      toast.error('Failed to delete job')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-600" size={20} />
      case 'failed':
        return <XCircle className="text-secondary" size={20} />
      case 'discovering':
      case 'scraping':
      case 'processing':
        return <Loader2 className="text-accent animate-spin" size={20} />
      default:
        return <Clock className="text-primary" size={20} />
    }
  }

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDF4E3]">
      <main className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-primary">Your Scraping Jobs</h2>
          <Link
            href="/dashboard/new"
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg hover:scale-105 transition"
          >
            <Plus size={20} />
            New Job
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-lg border-2 border-primary text-center">
            <Globe size={64} className="mx-auto text-primary/30 mb-4" />
            <h3 className="text-xl font-bold text-primary mb-2">No scraping jobs yet</h3>
            <p className="text-primary/70 mb-6">Create your first job to get started</p>
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg hover:scale-105 transition"
            >
              <Plus size={20} />
              Create Job
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/dashboard/jobs/${job.id}`}
                className="block bg-white p-6 rounded-lg shadow-lg border-2 border-primary hover:border-secondary transition cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-primary">{job.job_name}</h3>
                      {getStatusIcon(job.status)}
                      <span className="text-sm font-medium text-primary/70 capitalize">
                        {job.status}
                      </span>
                    </div>
                    <p className="text-primary/70 mb-2">{job.website_url}</p>
                    <p className="text-sm text-primary/50">
                      Created: {new Date(job.created_at).toLocaleString()}
                    </p>
                    {job.error_message && (
                      <p className="text-sm text-secondary mt-2">Error: {job.error_message}</p>
                    )}
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    {job.status === 'completed' && (
                      <Link
                        href={`/dashboard/embed/${job.id}`}
                        className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition"
                      >
                        Get Embed Code
                      </Link>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        handleDelete(job.id)
                      }}
                      className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

