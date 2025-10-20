'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'
import { LogIn } from 'lucide-react'

interface LoginForm {
  username: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const response = await authAPI.login(data.username, data.password)
      const token = response.data.access_token
      
      // Store token in localStorage first so subsequent requests can use it
      localStorage.setItem('token', token)
      
      // Now get user info with the token in place
      const userResponse = await authAPI.getMe()
      setAuth(userResponse.data, token)
      
      toast.success('Login successful!')
      
      // Use window.location.href for a hard redirect to ensure state is fresh
      window.location.href = '/dashboard'
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Welcome Back</h1>
          <p className="text-primary/70">Login to your account</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-primary">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Username
              </label>
              <input
                type="text"
                {...register('username', { required: 'Username is required' })}
                className="w-full px-4 py-2 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="Enter your username"
              />
              {errors.username && (
                <p className="text-secondary text-sm mt-1">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Password
              </label>
              <input
                type="password"
                {...register('password', { required: 'Password is required' })}
                className="w-full px-4 py-2 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="text-secondary text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-lg font-semibold hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Logging in...' : (
                <>
                  <LogIn size={20} />
                  Login
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-primary/70">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-secondary font-semibold hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

