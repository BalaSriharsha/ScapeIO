'use client'

import { useEffect } from 'react'
import { useClerk } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'

export default function SSOCallback() {
  const { handleRedirectCallback } = useClerk()

  useEffect(() => {
    handleRedirectCallback()
  }, [handleRedirectCallback])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF4E3]">
      <div className="text-center">
        <Loader2 className="animate-spin text-primary mx-auto mb-4" size={48} />
        <h2 className="text-2xl font-bold text-primary mb-2">Completing sign in...</h2>
        <p className="text-primary/70">Please wait while we redirect you</p>
      </div>
    </div>
  )
}

