'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { profileAPI, scraperAPI, analyticsAPI, subscriptionAPI, getErrorMessage } from '@/lib/api'
import toast from 'react-hot-toast'
import { ArrowLeft, User as UserIcon, Lock, BarChart3, Loader2, Crown } from 'lucide-react'

interface UserProfile {
  id: number
  email: string
  username: string
  full_name: string | null
  company: string | null
  phone: string | null
  avatar_url: string | null
  subscription_plan_id: number | null
  subscription_status: string | null
  created_at: string
}

interface UserStats {
  total_jobs: number
  total_storage_mb: number
}

interface Plan {
  id: number
  name: string
  display_name: string
  price_monthly: number
  price_yearly: number
  max_jobs: number
  max_pages_per_job: number
  max_storage_mb: number
  features: string[]
  is_active: boolean
}

export default function ProfilePage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showPlans, setShowPlans] = useState(false)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/')
    }
  }, [isLoaded, isSignedIn, router])
  
  const [profileData, setProfileData] = useState({
    full_name: '',
    company: '',
    phone: '',
  })
  
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  useEffect(() => {
    fetchProfile()
    fetchStats()
    fetchPlans()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await profileAPI.getProfile()
      setProfile(response.data)
      setProfileData({
        full_name: response.data.full_name || '',
        company: response.data.company || '',
        phone: response.data.phone || '',
      })
    } catch (error: any) {
      toast.error('Failed to fetch profile')
      if (error.response?.status === 401) {
        router.push('/auth/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await analyticsAPI.getUserAnalytics()
      setStats({
        total_jobs: response.data.total_jobs,
        total_storage_mb: response.data.total_storage_mb
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await subscriptionAPI.getPlans()
      setPlans(response.data)
      
      // Find current plan
      if (profile?.subscription_plan_id) {
        const current = response.data.find((p: Plan) => p.id === profile.subscription_plan_id)
        setCurrentPlan(current || null)
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error)
    }
  }

  const handleChangePlan = async (planId: number) => {
    try {
      await subscriptionAPI.subscribe(planId)
      toast.success('Subscription plan updated successfully!')
      setShowPlans(false)
      fetchProfile()
      fetchPlans()
    } catch (error: any) {
      toast.error(getErrorMessage(error) || 'Failed to update plan')
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    try {
      await profileAPI.updateProfile(profileData)
      toast.success('Profile updated successfully!')
      fetchProfile()
    } catch (error: any) {
      toast.error(getErrorMessage(error) || 'Failed to update profile')
    } finally {
      setUpdating(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match')
      return
    }
    
    if (passwordData.new_password.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    
    setUpdating(true)
    try {
      await profileAPI.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      })
      toast.success('Password changed successfully!')
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
    } catch (error: any) {
      toast.error(getErrorMessage(error) || 'Failed to change password')
    } finally {
      setUpdating(false)
    }
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDF4E3]">
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg border-2 border-primary p-8 mb-8">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <UserIcon size={48} className="text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-primary">{profile.username}</h2>
                <p className="text-primary/70">{profile.email}</p>
                <p className="text-sm text-primary/50">
                  Member since {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {stats && (
              <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-accent/10 rounded-lg">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{stats.total_jobs}</p>
                  <p className="text-sm text-primary/70">Total Jobs</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    {stats.total_storage_mb.toFixed(2)}
                  </p>
                  <p className="text-sm text-primary/70">Storage (MB)</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary capitalize">
                    {profile.subscription_status || 'Active'}
                  </p>
                  <p className="text-sm text-primary/70">Status</p>
                </div>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                <UserIcon size={20} />
                Personal Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                  placeholder="John Doe"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    value={profileData.company}
                    onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                    placeholder="Acme Inc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold hover:scale-105 transition disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-lg border-2 border-primary p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                <Crown size={20} />
                Subscription Plan
              </h3>
              <button
                onClick={() => setShowPlans(!showPlans)}
                className="px-4 py-2 bg-[#FEB21A] text-[#134686] rounded-lg font-semibold hover:bg-[#FDF4E3] transition"
              >
                {showPlans ? 'Hide Plans' : 'Change Plan'}
              </button>
            </div>

            {currentPlan ? (
              <div className="bg-primary/5 p-4 rounded-lg mb-4">
                <p className="text-sm text-primary/70 mb-1">Current Plan</p>
                <p className="text-2xl font-bold text-primary">{currentPlan.display_name}</p>
                <p className="text-primary/70 mt-2">
                  {Number(currentPlan.price_monthly) === 0 
                    ? 'Free forever' 
                    : `$${Number(currentPlan.price_monthly)}/month`
                  }
                </p>
              </div>
            ) : (
              <p className="text-primary/70">Loading plan information...</p>
            )}

            {showPlans && (
              <div className="space-y-4 mt-6">
                <p className="text-sm text-primary/70 mb-4">
                  Select a new plan to upgrade or downgrade your subscription:
                </p>
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`border-2 rounded-lg p-4 transition ${
                      plan.id === profile?.subscription_plan_id
                        ? 'border-primary bg-primary/5'
                        : 'border-primary/20 hover:border-primary/40'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-bold text-primary">{plan.display_name}</h4>
                        <p className="text-primary/70 mb-2">
                          {Number(plan.price_monthly) === 0 
                            ? 'Free' 
                            : `$${Number(plan.price_monthly)}/month`
                          }
                        </p>
                        <ul className="text-sm text-primary/70 space-y-1">
                          {plan.features.slice(0, 3).map((feature, idx) => (
                            <li key={idx}>• {feature}</li>
                          ))}
                        </ul>
                      </div>
                      {plan.id !== profile?.subscription_plan_id && (
                        <button
                          onClick={() => handleChangePlan(plan.id)}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm font-semibold"
                        >
                          {plan.name === 'enterprise' ? 'Contact Sales' : 'Select Plan'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-lg border-2 border-primary p-8">
            <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
              <Lock size={20} />
              Change Password
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                  required
                  minLength={6}
                />
                <p className="text-xs text-primary/60 mt-1">
                  Must be at least 6 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2 bg-secondary text-white rounded-lg font-semibold hover:bg-secondary-dark transition disabled:opacity-50"
                >
                  {updating ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

