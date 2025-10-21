'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { scraperAPI, getErrorMessage } from '@/lib/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Globe, Clock, CheckCircle, XCircle, Loader2, FileText, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Job {
  id: number
  website_url: string
  job_name: string
  status: string
  depth: number
  pages_found: number
  pages_scraped: number
  current_url: string | null
  created_at: string
  completed_at: string | null
  error_message: string | null
}

interface ScrapedPage {
  id: number
  job_id: number
  url: string
  status: string
  depth: number
  content_length: number
  error_message: string | null
  scraped_at: string
}

export default function JobDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { isLoaded, isSignedIn } = useUser()
  const jobId = parseInt(params.id as string)
  const [job, setJob] = useState<Job | null>(null)
  const [pages, setPages] = useState<ScrapedPage[]>([])
  const [loading, setLoading] = useState(true)
  const [showPages, setShowPages] = useState(false)

  const fetchJob = async () => {
    try {
      const response = await scraperAPI.getJob(jobId)
      setJob(response.data)
    } catch (error: any) {
      toast.error(getErrorMessage(error) || 'Failed to fetch job details')
    } finally {
      setLoading(false)
    }
  }

  const fetchPages = async () => {
    try {
      const response = await scraperAPI.getJobPages(jobId)
      setPages(response.data)
    } catch (error: any) {
      console.error('Failed to fetch pages:', error)
    }
  }

  const handleExportMarkdown = async () => {
    try {
      const response = await scraperAPI.exportJobMarkdown(jobId)
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${job?.job_name}_${jobId}.md`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('Markdown file downloaded!')
    } catch (error: any) {
      toast.error(getErrorMessage(error) || 'Failed to export markdown')
    }
  }

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchJob()
      fetchPages()
    }
  }, [isLoaded, isSignedIn, jobId])

  useEffect(() => {
    // Poll for updates every 2 seconds if job is in progress
    if (!job) return

    const interval = setInterval(() => {
      if (job.status === 'discovering' || job.status === 'scraping' || job.status === 'processing') {
        fetchJob()
        fetchPages()
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [job?.status])

  // Clerk authentication check - AFTER all hooks
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    )
  }

  const getPageStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={16} />
      case 'failed':
        return <XCircle className="text-secondary" size={16} />
      case 'skipped':
        return <AlertCircle className="text-yellow-500" size={16} />
      case 'in_progress':
        return <Loader2 className="text-accent animate-spin" size={16} />
      default:
        return <Clock className="text-primary/50" size={16} />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={24} />
      case 'failed':
        return <XCircle className="text-secondary" size={24} />
      case 'discovering':
      case 'scraping':
      case 'processing':
        return <Loader2 className="text-accent animate-spin" size={24} />
      default:
        return <Clock className="text-primary/50" size={24} />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'discovering':
        return 'Discovering Pages...'
      case 'scraping':
        return 'Scraping Pages...'
      case 'processing':
        return 'Processing Content...'
      case 'completed':
        return 'Completed'
      case 'failed':
        return 'Failed'
      default:
        return status
    }
  }

  const getProgressPercentage = () => {
    if (!job) return 0
    if (job.status === 'discovering') return 10
    if (job.status === 'completed') return 100
    if (job.status === 'scraping' || job.status === 'processing') {
      if (job.pages_found === 0) return 10
      const scrapingProgress = Math.round((job.pages_scraped / job.pages_found) * 90)
      return scrapingProgress + 10
    }
    if (job.pages_found === 0) return 0
    return Math.round((job.pages_scraped / job.pages_found) * 90) + 10
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-primary mb-4">Job not found</p>
          <Link href="/dashboard" className="text-secondary hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const progress = getProgressPercentage()

  return (
    <div className="min-h-screen bg-[#FDF4E3]">
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-primary">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <Globe size={48} className="text-primary" />
                <div>
                  <h1 className="text-3xl font-bold text-primary">{job.job_name}</h1>
                  <a
                    href={job.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary hover:underline text-sm"
                  >
                    {job.website_url}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(job.status)}
                <span className="text-lg font-semibold text-primary">{getStatusText(job.status)}</span>
              </div>
            </div>

            {(job.status === 'discovering' || job.status === 'scraping' || job.status === 'processing') && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-primary">Progress</span>
                  <span className="text-sm font-semibold text-primary">{progress}%</span>
                </div>
                <div className="w-full bg-primary/20 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                {job.current_url && (
                  <p className="text-xs text-primary/60 mt-2">
                    Currently scraping: {job.current_url}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-accent/10 p-4 rounded-lg border border-accent/30">
                <p className="text-sm text-primary/70 mb-1">Depth Level</p>
                <p className="text-2xl font-bold text-primary">{job.depth}</p>
              </div>
              <div className="bg-accent/10 p-4 rounded-lg border border-accent/30">
                <p className="text-sm text-primary/70 mb-1">Pages Found</p>
                <p className="text-2xl font-bold text-primary">{job.pages_found}</p>
              </div>
              <div className="bg-accent/10 p-4 rounded-lg border border-accent/30">
                <p className="text-sm text-primary/70 mb-1">Pages Scraped</p>
                <p className="text-2xl font-bold text-primary">
                  {job.pages_scraped}
                  {job.pages_found > 0 && (
                    <span className="text-sm font-normal text-primary/60"> / {job.pages_found}</span>
                  )}
                </p>
              </div>
              <div className="bg-accent/10 p-4 rounded-lg border border-accent/30">
                <p className="text-sm text-primary/70 mb-1">Status</p>
                <p className="text-lg font-semibold text-primary">{getStatusText(job.status)}</p>
              </div>
            </div>

            <div className="border-t border-primary/20 pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-primary/70 mb-1">Created At</p>
                  <p className="text-primary font-medium">
                    {new Date(job.created_at).toLocaleString()}
                  </p>
                </div>
                {job.completed_at && (
                  <div>
                    <p className="text-primary/70 mb-1">Completed At</p>
                    <p className="text-primary font-medium">
                      {new Date(job.completed_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {job.error_message && (
                <div className="mt-4 p-4 bg-secondary/10 border border-secondary rounded-lg">
                  <p className="text-sm font-medium text-secondary mb-1">Error Message</p>
                  <p className="text-sm text-primary/80">{job.error_message}</p>
                </div>
              )}
            </div>
          </div>

          {pages.length > 0 && (
            <div className="mt-6 bg-white p-6 rounded-lg shadow-lg border-2 border-primary">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={24} className="text-primary" />
                  <h2 className="text-2xl font-bold text-primary">Scraped Pages ({pages.length})</h2>
                </div>
                <button
                  onClick={() => setShowPages(!showPages)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                >
                  {showPages ? 'Hide' : 'Show'} Pages
                </button>
              </div>

              {showPages && (
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-primary/10 sticky top-0">
                      <tr>
                        <th className="text-left p-3 text-primary font-semibold">Status</th>
                        <th className="text-left p-3 text-primary font-semibold">URL</th>
                        <th className="text-center p-3 text-primary font-semibold">Depth</th>
                        <th className="text-right p-3 text-primary font-semibold">Content</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pages.map((page) => (
                        <tr key={page.id} className="border-b border-primary/10 hover:bg-accent/5">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {getPageStatusIcon(page.status)}
                              <span className="text-xs capitalize">{page.status}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <a
                              href={page.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-secondary hover:underline truncate block max-w-md"
                              title={page.url}
                            >
                              {page.url}
                            </a>
                            {page.error_message && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-secondary/80">
                                <AlertCircle size={12} />
                                {page.error_message}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-center text-primary/70">{page.depth}</td>
                          <td className="p-3 text-right text-primary/70">
                            {page.content_length > 0 ? (
                              <span>{page.content_length.toLocaleString()} chars</span>
                            ) : (
                              <span className="text-primary/40">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {job.status === 'completed' && (
            <div className="mt-6 flex justify-center gap-4 flex-wrap">
              <button
                onClick={handleExportMarkdown}
                className="px-8 py-3 bg-[#FEB21A] text-[#134686] rounded-lg font-semibold hover:bg-[#FDF4E3] transition flex items-center gap-2"
              >
                📄 Export Markdown
              </button>
              <Link
                href={`/dashboard/jobs/${job.id}/analytics`}
                className="inline-block bg-accent text-[#134686] px-8 py-3 rounded-lg font-semibold hover:scale-105 transition"
              >
                View Analytics
              </Link>
              <Link
                href={`/dashboard/jobs/${job.id}/chatbot`}
                className="inline-block bg-gradient-to-r from-primary to-secondary text-white px-8 py-3 rounded-lg font-semibold hover:scale-105 transition"
              >
                Generate Chatbot Embed Code
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

