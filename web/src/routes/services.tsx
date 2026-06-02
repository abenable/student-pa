import { createFileRoute, Link } from '@tanstack/react-router'
import { Footer } from '#/components/Footer'
import { useState, useRef, useEffect } from 'react'
import { Bot, Wrench, Server, Key, Sparkles, ChevronDown } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { ModeToggle } from '#/components/mode-toggle'
import { authClient } from '#/lib/auth-client'
import { isAdmin } from '#/lib/roles'

export const Route = createFileRoute('/services')({
  component: ServicesPage,
})

const offerings = [
  {
    id: 'personal-agents',
    title: 'Personal AI Agents',
    icon: Bot,
    description:
      'Every student gets a dedicated AI agent with its own Telegram bot identity. Your agent remembers your schedule, preferences, and goals — and works for you 24/7.',
    features: [
      'Unique Telegram bot per student',
      'Persistent memory & context',
      'Private, isolated conversations',
      '24/7 availability',
    ],
  },
  {
    id: 'customisation',
    title: 'Agent Customisation',
    icon: Wrench,
    description:
      'Make your agent truly yours. Customise its name, personality, bio, and the specific workflows it can run to match exactly how you study and work.',
    features: [
      'Custom agent name & avatar',
      'Personality tuning',
      'Workflow enable/disable',
      'Brand & voice matching',
    ],
  },
  {
    id: 'hosting',
    title: 'Agent Hosting',
    icon: Server,
    description:
      'We provision, host, and manage every agent container so you never have to touch a server. Auto-scaling, health checks, and zero downtime deployments included.',
    features: [
      'Managed Docker containers',
      'Auto-scaling & health checks',
      'Zero-downtime deployments',
      'Built-in monitoring & logs',
    ],
  },
  {
    id: 'llm-api',
    title: 'LLM API Access',
    icon: Key,
    description:
      'Get managed API keys for powerful language models through our unified LiteLLM gateway. Track usage, set limits, and pay only for what you consume.',
    features: [
      'Unified LiteLLM gateway',
      'Per-student API keys',
      'Usage tracking & quotas',
      'Multiple model providers',
    ],
  },
]

