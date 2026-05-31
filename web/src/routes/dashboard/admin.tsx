import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { authClient } from '#/lib/auth-client'
import { ShieldAlert, Users, Bot, Activity, Zap, Clock, CheckCircle, XCircle } from 'lucide-react'

import { isAdmin } from '#/lib/roles'

export const Route = createFileRoute('/dashboard/admin')({
  component: AdminOverview,
})

interface PendingAgent {
  id: string
  name: string
  studentName: string
  bio: string
  createdAt: string
  user: { id: string; name: string | null; email: string | null }
}

function AdminOverview() {
  const { data: session } = authClient.useSession()
  const [pending, setPending] = useState<PendingAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const isAdminUser = isAdmin(session?.user?.role)

  useEffect(() => {
    if (!isAdminUser) return
    fetchPending()
  }, [isAdminUser])

  async function fetchPending() {
    try {
      const res = await fetch('/api/admin/approvals')
      if (res.ok) {
        const data = await res.json()
        setPending(data.pending || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(agentId: string, action: 'approve' | 'reject') {
    setActionLoading(agentId)
    try {
      const res = await fetch('/api/admin/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, action }),
      })
      if (res.ok) {
        setPending((prev) => prev.filter((a) => a.id !== agentId))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(null)
    }
  }

  if (!isAdminUser) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-6">
        <ShieldAlert className="h-12 w-12 mb-4 text-red-500" />
        <h1 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h1>
        <p className="text-base text-foreground/60 mb-6">
          You don't have permission to view this page.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center px-6 py-2.5 bg-[#0070d1] text-white rounded-full text-sm font-medium hover:bg-[#005bb5] transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-[44px] font-light leading-[1.25] tracking-[0.1px] font-['Roboto'] text-foreground">
        Admin Dashboard
      </h1>
      <p className="text-lg text-foreground/60 mt-2">System-wide overview and management.</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-6">
          <Users className="h-6 w-6 text-foreground/60 mb-3" />
          <p className="text-sm text-foreground/60">Total Users</p>
          <p className="text-2xl font-semibold text-foreground mt-1">—</p>
        </div>
        <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-6">
          <Bot className="h-6 w-6 text-foreground/60 mb-3" />
          <p className="text-sm text-foreground/60">Total Agents</p>
          <p className="text-2xl font-semibold text-foreground mt-1">—</p>
        </div>
        <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-6">
          <Activity className="h-6 w-6 text-foreground/60 mb-3" />
          <p className="text-sm text-foreground/60">Active Containers</p>
          <p className="text-2xl font-semibold text-foreground mt-1">—</p>
        </div>
        <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-6">
          <Zap className="h-6 w-6 text-foreground/60 mb-3" />
          <p className="text-sm text-foreground/60">Services Run Today</p>
          <p className="text-2xl font-semibold text-foreground mt-1">—</p>
        </div>
      </div>

      {/* Pending Approvals */}
      <section className="mt-10">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="h-5 w-5 text-amber-500" />
          <h2 className="text-[22px] font-light text-foreground">Pending Approvals</h2>
          {pending.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300 text-xs font-bold">
              {pending.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-8 text-center">
            <div className="h-8 w-8 border-4 border-neutral-200 border-t-[#0070d1] rounded-full animate-spin mx-auto" />
          </div>
        ) : pending.length === 0 ? (
          <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-8 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-foreground/60">No pending approvals. All caught up!</p>
          </div>
        ) : (
          <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 font-medium text-foreground/60">Agent Name</th>
                    <th className="px-6 py-3 font-medium text-foreground/60">Student</th>
                    <th className="px-6 py-3 font-medium text-foreground/60">Bio</th>
                    <th className="px-6 py-3 font-medium text-foreground/60">Requested</th>
                    <th className="px-6 py-3 font-medium text-foreground/60">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((agent) => (
                    <tr key={agent.id} className="border-b border-border/50 last:border-0">
                      <td className="px-6 py-4 font-medium text-foreground">{agent.name}</td>
                      <td className="px-6 py-4 text-foreground/80">
                        <div>{agent.user.name || '—'}</div>
                        <div className="text-xs text-foreground/50">{agent.user.email}</div>
                      </td>
                      <td className="px-6 py-4 text-foreground/70 max-w-xs truncate">{agent.bio}</td>
                      <td className="px-6 py-4 text-foreground/50 text-xs">
                        {new Date(agent.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAction(agent.id, 'approve')}
                            disabled={actionLoading === agent.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-300 text-xs font-bold hover:bg-green-500/20 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(agent.id, 'reject')}
                            disabled={actionLoading === agent.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-500/10 text-red-700 dark:text-red-300 text-xs font-bold hover:bg-red-500/20 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Link
          to="/dashboard/admin/agents"
          className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-6 flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <Bot className="h-8 w-8 text-[#0070d1]" />
          <div>
            <p className="text-lg font-medium text-foreground">Manage Agents</p>
            <p className="text-sm text-foreground/60">View and manage all agents</p>
          </div>
        </Link>
        <Link
          to="/dashboard/admin/users"
          className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-6 flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <Users className="h-8 w-8 text-[#0070d1]" />
          <div>
            <p className="text-lg font-medium text-foreground">Manage Users</p>
            <p className="text-sm text-foreground/60">View and manage all users</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
