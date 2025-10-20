'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { chatbotAPI, scraperAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Copy, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function EmbedCodePage() {
  const params = useParams()
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()
  const jobId = parseInt(params.id as string)
  const [embedCode, setEmbedCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [job, setJob] = useState<any>(null)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/')
      return
    }
    if (isLoaded && isSignedIn) {
      loadEmbedCode()
    }
  }, [isLoaded, isSignedIn, jobId, router])

  const loadEmbedCode = async () => {
    try {
      const jobResponse = await scraperAPI.getJob(jobId)
      setJob(jobResponse.data)

      if (jobResponse.data.status !== 'completed') {
        toast.error('Job is not completed yet')
        router.push('/dashboard')
        return
      }

      const response = await chatbotAPI.getEmbedCode(jobId)
      setEmbedCode(response.data.embed_code)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load embed code')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    toast.success('Code copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-primary to-secondary text-white py-4 px-6">
        <div className="container mx-auto">
          <Link href="/dashboard" className="flex items-center gap-2 hover:text-accent transition">
            <ArrowLeft size={20} />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">Chatbot Embed Code</h1>
            <p className="text-primary/70">Copy and paste this code into your HTML file</p>
            {job && (
              <div className="mt-4 flex items-center gap-2">
                <CheckCircle className="text-green-600" size={20} />
                <span className="text-primary font-medium">{job.job_name}</span>
                <span className="text-primary/50">•</span>
                <span className="text-primary/70">{job.website_url}</span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-lg border-2 border-primary overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-secondary text-white p-4 flex justify-between items-center">
              <span className="font-semibold">HTML Embed Code</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 bg-white text-primary px-4 py-2 rounded-lg hover:bg-cream transition"
              >
                {copied ? (
                  <>
                    <CheckCircle size={16} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy Code
                  </>
                )}
              </button>
            </div>
            <pre className="p-6 overflow-x-auto text-sm bg-gray-50">
              <code>{embedCode}</code>
            </pre>
          </div>

          <div className="mt-8 bg-accent/10 p-6 rounded-lg border-2 border-accent">
            <h3 className="font-bold text-primary mb-4">How to use:</h3>
            <ol className="space-y-2 text-primary/70">
              <li>1. Copy the embed code above</li>
              <li>2. Paste it into your HTML file, preferably before the closing &lt;/body&gt; tag</li>
              <li>3. The chatbot widget will appear in the bottom-right corner of your page</li>
              <li>4. Visitors can click it to ask questions about your website content</li>
            </ol>
          </div>

          <div className="mt-8 bg-white p-6 rounded-lg shadow-lg border-2 border-primary">
            <h3 className="font-bold text-primary mb-4">Example usage:</h3>
            <pre className="p-4 bg-gray-50 rounded text-sm overflow-x-auto">
              <code>{`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website</title>
</head>
<body>
    <h1>Welcome to my website</h1>
    
    <!-- Your embed code goes here -->
    ${embedCode.split('\n').slice(0, 3).join('\n')}
    ...
    
</body>
</html>`}</code>
            </pre>
          </div>
        </div>
      </main>
    </div>
  )
}

