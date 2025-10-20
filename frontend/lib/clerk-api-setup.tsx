'use client'

import { useAuth } from '@clerk/nextjs'
import { useEffect } from 'react'
import { setClerkTokenGetter } from './api'

export function ClerkAPISetup({ children }: { children: React.ReactNode }) {
  const { getToken, isLoaded } = useAuth()

  useEffect(() => {
    if (isLoaded) {
      setClerkTokenGetter(async () => {
        try {
          const token = await getToken()
          return token
        } catch (error) {
          console.error('Error getting Clerk token:', error)
          return null
        }
      })
    }
  }, [getToken, isLoaded])

  return <>{children}</>
}

