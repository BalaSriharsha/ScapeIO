'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { subscriptionAPI, getErrorMessage } from '@/lib/api'
import toast from 'react-hot-toast'
import { Check, X } from 'lucide-react'

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

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [annualBilling, setAnnualBilling] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  })

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await subscriptionAPI.getPlans()
      setPlans(response.data)
    } catch (error) {
      console.error('Error fetching plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await subscriptionAPI.contactEnterprise(contactData)
      toast.success('Thank you! Our team will contact you within 24 hours.')
      setShowContactForm(false)
      setContactData({ name: '', email: '', company: '', message: '' })
    } catch (error: any) {
      toast.error(getErrorMessage(error) || 'Failed to submit request')
    }
  }

  const getPrice = (plan: Plan) => {
    if (Number(plan.price_monthly) === 0) return 'Free'
    const price = annualBilling ? Number(plan.price_yearly) / 12 : Number(plan.price_monthly)
    return `$${price.toFixed(0)}`
  }

  const getSavings = (plan: Plan) => {
    if (Number(plan.price_monthly) === 0 || !annualBilling) return null
    const monthlyCost = Number(plan.price_monthly) * 12
    const yearlyCost = Number(plan.price_yearly)
    const savings = ((monthlyCost - yearlyCost) / monthlyCost * 100).toFixed(0)
    return `Save ${savings}%`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF4E3] via-white to-[#FDF4E3]">
      <main className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-[#134686] mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-[#134686]/70 mb-8">
            Choose the perfect plan for your web scraping needs
          </p>

          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`font-medium ${!annualBilling ? 'text-[#134686]' : 'text-[#134686]/50'}`}>
              Monthly
            </span>
            <button
              onClick={() => setAnnualBilling(!annualBilling)}
              className={`relative w-14 h-7 rounded-full transition ${
                annualBilling ? 'bg-[#134686]' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition transform ${
                  annualBilling ? 'translate-x-7' : ''
                }`}
              />
            </button>
            <span className={`font-medium ${annualBilling ? 'text-[#134686]' : 'text-[#134686]/50'}`}>
              Annual
            </span>
            {annualBilling && (
              <span className="text-[#ED3F27] font-semibold text-sm bg-[#ED3F27]/10 px-3 py-1 rounded-full">
                Save 20%!
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#134686] border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl shadow-xl overflow-hidden transition-transform hover:scale-105 ${
                  index === 1 ? 'ring-4 ring-[#FEB21A] relative' : ''
                }`}
              >
                {index === 1 && (
                  <div className="absolute top-0 right-0 bg-[#FEB21A] text-[#134686] px-4 py-1 rounded-bl-lg font-bold text-sm">
                    MOST POPULAR
                  </div>
                )}
                
                <div className="p-8 border-b-2 border-[#134686]/10">
                  <h3 className="text-2xl font-bold text-[#134686] mb-2">
                    {plan.display_name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-5xl font-bold text-[#134686]">
                      {getPrice(plan)}
                    </span>
                    {plan.price_monthly > 0 && (
                      <span className="text-[#134686]/60 ml-2">/month</span>
                    )}
                  </div>
                  {getSavings(plan) && (
                    <span className="text-[#ED3F27] font-semibold text-sm">
                      {getSavings(plan)}
                    </span>
                  )}
                </div>

                <div className="p-8">
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="text-[#134686] mt-1 flex-shrink-0" size={20} />
                        <span className="text-[#134686]/80">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.name === 'enterprise' ? (
                    <button
                      onClick={() => setShowContactForm(true)}
                      className="w-full py-3 bg-gradient-to-r from-[#134686] to-[#ED3F27] text-white rounded-lg font-semibold hover:scale-105 transition"
                    >
                      Contact Sales
                    </button>
                  ) : (
                    <Link
                      href="/auth/register"
                      className="block w-full py-3 text-center bg-[#134686] text-white rounded-lg font-semibold hover:bg-[#ED3F27] transition"
                    >
                      Get Started
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showContactForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
              <h2 className="text-2xl font-bold text-[#134686] mb-6">
                Contact Enterprise Sales
              </h2>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#134686] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={contactData.name}
                    onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-[#134686]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#134686]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#134686] mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={contactData.email}
                    onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-[#134686]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#134686]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#134686] mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    required
                    value={contactData.company}
                    onChange={(e) => setContactData({ ...contactData, company: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-[#134686]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#134686]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#134686] mb-1">
                    Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={contactData.message}
                    onChange={(e) => setContactData({ ...contactData, message: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-[#134686]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#134686]"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowContactForm(false)}
                    className="flex-1 py-2 border-2 border-[#134686] text-[#134686] rounded-lg hover:bg-[#134686]/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-gradient-to-r from-[#134686] to-[#ED3F27] text-white rounded-lg font-semibold hover:scale-105 transition"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#134686] text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'Can I upgrade or downgrade my plan anytime?',
                a: 'Yes! You can upgrade or downgrade your subscription at any time. Changes take effect immediately.'
              },
              {
                q: 'What happens if I exceed my storage limit?',
                a: 'You will be notified when approaching your storage limit. You can upgrade your plan to continue scraping.'
              },
              {
                q: 'Do you offer refunds?',
                a: 'Yes, we offer a 30-day money-back guarantee for all paid plans.'
              },
              {
                q: 'Is there a free trial for Pro or Enterprise?',
                a: 'We offer a Free plan to get started. For Pro or Enterprise trials, please contact our sales team.'
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="font-bold text-[#134686] mb-2">{faq.q}</h3>
                <p className="text-[#134686]/70">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

    </div>
  )
}

