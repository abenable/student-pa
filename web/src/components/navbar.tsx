import { Link, useRouterState } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Menu, X } from 'lucide-react'
import { Button } from './ui/button'
import { ModeToggle } from './mode-toggle'
import { authClient } from '../lib/auth-client'
import { isAdmin } from '../lib/roles'

export function Navbar() {
  const { data: session } = authClient.useSession()
  const isAuth = !!session?.user
  const userIsAdmin = isAdmin((session?.user as any)?.role)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const router = useRouterState()
  const currentPath = router.location.pathname
  const isDashboardRoute = currentPath.startsWith('/dashboard')

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

  const initials = session?.user?.name
    ? session.user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  const navLinks = isAuth
    ? [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/services', label: 'Services' },
        { to: '/pricing', label: 'Pricing' },
        { to: '/dashboard/settings', label: 'Settings' },
        ...(userIsAdmin ? [{ to: '/dashboard/admin', label: 'Admin' }] : []),
      ]
    : [
        { to: '/', label: 'Home' },
        { to: '/services', label: 'Services' },
        { to: '/pricing', label: 'Pricing' },
        { to: '/login', label: 'Sign In' },
      ]

  const logoTo = isAuth ? '/dashboard' : '/'

  const isActive = (path: string) => {
    if (path === '/dashboard' && currentPath === '/dashboard') return true
    if (path === '/' && currentPath === '/') return true
    return currentPath === path
  }

  return (
    <nav className="sticky top-0 z-50 h-12 bg-background/90 backdrop-blur-md flex items-center justify-between px-4 md:px-6 border-b border-border/5">
      <Link to={logoTo} className="brand-logo font-bold text-sm tracking-[0.4px] hover:opacity-80 transition-opacity shrink-0">
        AgentHub
      </Link>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-1">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            activeOptions={{ exact: link.to === '/dashboard' || link.to === '/' }}
            className={`px-3 py-1.5 text-sm font-medium transition-colors relative group ${
              isActive(link.to)
                ? 'text-foreground'
                : 'text-foreground/70 hover:text-foreground'
            }`}
          >
            {link.label}
            <span
              className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-[#0070d1] rounded-full transition-all duration-300 ${
                isActive(link.to) ? 'w-4/5' : 'w-0 group-hover:w-4/5'
              }`}
            />
          </Link>
        ))}
      </div>

      {/* Right side: theme toggle + auth */}
      <div className="flex items-center gap-3">
        <ModeToggle />
        <div className="hidden md:flex items-center">
          {isAuth ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 outline-none group"
                aria-label="User menu"
              >
                <div className="h-8 w-8 rounded-full bg-foreground/10 text-foreground flex items-center justify-center text-xs font-semibold transition-transform group-hover:scale-105">
                  {initials}
                </div>
                <ChevronDown
                  className="h-4 w-4 text-foreground/70 transition-transform duration-200"
                  style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-background rounded-lg shadow-lg border border-border py-2 z-50 animate-scale-in">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {session?.user?.name || 'User'}
                    </p>
                    <p className="text-xs text-foreground/60 truncate">{session?.user?.email}</p>
                  </div>
                  <Link
                    to="/dashboard/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      setDropdownOpen(false)
                      authClient.signOut({
                        fetchOptions: { onSuccess: () => (window.location.href = '/') },
                      })
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-muted transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/register">
              <Button variant="outline" size="sm" className="border-foreground/20 hover:bg-foreground/5 text-foreground">
                Sign Up
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-1"
          onClick={() => setMobileOpen((p) => !p)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-12 left-0 right-0 bg-background border-b border-border p-4 md:hidden flex flex-col gap-2 shadow-lg">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive(link.to)
                  ? 'bg-[#0070d1]/10 text-[#0070d1]'
                  : 'text-foreground/70 hover:bg-muted hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isAuth && (
            <button
              onClick={() => {
                setMobileOpen(false)
                authClient.signOut({
                  fetchOptions: { onSuccess: () => (window.location.href = '/') },
                })
              }}
              className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-muted rounded-md transition-colors text-left"
            >
              Sign out
            </button>
          )}
        </div>
      )}
    </nav>
  )
}