function ServicesPage() {
  const { data: session } = authClient.useSession()
  const isAuth = !!session?.user
  const isAdminUser = isAdmin((session?.user as any)?.role)
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

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 h-12 bg-background/90 backdrop-blur-md flex items-center justify-between px-4 md:px-6 border-b border-border/5">
        <Link to="/" className="brand-logo font-bold text-sm tracking-[0.4px] hover:opacity-80 transition-opacity">
          AgentHub
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {isAuth ? (
            <>
              <Link to="/dashboard" className="px-3 py-1.5 text-sm font-medium transition-colors text-foreground/70 hover:text-foreground relative group">
                Dashboard
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#0070d1] transition-all duration-300 group-hover:w-4/5 rounded-full" />
              </Link>
              <Link to="/services" className="px-3 py-1.5 text-sm font-medium transition-colors text-foreground relative group">
                Services
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-0.5 bg-[#0070d1] rounded-full" />
              </Link>
              <Link to="/pricing" className="px-3 py-1.5 text-sm font-medium transition-colors text-foreground/70 hover:text-foreground relative group">
                Pricing
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#0070d1] transition-all duration-300 group-hover:w-4/5 rounded-full" />
              </Link>
              <Link to="/dashboard/settings" className="px-3 py-1.5 text-sm font-medium transition-colors text-foreground/70 hover:text-foreground relative group">
                Settings
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#0070d1] transition-all duration-300 group-hover:w-4/5 rounded-full" />
              </Link>
              {isAdminUser && (
                <Link to="/dashboard/admin" className="px-3 py-1.5 text-sm font-medium transition-colors text-foreground/70 hover:text-foreground relative group">
                  Admin
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#0070d1] transition-all duration-300 group-hover:w-4/5 rounded-full" />
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/" className="px-3 py-1.5 text-sm font-medium transition-colors text-foreground/70 hover:text-foreground relative group">
                Home
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#0070d1] transition-all duration-300 group-hover:w-4/5 rounded-full" />
              </Link>
              <Link to="/services" className="px-3 py-1.5 text-sm font-medium transition-colors text-foreground relative group">
                Services
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-0.5 bg-[#0070d1] rounded-full" />
              </Link>
              <Link to="/pricing" className="px-3 py-1.5 text-sm font-medium transition-colors text-foreground/70 hover:text-foreground relative group">
                Pricing
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#0070d1] transition-all duration-300 group-hover:w-4/5 rounded-full" />
              </Link>
              <Link to="/login" className="px-3 py-1.5 text-sm font-medium transition-colors text-foreground/70 hover:text-foreground relative group">
                Sign In
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#0070d1] transition-all duration-300 group-hover:w-4/5 rounded-full" />
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ModeToggle />
          {isAuth ? (
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setDropdownOpen((prev) => !prev)} className="flex items-center gap-1.5 outline-none group" aria-label="User menu">
                <div className="h-8 w-8 rounded-full bg-foreground/10 text-foreground flex items-center justify-center text-xs font-semibold transition-transform group-hover:scale-105">
                  {initials}
                </div>
                <ChevronDown className="h-4 w-4 text-foreground/70 transition-transform duration-200" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#181818] rounded-lg shadow-lg border border-black/10 dark:border-white/10 py-2 z-50 animate-scale-in">
                  <div className="px-4 py-2 border-b border-black/5 dark:border-white/10">
                    <p className="text-sm font-semibold text-black dark:text-white truncate">{session?.user?.name || 'User'}</p>
                    <p className="text-xs text-black/60 dark:text-white/60 truncate">{session?.user?.email}</p>
                  </div>
                  <Link to="/dashboard/settings" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-black dark:text-white hover:bg-[#f5f7fa] dark:hover:bg-[#121314] transition-colors">Settings</Link>
                  <button onClick={() => { setDropdownOpen(false); authClient.signOut({ fetchOptions: { onSuccess: () => window.location.href = '/' } }) }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-[#f5f7fa] dark:hover:bg-[#121314] transition-colors">Sign out</button>
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
      </nav>

      {/* Hero */}
      <section className="relative bg-background text-foreground py-16 md:py-20 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="orb orb-blue w-80 h-80 -top-32 left-1/2 -translate-x-1/2 animate-blob" />
        </div>
        <div className="relative mx-auto px-6" style={{ maxWidth: '768px' }}>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0070d1]/10 text-[#0070d1] text-sm font-bold mb-5 animate-fade-in-up">
            <Sparkles className="w-3.5 h-3.5" />
            What We Offer
          </span>
          <h1 className="text-[32px] md:text-[48px] font-light leading-[1.15] tracking-[-0.5px] font-['Roboto'] animate-fade-in-up delay-100">
            AgentHub Services
          </h1>
          <p className="text-base leading-snug text-foreground/70 mt-4 animate-fade-in-up delay-200">
            Infrastructure, customisation, and API access — everything you need to run your own AI agent.
          </p>
        </div>
      </section>

      {/* Offerings Grid */}
      <section className="bg-white dark:bg-black text-black dark:text-white py-12 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {offerings.map((service, i) => {
              const Icon = service.icon
              return (
                <div
                  key={service.id}
                  className="group bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-8 card-hover-lift card-glow animate-fade-in-up"
                  style={{ animationDelay: `${200 + i * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-[#0070d1]/10 flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-[#0070d1]/20 group-hover:scale-110">
                    <Icon size={28} strokeWidth={1.5} className="text-[#0070d1]" />
                  </div>
                  <h2 className="text-[22px] md:text-[24px] font-medium leading-[1.25] tracking-[-0.2px] text-black dark:text-white">
                    {service.title}
                  </h2>
                  <p className="text-sm leading-snug text-black/60 dark:text-white/60 mt-2">
                    {service.description}
                  </p>
                  <ul className="mt-6 space-y-2">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#0070d1] mt-1.5 shrink-0" />
                        <span className="text-sm text-black/80 dark:text-white/80">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-[#0070d1] text-white py-14 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 animate-gradient-shift" style={{ backgroundSize: '200% 200%' }} />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-[28px] md:text-[44px] font-light leading-[1.15] tracking-[-0.5px] font-['Roboto'] animate-fade-in-up">
            Ready to Get Started?
          </h2>
          <p className="text-base md:text-lg leading-snug text-white/80 mt-4 max-w-2xl mx-auto animate-fade-in-up delay-100">
            Pick a plan and launch your personal agent today.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-fade-in-up delay-200">
            <Link to="/pricing">
              <Button className="text-[#0070d1] bg-white hover:bg-white/95 rounded-full px-10 h-12 text-lg font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-black/10">
                View Pricing
              </Button>
            </Link>
            <Link to="/register">
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 rounded-full px-10 h-12 text-lg font-bold transition-transform hover:scale-105 active:scale-95"
              >
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
