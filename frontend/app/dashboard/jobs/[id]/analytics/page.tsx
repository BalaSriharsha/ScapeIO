'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { analyticsAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { ArrowLeft, BarChart3, Clock, Users, HardDrive, MessageSquare, TrendingUp, Loader2 } from 'lucide-react'

interface Analytics {
  total_interactions: number
  unique_users: number
  avg_response_time_ms: number
  embedding_storage_mb: number
  total_content_mb: number
  top_questions: Array<{ question: string; count: number }>
  interactions_over_time: Array<{ date: string; count: number }>
}

export default function JobAnalyticsPage() {
  const params = useParams()
  const jobId = parseInt(params.id as string)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [jobId])

  const fetchAnalytics = async () => {
    try {
      const response = await analyticsAPI.getJobAnalytics(jobId)
      setAnalytics(response.data)
    } catch (error: any) {
      toast.error('Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    )
  }

  const maxInteractions = Math.max(...analytics.interactions_over_time.map(d => d.count), 1)

  return (
    <div className="min-h-screen bg-[#FDF4E3]">
      <header className="bg-gradient-to-r from-primary to-secondary text-white py-4 px-6">
        <div className="container mx-auto">
          <Link href={`/dashboard/jobs/${jobId}`} className="flex items-center gap-2 hover:text-accent transition">
            <ArrowLeft size={20} />
            Back to Job Details
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 size={32} className="text-primary" />
          <h1 className="text-3xl font-bold text-primary">Job Analytics</h1>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-primary">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="text-primary" size={24} />
              <span className="text-3xl font-bold text-primary">
                {analytics.total_interactions}
              </span>
            </div>
            <p className="text-sm text-primary/70">Total Interactions</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-primary">
            <div className="flex items-center justify-between mb-2">
              <Users className="text-primary" size={24} />
              <span className="text-3xl font-bold text-primary">
                {analytics.unique_users}
              </span>
            </div>
            <p className="text-sm text-primary/70">Unique Users</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-primary">
            <div className="flex items-center justify-between mb-2">
              <Clock className="text-primary" size={24} />
              <span className="text-3xl font-bold text-primary">
                {analytics.avg_response_time_ms.toFixed(0)}ms
              </span>
            </div>
            <p className="text-sm text-primary/70">Avg Response Time</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-primary">
            <div className="flex items-center justify-between mb-2">
              <HardDrive className="text-primary" size={24} />
              <span className="text-3xl font-bold text-primary">
                {(analytics.embedding_storage_mb + analytics.total_content_mb).toFixed(2)}MB
              </span>
            </div>
            <p className="text-sm text-primary/70">Total Storage</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-primary">
            <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
              <TrendingUp size={20} />
              Interactions Over Time (Last 7 Days)
            </h2>
            {analytics.interactions_over_time.length > 0 ? (
              <div className="space-y-3">
                {analytics.interactions_over_time.map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-primary/70">
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                      <span className="font-semibold text-primary">{item.count}</span>
                    </div>
                    <div className="w-full bg-primary/10 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                        style={{ width: `${(item.count / maxInteractions) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-primary/50 text-center py-8">No interaction data yet</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-primary">
            <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
              <MessageSquare size={20} />
              Top Questions
            </h2>
            {analytics.top_questions.length > 0 ? (
              <div className="space-y-4">
                {analytics.top_questions.slice(0, 10).map((q, index) => (
                  <div key={index} className="border-b border-primary/10 pb-3 last:border-0">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-primary/80 text-sm flex-1">{q.question}</p>
                      <span className="bg-accent/20 text-primary font-semibold px-2 py-1 rounded text-xs">
                        {q.count}x
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-primary/50 text-center py-8">No questions asked yet</p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-primary">
            <h2 className="text-xl font-bold text-primary mb-4">Storage Breakdown</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-primary/70">Embeddings</span>
                  <span className="font-semibold text-primary">
                    {analytics.embedding_storage_mb.toFixed(2)} MB
                  </span>
                </div>
                <div className="w-full bg-primary/10 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${
                        (analytics.embedding_storage_mb /
                          (analytics.embedding_storage_mb + analytics.total_content_mb)) *
                        100
                      }%`
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-primary/70">Content</span>
                  <span className="font-semibold text-primary">
                    {analytics.total_content_mb.toFixed(2)} MB
                  </span>
                </div>
                <div className="w-full bg-primary/10 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-secondary"
                    style={{
                      width: `${
                        (analytics.total_content_mb /
                          (analytics.embedding_storage_mb + analytics.total_content_mb)) *
                        100
                      }%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-primary">
            <h2 className="text-xl font-bold text-primary mb-4">Performance Insights</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div className="flex-1">
                  <p className="text-sm text-primary/70">Response Quality</p>
                  <p className="font-semibold text-primary">
                    {analytics.total_interactions > 0 ? 'Good' : 'Not enough data'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <div className="flex-1">
                  <p className="text-sm text-primary/70">User Engagement</p>
                  <p className="font-semibold text-primary">
                    {analytics.unique_users > 0 ? 'Active' : 'Starting'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="flex-1">
                  <p className="text-sm text-primary/70">API Performance</p>
                  <p className="font-semibold text-primary">
                    {analytics.avg_response_time_ms < 2000 ? 'Fast' : 'Normal'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

