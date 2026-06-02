import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { authClient } from '#/lib/auth-client'
import { ShieldAlert, CheckCircle, XCircle, Clock, AlertTriangle, Loader2, Bot, MessageCircle } from 'lucide-react'

import { isAdmin } from '#/lib/roles'

export const Route = createFileRoute('/dashboard/admin/agents')({
  component: AgentsDirectory,
})

interface Agent {
  id: string
  name: string
  studentName: string
  bio: string
  status: string
  containerName: string
  containerRunning: boolean
  botUsername: string | null
  hasBotToken: boolean
  hasLiteLLMKey: boolean
  approvedAt: string | null
  createdAt: string
  updatedAt: string
  user: { id: string; name: string | null; email: string | null }
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'RUNNING':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-300 text-xs font-bold">
          <CheckCircle className="h-3 w-3" />
          Running
        </span>
      )
    case 'PENDING_APPROVAL':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold">
          <Clock className="h-3 w-3" />
          Pending
        </span>
      )
    case 'PROVISIONING':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-bold">
          <Loader2 className="h-3 w-3 animate-spin" />
          Provisioning
        </span>
      )
    case 'STOPPED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-500/10 text-neutral-700 dark:text-neutral-300 text-xs font-bold">
          <XCircle className="h-3 w-3" />
          Stopped
        </span>
      )
    case 'ERROR':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-700 dark:text-red-300 text-xs font-bold">
          <AlertTriangle className="h-3 w-3" />
          Error
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-500/10 text-neutral-700 dark:text-neutral-300 text-xs font-bold">
          <XCircle className="h-3 w-3" />
          {status}
        </span>
      )
  }
}

function ContainerBadge({ running }: { running: boolean }) {
  if (running) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-300 text-xs font-bold">
        <CheckCircle className="h-3 w-3" />
        Up
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-700 dark:text-red-300 text-xs font-bold">
      <XCircle className="h-3 w-3" />
      Down
    </span>
  )
}

function BotBadge({ botUsername, hasToken }: { botUsername: string | null; hasToken: boolean }) {
  if (!botUsername) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-500/10 text-neutral-700 dark:text-neutral-300 text-xs font-bold">
        <Bot className="h-3 w-3" />
        Not created
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-bold" title={hasToken ? 'Bot token set' : 'Missing bot token'}>
      <MessageCircle className="h-3 w-3" />
      @{botUsername}
    </span>
  )
}

function AgentsDirectory() {
  const { data: session } = authClient.useSession()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  const isAdminUser = isAdmin(session?.user?.role)

  useEffect(() => {
    if (!isAdminUser) return
    async function fetchAgents() {
      try {
        const res = await fetch('/api/admin/agents')
        if (res.ok) {
          const data = await res.json()
          setAgents(data.agents || [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchAgents()
  }, [isAdminUser])

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
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Link
        to="/dashboard/admin"
        className="text-sm text-[#0070d1] hover:underline inline-block mb-4"
      >
        &larr; Admin Dashboard
      </Link>
      <h1 className="text-[44px] font-light leading-[1.25] tracking-[0.1px] font-['Roboto'] text-foreground">
        Agents & Bots
      </h1>
      <p className="text-lg text-foreground/60 mt-2">View all provisioned agents and their Telegram bots.</p>

      <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg overflow-hidden mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 font-medium text-foreground/60">Agent Name</th>
                <th className="px-6 py-3 font-medium text-foreground/60">Student</th>
                <th className="px-6 py-3 font-medium text-foreground/60">Status</th>
                <th className="px-6 py-3 font-medium text-foreground/60">Telegram Bot</th>
                <th className="px-6 py-3 font-medium text-foreground/60">Container</th>
                <th className="px-6 py-3 font-medium text-foreground/60">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-foreground/60">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading...
                  </td>
                </tr>
              ) : agents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-foreground/60">
                    No agents to display
                  </td>
                </tr>
              ) : (
                agents.map((agent) => (
                  <tr key={agent.id} className="border-b border-border/50 last:border-0">
                    <td className="px-6 py-4 font-medium text-foreground">
                      <div>{agent.name}</div>
                      <div className="text-xs text-foreground/50 mt-0.5">{agent.bio}</div>
                    </td>
                    <td className="px-6 py-4 text-foreground/80">
                      <div>{agent.studentName}</div>
                      <div className="text-xs text-foreground/50">{agent.user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={agent.status} />
                    </td>
                    <td className="px-6 py-4">
                      <BotBadge botUsername={agent.botUsername} hasToken={agent.hasBotToken} />
                      {!agent.hasLiteLLMKey && agent.botUsername && (
                        <div className="text-xs text-amber-600 mt-1">No LiteLLM key</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ContainerBadge running={agent.containerRunning} />
                        <span className="text-xs text-foreground/50 font-mono">{agent.containerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-foreground/50 text-xs">
                      {new Date(agent.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
