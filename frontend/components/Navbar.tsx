'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useUser, useClerk } from '@clerk/nextjs'
import { User, ChevronDown, LogOut, Settings } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isSignedIn } = useUser()
  const { signOut } = useClerk()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await signOut()
    setDropdownOpen(false)
    router.push('/')
  }

  // Don't show navbar on auth pages
  if (pathname?.startsWith('/auth/')) {
    return null
  }

  return (
    <nav className="bg-gradient-to-r from-[#134686] to-[#ED3F27] text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link href={isSignedIn ? '/dashboard' : '/'} className="text-2xl font-bold hover:text-[#FEB21A] transition">
            Vittas
          </Link>

        <div className="flex items-center gap-6">
          {isSignedIn ? (
            <>
              <Link href="/dashboard" className="hover:text-[#FEB21A] transition">
                Dashboard
              </Link>
                
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 hover:text-[#FEB21A] transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <User size={18} />
                    </div>
                    <span className="text-sm">{user?.username || user?.firstName}</span>
                    <ChevronDown size={16} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border-2 border-[#134686]/20 overflow-hidden">
                      <div className="px-4 py-3 border-b border-[#134686]/10">
                        <p className="text-sm font-medium text-[#134686]">{user?.username || user?.firstName}</p>
                        <p className="text-xs text-[#134686]/60">{user?.primaryEmailAddress?.emailAddress}</p>
                      </div>
                      
                      <Link
                        href="/dashboard/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-[#134686] hover:bg-[#FDF4E3] transition"
                      >
                        <Settings size={18} />
                        <span>Profile & Subscription</span>
                      </Link>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[#ED3F27] hover:bg-[#FDF4E3] transition"
                      >
                        <LogOut size={18} />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/pricing" className="hover:text-[#FEB21A] transition">
                  Pricing
                </Link>
                <Link
                  href="/auth/register"
                  className="px-6 py-2 bg-[#FEB21A] text-[#134686] rounded-lg hover:bg-[#FDF4E3] transition font-semibold"
                >
                  Get Started
                </Link>
                <Link
                  href="/auth/login"
                  className="px-6 py-2 border-2 border-white rounded-lg hover:bg-white hover:text-[#134686] transition"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

