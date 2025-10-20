'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import Link from 'next/link'
import { ArrowRight, Zap, Shield, BarChart3, Globe, CheckCircle, Sparkles } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    const token = localStorage.getItem('token')
    if (token && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [mounted, isAuthenticated, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF4E3] via-white to-[#FDF4E3]">
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#FEB21A]/20 px-4 py-2 rounded-full mb-6">
            <Sparkles className="text-[#FEB21A]" size={20} />
            <span className="text-[#134686] font-semibold">AI-Powered Web Scraping</span>
          </div>
          
          <h1 className="text-6xl font-bold text-[#134686] mb-6 leading-tight">
            Turn Any Website Into<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#134686] to-[#ED3F27]">
              An Intelligent Chatbot
            </span>
          </h1>
          
          <p className="text-xl text-[#134686]/70 mb-8 max-w-2xl mx-auto">
            Scrape websites, extract content, and create RAG-powered chatbots that answer questions about your data. No coding required.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/register"
              className="flex items-center gap-2 bg-gradient-to-r from-[#134686] to-[#ED3F27] text-white px-8 py-4 rounded-lg font-semibold text-lg hover:scale-105 transition shadow-lg"
            >
              Get Started Free
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 border-2 border-[#134686] text-[#134686] rounded-lg font-semibold text-lg hover:bg-[#134686] hover:text-white transition"
            >
              View Pricing
            </Link>
          </div>

          <p className="text-sm text-[#134686]/50 mt-4">
            No credit card required • Free plan available • Cancel anytime
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-[#134686] text-center mb-12">
            Everything You Need to Build Smart Chatbots
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-[#134686]/10 hover:border-[#FEB21A] transition">
              <div className="w-14 h-14 rounded-full bg-[#134686]/10 flex items-center justify-center mb-4">
                <Globe className="text-[#134686]" size={28} />
              </div>
              <h3 className="text-xl font-bold text-[#134686] mb-3">Multi-Page Scraping</h3>
              <p className="text-[#134686]/70">
                Automatically discover and scrape entire websites with configurable depth. Handle authentication, infinite scroll, and dynamic content.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-[#134686]/10 hover:border-[#FEB21A] transition">
              <div className="w-14 h-14 rounded-full bg-[#134686]/10 flex items-center justify-center mb-4">
                <Zap className="text-[#134686]" size={28} />
              </div>
              <h3 className="text-xl font-bold text-[#134686] mb-3">RAG-Powered AI</h3>
              <p className="text-[#134686]/70">
                Vector embeddings with Google Gemini for accurate, context-aware responses. Your chatbot knows your content inside out.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-[#134686]/10 hover:border-[#FEB21A] transition">
              <div className="w-14 h-14 rounded-full bg-[#134686]/10 flex items-center justify-center mb-4">
                <BarChart3 className="text-[#134686]" size={28} />
              </div>
              <h3 className="text-xl font-bold text-[#134686] mb-3">Analytics Dashboard</h3>
              <p className="text-[#134686]/70">
                Track interactions, response times, top questions, and user engagement. Make data-driven decisions about your content.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-[#134686]/10 hover:border-[#FEB21A] transition">
              <div className="w-14 h-14 rounded-full bg-[#134686]/10 flex items-center justify-center mb-4">
                <Shield className="text-[#134686]" size={28} />
              </div>
              <h3 className="text-xl font-bold text-[#134686] mb-3">Secure & Private</h3>
              <p className="text-[#134686]/70">
                Encrypted credentials, secure authentication, and isolated data storage. Your scraped content stays private.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-[#134686]/10 hover:border-[#FEB21A] transition">
              <div className="w-14 h-14 rounded-full bg-[#134686]/10 flex items-center justify-center mb-4">
                <CheckCircle className="text-[#134686]" size={28} />
              </div>
              <h3 className="text-xl font-bold text-[#134686] mb-3">Easy Embedding</h3>
              <p className="text-[#134686]/70">
                Copy-paste embed code to add your chatbot to any website. Works with HTML, React, WordPress, and more.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-[#134686]/10 hover:border-[#FEB21A] transition">
              <div className="w-14 h-14 rounded-full bg-[#134686]/10 flex items-center justify-center mb-4">
                <Sparkles className="text-[#134686]" size={28} />
              </div>
              <h3 className="text-xl font-bold text-[#134686] mb-3">Context Awareness</h3>
              <p className="text-[#134686]/70">
                Chatbot remembers conversation history and provides relevant follow-up answers. Natural, human-like interactions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-[#134686] text-center mb-12">
            How It Works
          </h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-[#134686] text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#134686] mb-2">Create a Scraping Job</h3>
                  <p className="text-[#134686]/70">
                    Enter any website URL, set the scraping depth, and optionally provide authentication credentials if needed.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-[#134686] text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#134686] mb-2">AI Scrapes & Processes</h3>
                  <p className="text-[#134686]/70">
                    Our system crawls the website, extracts content, and converts it into vector embeddings for semantic search.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-[#134686] text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#134686] mb-2">Generate Chatbot Code</h3>
                  <p className="text-[#134686]/70">
                    Get an embed code snippet to add your AI chatbot to any website with a single copy-paste.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-[#134686] text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#134686] mb-2">Monitor & Optimize</h3>
                  <p className="text-[#134686]/70">
                    Track analytics, see what users are asking, and improve your chatbot over time with data-driven insights.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#134686] to-[#ED3F27] text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Build Your AI Chatbot?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join hundreds of businesses using Vittas to create intelligent chatbots from their website content.
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 bg-[#FEB21A] text-[#134686] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#FDF4E3] transition shadow-lg"
          >
            Start Free Trial
            <ArrowRight size={20} />
          </Link>
          <p className="text-sm mt-4 opacity-75">
            No credit card required • 5 jobs free forever
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#134686] text-white py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="mb-4">&copy; 2025 Vittas. All rights reserved.</p>
          <div className="flex justify-center gap-6 text-sm opacity-75">
            <Link href="/pricing" className="hover:text-[#FEB21A] transition">
              Pricing
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-[#FEB21A] transition">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-[#FEB21A] transition">
              Privacy Policy
            </Link>
            <span>•</span>
            <a href="mailto:support@vittas.com" className="hover:text-[#FEB21A] transition">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
