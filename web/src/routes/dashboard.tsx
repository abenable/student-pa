import { createFileRoute, Link, Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, useRef } from 'react'
import { authClient } from '#/lib/auth-client'
import { Loader2, ChevronDown } from 'lucide-react'
import { ModeToggle } from '#/components/mode-toggle'
import { isAdmin } from '#/lib/roles'

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  const navigate = useNavigate()
  const { data: session, isPending } = authClient.useSession()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isPending && !session?.user) {
      navigate({ to: '/login', replace: true })
    }
  }, [isPending, session, navigate])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  if (isPending || !session?.user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  const navLinks = [
    { label: 'Dashboard', to: '/dashboard' as const },
    { label: 'Chat', to: '/dashboard/chat' as const },
    { label: 'Products', to: '/dashboard/services' as const },
    { label: 'Settings', to: '/dashboard/settings' as const },
    ...(isAdmin((session.user as any).role) ? [{ label: 'Admin', to: '/dashboard/admin' as const }] : []),
  ]

  const initials = session.user.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 h-12 bg-background/95 backdrop-blur-md flex items-center justify-between px-4 md:px-6 shrink-0 border-b border-border">
        <div className="flex items-center">
          <Link to="/dashboard" className="brand-logo hover:opacity-90 transition-opacity">
            AgentHub
          </Link>
        </div>

        {/* Center Nav Links — desktop only */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeOptions={{ exact: link.to === '/dashboard' }}
              className="px-3 py-1.5 text-sm font-medium transition-colors text-foreground/70 hover:text-foreground"
              activeProps={{ className: 'text-foreground font-semibold' }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right: Theme Toggle + User Avatar Dropdown */}
        <div className="flex items-center gap-2">
          <ModeToggle />
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1.5 outline-none"
              aria-label="User menu"
            >
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt="Avatar"
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-foreground/10 text-foreground flex items-center justify-center text-xs font-semibold">
                  {initials}
                </div>
              )}
              <ChevronDown className="h-4 w-4 text-foreground/70" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#181818] rounded-lg shadow-lg border border-black/10 dark:border-white/10 py-2 z-50">
                <div className="px-4 py-2 border-b border-black/5 dark:border-white/10">
                  <p className="text-sm font-semibold text-black dark:text-white truncate">
                    {session.user.name || 'User'}
                  </p>
                  <p className="text-xs text-black/60 dark:text-white/60 truncate">{session.user.email}</p>
                </div>
                <Link
                  to="/dashboard/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-black dark:text-white hover:bg-[#f5f7fa] dark:hover:bg-[#121314] transition-colors"
                >
                  Settings
                </Link>
                <button
                  onClick={() => {
                    setDropdownOpen(false)
                    authClient.signOut({
                      fetchOptions: {
                        onSuccess: () => navigate({ to: '/login' }),
                      },
                    })
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-[#f5f7fa] dark:hover:bg-[#121314] transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-white dark:bg-black text-black dark:text-white">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-black border-t border-black/5 dark:border-white/5 py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="text-xs text-black/40 dark:text-white/40">
            &copy; 2026 AgentHub. Student intelligence, redefined.
          </span>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className="text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white text-xs transition-colors">Privacy</Link>
            <Link to="/terms" className="text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white text-xs transition-colors">Terms</Link>
            <Link to="/support" className="text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white text-xs transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
