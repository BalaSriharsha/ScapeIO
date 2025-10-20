import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import { ClerkProvider } from '@clerk/nextjs'
import { ClerkAPISetup } from '@/lib/clerk-api-setup'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vittas - AI-Powered Web Scraping & RAG Chatbots',
  description: 'Create intelligent chatbots from any website with AI-powered scraping and RAG technology',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <ClerkAPISetup>
            <Navbar />
            {children}
            <Toaster position="top-right" />
          </ClerkAPISetup>
        </body>
      </html>
    </ClerkProvider>
  )
}

