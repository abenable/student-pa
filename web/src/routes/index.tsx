import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import {
  Mail,
  FileText,
  Briefcase,
  BookOpen,
  Video,
  ChevronDown,
} from 'lucide-react'
import { Button } from '#/components/ui/button'
import { ModeToggle } from '#/components/mode-toggle'
import { authClient } from '#/lib/auth-client'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { data: session } = authClient.useSession()
  const isAuth = !!session?.user
  const isAdmin = (session?.user as any)?.role === 'admin'
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
        { label: 'Dashboard', to: '/dashboard' as const },
        { label: 'Services', to: '/dashboard/services' as const },
        { label: 'Settings', to: '/dashboard/settings' as const },
        ...(isAdmin ? [{ label: 'Admin', to: '/dashboard/admin' as const }] : []),
      ]
    : [
        { label: 'Features', href: '#features' },
        { label: 'Services', href: '#services' },
        { label: 'Pricing', to: '/pricing' },
        { label: 'Get Started', href: '#cta' },
      ]

  const features = [
    {
      icon: Mail,
      title: 'Inbox & Calendar Manager',
      description:
        'Automatically organize emails, schedule meetings, and keep your calendar in sync across all your university accounts.',
    },
    {
      icon: FileText,
      title: 'Lab Report LaTeX Engine',
      description:
        'Generate beautifully formatted lab reports and research papers with auto-compiled LaTeX templates and citations.',
    },
    {
      icon: Briefcase,
      title: 'Job Application Engine',
      description:
        'Draft tailored cover letters, optimize your resume, and track every application from first click to final offer.',
    },
    {
      icon: BookOpen,
      title: 'Academic Paper Interrogator',
      description:
        'Upload PDFs and ask questions — extract methodologies, summarize findings, and generate literature-review outlines in seconds.',
    },
    {
      icon: Video,
      title: 'Lecture & Video Summarizer',
      description:
        'Convert recorded lectures and tutorial videos into searchable transcripts, chapterized summaries, and flash-card decks.',
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      {/* Section 1: Primary Nav */}
      <nav className="sticky top-0 z-50 h-12 bg-black flex items-center justify-between px-4 md:px-6">
        <Link
          to="/"
          className="!text-white font-bold text-sm tracking-[0.4px] hover:!text-white/80"
        >
          AgentHub
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {isAuth
            ? navLinks.map((link: any) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="px-3 py-1.5 text-sm font-medium transition-colors !text-white/70 hover:!text-white"
                >
                  {link.label}
                </Link>
              ))
            : navLinks.map((link: any) =>
                link.to ? (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="px-3 py-1.5 text-sm font-medium transition-colors !text-white/70 hover:!text-white"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.href}
                    href={link.href}
                    className="px-3 py-1.5 text-sm font-medium transition-colors !text-white/70 hover:!text-white"
                  >
                    {link.label}
                  </a>
                )
              )}
        </div>

        <div className="flex items-center gap-3">
          <ModeToggle />
          {isAuth ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 outline-none"
                aria-label="User menu"
              >
                <div className="h-8 w-8 rounded-full bg-white/10 text-white flex items-center justify-center text-xs font-semibold">
                  {initials}
                </div>
                <ChevronDown className="h-4 w-4 text-white/70" />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#181818] rounded-lg shadow-lg border border-black/10 dark:border-white/10 py-2 z-50">
                  <div className="px-4 py-2 border-b border-black/5 dark:border-white/10">
                    <p className="text-sm font-semibold text-black dark:text-white truncate">
                      {session?.user?.name || 'User'}
                    </p>
                    <p className="text-xs text-black/60 dark:text-white/60 truncate">{session?.user?.email}</p>
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
                          onSuccess: () => { window.location.href = '/' },
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
          ) : (
            <Link to="/login">
              <Button
                variant="outline"
                size="sm"
                className="border-foreground/20 hover:bg-foreground/5 text-foreground"
              >
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </nav>

      {/* Section 2: Hero Band */}
      <section className="bg-background text-foreground py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-12">
            {/* Left side */}
            <div className="w-full md:w-[55%]">
              <span className="text-xs font-bold tracking-[0.16em] uppercase text-foreground/70 block mb-4">
                AI-POWERED STUDENT ASSISTANT
              </span>
              <h1 className="text-[32px] md:text-[44px] font-light leading-[1.2] tracking-[-0.1px] font-['Roboto']">
                Your Personal AI Agent for University Life
              </h1>
              <p className="text-base md:text-lg leading-snug text-foreground/70 mt-4 whitespace-normal" style={{ maxWidth: '480px' }}>
                Automate your inbox, calendar, lab reports, job applications, and
                research. One agent. Every task.
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-6">
                <Link to="/register">
                  <Button className="bg-[#0070d1] hover:bg-[#0064b7] text-white rounded-full px-8 h-12 text-lg font-bold">
                    Get Started
                  </Button>
                </Link>
                <a href="#features">
                  <Button
                    variant="outline"
                    className="border-foreground/20 hover:bg-foreground/5 text-foreground rounded-full px-8 h-12 text-lg font-bold"
                  >
                    Learn More
                  </Button>
                </a>
              </div>
            </div>

            {/* Right side */}
            <div className="w-full md:w-[45%]">
              <div className="rounded-lg overflow-hidden border border-foreground/5">
                <img
                  src="/hero.png"
                  alt="AgentHub Hero"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Feature Band */}
      <section id="features" className="bg-white dark:bg-black text-black dark:text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-[28px] md:text-[40px] font-light leading-[1.2] tracking-[0.1px] font-['Roboto']">
            Everything a Student Needs
          </h2>
          <p className="text-base leading-snug text-black/60 dark:text-white/60 mt-3 max-w-2xl">
            Five powerful workflows, one intelligent agent.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-6 transition-transform hover:-translate-y-1"
              >
                <feature.icon
                  size={48}
                  strokeWidth={1.5}
                  className="text-[#0070d1]"
                />
                <h3 className="text-[20px] md:text-[22px] font-light leading-[1.25] tracking-[0.1px] mt-4 text-black dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-sm leading-snug text-black/60 dark:text-white/60 mt-2">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: CTA Band (PlayStation Blue) */}
      <section id="cta" className="bg-[#0070d1] text-white py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-[28px] md:text-[40px] font-light leading-[1.2] tracking-[0.1px] font-['Roboto']">
            Ready to Meet Your Agent?
          </h2>
          <p className="text-base md:text-lg leading-snug text-white/80 mt-3 max-w-2xl mx-auto">
            Set up your personal AI assistant in under a minute. No coding required.
          </p>
          <div className="mt-8">
            <Link to="/register">
              <Button className="text-[#0070d1] bg-white hover:bg-white/90 rounded-full px-10 h-12 text-lg font-bold">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 5: Footer (PlayStation Blue) */}
      <footer className="bg-[#0070d1] text-white py-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-2xl font-bold">AgentHub</div>
          <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-sm text-white/80">
              &copy; 2026 AgentHub. Student intelligence, redefined.
            </span>
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="text-white/80 hover:text-white text-sm transition-colors"
              >
                Privacy
              </Link>
              <Link
                to="/"
                className="text-white/80 hover:text-white text-sm transition-colors"
              >
                Terms
              </Link>
              <Link
                to="/"
                className="text-white/80 hover:text-white text-sm transition-colors"
              >
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
