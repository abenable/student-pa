import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { authClient } from '#/lib/auth-client'
import {
  Zap,
  Clock,
  CheckCircle,
  Activity,
} from 'lucide-react'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardIndex,
})

function DashboardIndex() {
  const navigate = useNavigate()
  const { data: session } = authClient.useSession()
  const [loading, setLoading] = useState(true)
  const [hasAgent, setHasAgent] = useState(false)
  const name = session?.user?.name || 'Agent'

  useEffect(() => {
    async function checkAgent() {
      try {
        const res = await fetch('/api/provision')
        if (!res.ok) {
          setHasAgent(false)
          setLoading(false)
          return
        }
        const data = await res.json()
        const userRole = data.role || (session?.user as any)?.role
        // Admin or skipped onboarding: stay on dashboard
        if (userRole === 'admin' || data.onboardingSkipped) {
          setHasAgent(false)
          setLoading(false)
          return
        }
        if (data.agent) {
          setHasAgent(true)
          setLoading(false)
          return
        }
        // No agent, redirect to onboarding
        navigate({ to: '/dashboard/onboarding', replace: true })
      } catch {
        setHasAgent(false)
        setLoading(false)
      }
    }
    if (session?.user) {
      checkAgent()
    }
  }, [session, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-neutral-200 border-t-[#0070d1] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* A. Welcome Header */}
      <header>
        <h1 className="text-[44px] font-light leading-[1.25] tracking-[0.1px] font-['Roboto'] text-black dark:text-white">
          Welcome back, {name}
        </h1>
        <p className="text-lg text-black/60 dark:text-white/60 leading-[1.5] mt-2">
          Here's what's happening with your agent.
        </p>
      </header>

      {/* B. Agent Status Card */}
      <section className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-6 mt-8">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-700 dark:text-green-300 text-sm font-medium">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Online
            </div>
            <p className="mt-3 text-xl font-semibold text-black dark:text-white">Your agent is ready</p>
            <p className="mt-1 text-sm text-black/60 dark:text-white/60">Model: Mythos Agent</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/services"
              className="bg-[#0070d1] text-white rounded-full px-7 py-3 h-12 font-bold text-lg inline-flex items-center hover:bg-[#005bb5] transition-colors"
            >
              Run a Service
            </Link>
            <button
              className="rounded-full px-7 py-3 h-12 font-bold text-lg inline-flex items-center border border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Restart
            </button>
          </div>
        </div>
      </section>

      {/* C. Stats Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#0070d1]/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-[#0070d1]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-black dark:text-white">0</p>
              <p className="text-sm text-black/60 dark:text-white/60">Services Run</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-black/50 dark:text-white/50">Completed tasks</p>
        </div>

        <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#0070d1]/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-[#0070d1]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-black dark:text-white">—</p>
              <p className="text-sm text-black/60 dark:text-white/60">Agent Uptime</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-black/50 dark:text-white/50">Hours online</p>
        </div>

        <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#0070d1]/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-[#0070d1]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-black dark:text-white">0</p>
              <p className="text-sm text-black/60 dark:text-white/60">Tasks Completed</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-black/50 dark:text-white/50">This month</p>
        </div>
      </section>

      {/* D. Activity Feed */}
      <section className="mt-8">
        <h2 className="text-[22px] font-light leading-[1.25] tracking-[0.1px] text-black dark:text-white">
          Recent Activity
        </h2>
        <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-8 text-center mt-4">
          <Activity className="h-12 w-12 text-[#0070d1] mx-auto" />
          <p className="mt-4 text-black/60 dark:text-white/60">
            No activity yet. Run a service to see results here.
          </p>
          <Link
            to="/dashboard/services"
            className="inline-block mt-3 text-[#0070d1] font-medium hover:underline"
          >
            Go to Services
          </Link>
        </div>
      </section>
    </div>
  )
}
