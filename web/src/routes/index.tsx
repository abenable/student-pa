import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import {
  Mail,
  FileText,
  Briefcase,
  BookOpen,
  Video,
  ChevronDown,
  Sparkles,
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
        { label: 'Pricing', to: '/pricing' as const },
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
    <div className="min-h-screen bg-background text-foreground font-sans antialiased overflow-x-hidden">
      {/* Section 1: Primary Nav */}
      <nav className="sticky top-0 z-50 h-12 bg-black/90 backdrop-blur-md flex items-center justify-between px-4 md:px-6 border-b border-white/5">
        <Link
          to="/"
          className="!text-white font-bold text-sm tracking-[0.4px] hover:!text-white/80 transition-colors"
        >
          AgentHub
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {isAuth
            ? navLinks.map((link: any) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="px-3 py-1.5 text-sm font-medium transition-colors !text-white/70 hover:!text-white relative group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#0070d1] transition-all duration-300 group-hover:w-4/5 rounded-full" />
                </Link>
              ))
            : navLinks.map((link: any) =>
                link.to ? (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="px-3 py-1.5 text-sm font-medium transition-colors !text-white/70 hover:!text-white relative group"
                  >
                    {link.label}
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#0070d1] transition-all duration-300 group-hover:w-4/5 rounded-full" />
                  </Link>
                ) : (
                  <a
                    key={link.href}
                    href={link.href}
                    className="px-3 py-1.5 text-sm font-medium transition-colors !text-white/70 hover:!text-white relative group"
                  >
                    {link.label}
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#0070d1] transition-all duration-300 group-hover:w-4/5 rounded-full" />
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
                className="flex items-center gap-1.5 outline-none group"
                aria-label="User menu"
              >
                <div className="h-8 w-8 rounded-full bg-white/10 text-white flex items-center justify-center text-xs font-semibold transition-transform group-hover:scale-105">
                  {initials}
                </div>
                <ChevronDown className="h-4 w-4 text-white/70 transition-transform duration-200" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#181818] rounded-lg shadow-lg border border-black/10 dark:border-white/10 py-2 z-50 animate-scale-in">
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

      {/* Section 2: Hero Band - Full-bleed background image */}
      <section className="relative text-white min-h-[500px] md:min-h-[600px] flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/hero.png"
            alt=""
            className="w-full h-full object-cover object-right md:object-center"
          />
          {/* Strong left overlay where text lives, fading out toward right */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.2) 65%, rgba(0,0,0,0) 100%)',
            }}
          />
          {/* Bottom vignette */}
          <div
            className="absolute inset-x-0 bottom-0 h-20"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)',
            }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 w-full py-16">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.16em] uppercase text-white/90 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 mb-5 animate-fade-in-up">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Student Assistant
            </span>
            <h1 className="text-[34px] md:text-[46px] font-medium leading-[1.15] tracking-[-0.5px] font-['Roboto'] animate-fade-in-up delay-100" style={{ textWrap: 'balance' }}>
              Your Personal AI Agent for University Life
            </h1>
            <p className="text-base md:text-lg leading-relaxed text-white/80 mt-5 animate-fade-in-up delay-200" style={{ textWrap: 'balance' }}>
              Automate your inbox, calendar, lab reports, job applications, and research. One agent. Every task.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-8 animate-fade-in-up delay-300">
              <Link to="/register">
                <Button className="bg-[#0070d1] hover:bg-[#0064b7] text-white rounded-full px-8 h-12 text-lg font-bold transition-transform hover:scale-105 active:scale-95">
                  Get Started
                </Button>
              </Link>
              <a href="#features">
                <Button
                  variant="outline"
                  className="border-white/30 hover:bg-white/10 text-white rounded-full px-8 h-12 text-lg font-bold transition-transform hover:scale-105 active:scale-95"
                >
                  Learn More
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Feature Band */}
      <section id="features" className="relative bg-white dark:bg-black text-black dark:text-white py-20 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 relative">
          <h2 className="text-[28px] md:text-[44px] font-light leading-[1.15] tracking-[-0.5px] font-['Roboto'] animate-fade-in-up">
            Everything a Student Needs
          </h2>
          <p className="text-base leading-snug text-black/60 dark:text-white/60 mt-3 max-w-2xl animate-fade-in-up delay-100">
            Five powerful workflows, one intelligent agent.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 card-hover-lift card-glow cursor-default animate-fade-in-up"
                style={{ animationDelay: `${200 + i * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-[#0070d1]/10 flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-[#0070d1]/20 group-hover:scale-110">
                  <feature.icon
                    size={28}
                    strokeWidth={1.5}
                    className="text-[#0070d1] transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <h3 className="text-[20px] md:text-[22px] font-medium leading-[1.25] tracking-[-0.2px] text-black dark:text-white">
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

      {/* Section 4: CTA Band */}
      <section id="cta" className="relative bg-[#0070d1] text-white py-14 overflow-hidden">
        {/* Animated mesh overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 animate-gradient-shift" style={{ backgroundSize: '200% 200%' }} />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-[28px] md:text-[44px] font-light leading-[1.15] tracking-[-0.5px] font-['Roboto'] animate-fade-in-up">
            Ready to Meet Your Agent?
          </h2>
          <p className="text-base md:text-lg leading-snug text-white/80 mt-4 max-w-2xl mx-auto animate-fade-in-up delay-100">
            Set up your personal AI assistant in under a minute. No coding required.
          </p>
          <div className="mt-10 animate-fade-in-up delay-200">
            <Link to="/register">
              <Button className="text-[#0070d1] bg-white hover:bg-white/95 rounded-full px-10 h-12 text-lg font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-black/10">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 5: Footer */}
      <footer className="bg-background text-foreground py-4 border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              &copy; 2026 AgentHub. Student intelligence, redefined.
            </span>
            <div className="flex items-center gap-5">
              <Link
                to="/"
                className="text-muted-foreground hover:text-foreground text-xs transition-colors"
              >
                Privacy
              </Link>
              <Link
                to="/"
                className="text-muted-foreground hover:text-foreground text-xs transition-colors"
              >
                Terms
              </Link>
              <Link
                to="/"
                className="text-muted-foreground hover:text-foreground text-xs transition-colors"
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
