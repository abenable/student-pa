import { createFileRoute, Link } from '@tanstack/react-router'
import { authClient } from '#/lib/auth-client'
import { ShieldAlert } from 'lucide-react'

export const Route = createFileRoute('/dashboard/admin/users')({
  component: UsersDirectory,
})

function UsersDirectory() {
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
      <Link
        to="/dashboard/admin"
        className="text-sm text-[#0070d1] hover:underline inline-block mb-4"
      >
        ← Admin Dashboard
      </Link>
      <h1 className="text-[44px] font-light leading-[1.25] tracking-[0.1px] font-['Roboto'] text-black dark:text-white">
        Users
      </h1>

      <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg overflow-hidden mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 dark:border-white/10">
                <th className="px-6 py-3 font-medium text-black/60 dark:text-white/60">Name</th>
                <th className="px-6 py-3 font-medium text-black/60 dark:text-white/60">Email</th>
                <th className="px-6 py-3 font-medium text-black/60 dark:text-white/60">Role</th>
                <th className="px-6 py-3 font-medium text-black/60 dark:text-white/60">Agent</th>
                <th className="px-6 py-3 font-medium text-black/60 dark:text-white/60">Created</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-black/60 dark:text-white/60"
                >
                  No users to display
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
