import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { authClient } from '#/lib/auth-client'
import { ShieldAlert, Loader2 } from 'lucide-react'
import { isAdmin } from '#/lib/roles'

export const Route = createFileRoute('/dashboard/admin/users')({
  component: UsersDirectory,
})

interface UserRecord {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
  agent: { name: string; status: string } | null
}

function UsersDirectory() {
  const { data: session } = authClient.useSession()
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)

  const isAdminUser = isAdmin(session?.user?.role)

  useEffect(() => {
    if (!isAdminUser) return
    async function fetchUsers() {
      try {
        const res = await fetch('/api/admin/users')
        if (res.ok) {
          const data = await res.json()
          setUsers(data.users || [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
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
    <div className="max-w-5xl mx-auto px-6 py-12">
      <Link
        to="/dashboard/admin"
        className="text-sm text-[#0070d1] hover:underline inline-block mb-4"
      >
        &larr; Admin Dashboard
      </Link>
      <h1 className="text-[44px] font-light leading-[1.25] tracking-[0.1px] font-['Roboto'] text-foreground">
        Users
      </h1>

      <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg overflow-hidden mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 font-medium text-foreground/60">Name</th>
                <th className="px-6 py-3 font-medium text-foreground/60">Email</th>
                <th className="px-6 py-3 font-medium text-foreground/60">Role</th>
                <th className="px-6 py-3 font-medium text-foreground/60">Agent</th>
                <th className="px-6 py-3 font-medium text-foreground/60">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-foreground/60">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-foreground/60">
                    No users to display
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-border/50 last:border-0">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {user.name || '—'}
                    </td>
                    <td className="px-6 py-4 text-foreground/80">{user.email}</td>
                    <td className="px-6 py-4 text-foreground/70 capitalize">{user.role}</td>
                    <td className="px-6 py-4 text-foreground/70">
                      {user.agent ? (
                        <div>
                          <span className="font-medium">{user.agent.name}</span>
                          <span className="text-xs text-foreground/50 ml-2">({user.agent.status})</span>
                        </div>
                      ) : (
                        <span className="text-foreground/40">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-foreground/50 text-xs">
                      {new Date(user.createdAt).toLocaleDateString()}
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
