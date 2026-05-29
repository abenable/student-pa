import { createFileRoute, Link } from '@tanstack/react-router'
import { authClient } from '#/lib/auth-client'
import { ShieldAlert, Users, Bot, Activity, Zap } from 'lucide-react'

export const Route = createFileRoute('/dashboard/admin')({
  component: AdminOverview,
})

function AdminOverview() {
  const { data: session } = authClient.useSession()

  const isAdmin = session?.user?.role === 'admin'

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#121314] flex flex-col items-center justify-center text-center px-6">
        <ShieldAlert className="h-12 w-12 mb-4" color="#c81b3a" />
        <h1 className="text-2xl font-semibold text-black dark:text-white mb-2">Access Denied</h1>
        <p className="text-base text-black/60 dark:text-white/60 mb-6">
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
      <h1 className="text-[44px] font-light leading-[1.25] tracking-[0.1px] font-['Roboto'] text-black dark:text-white">
        Admin Dashboard
      </h1>
      <p className="text-lg text-black/60 dark:text-white/60 mt-2">System-wide overview and management.</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-6">
          <Users className="h-6 w-6 text-black/60 dark:text-white/60 mb-3" />
          <p className="text-sm text-black/60 dark:text-white/60">Total Users</p>
          <p className="text-2xl font-semibold text-black dark:text-white mt-1">—</p>
        </div>
        <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-6">
          <Bot className="h-6 w-6 text-black/60 dark:text-white/60 mb-3" />
          <p className="text-sm text-black/60 dark:text-white/60">Total Agents</p>
          <p className="text-2xl font-semibold text-black dark:text-white mt-1">—</p>
        </div>
        <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-6">
          <Activity className="h-6 w-6 text-black/60 dark:text-white/60 mb-3" />
          <p className="text-sm text-black/60 dark:text-white/60">Active Containers</p>
          <p className="text-2xl font-semibold text-black dark:text-white mt-1">—</p>
        </div>
        <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-6">
          <Zap className="h-6 w-6 text-black/60 dark:text-white/60 mb-3" />
          <p className="text-sm text-black/60 dark:text-white/60">Services Run Today</p>
          <p className="text-2xl font-semibold text-black dark:text-white mt-1">—</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Link
          to="/dashboard/admin/agents"
          className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-6 flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <Bot className="h-8 w-8 text-[#0070d1]" />
          <div>
            <p className="text-lg font-medium text-black dark:text-white">Manage Agents</p>
            <p className="text-sm text-black/60 dark:text-white/60">View and manage all agents</p>
          </div>
        </Link>
        <Link
          to="/dashboard/admin/users"
          className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-6 flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <Users className="h-8 w-8 text-[#0070d1]" />
          <div>
            <p className="text-lg font-medium text-black dark:text-white">Manage Users</p>
            <p className="text-sm text-black/60 dark:text-white/60">View and manage all users</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
