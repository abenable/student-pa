import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { Check, Zap, Crown, Building2, Gift, ChevronDown, Sparkles } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { ModeToggle } from '#/components/mode-toggle'
import { authClient } from '#/lib/auth-client'

export const Route = createFileRoute('/pricing')({
  component: PricingPage,
})

const plans = [
  {
    name: 'Student',
    icon: Zap,
    price: 'Free',
    period: '',
    description: 'Try the agent with limited runs.',
    cta: 'Get Started',
    ctaLink: '/register',
    ctaVariant: 'outline' as const,
    audience: 'For individual students',
    features: [
      '3 service runs per month',
      '1 agent profile',
      'Email & calendar sync',
      'Community support',
    ],
  },
  {
    name: 'Individual',
    icon: Crown,
    price: 'UGX 44,000',
    period: '/month',
    description: 'Unlimited access for serious students.',
    cta: 'Start 7-Day Free Trial',
    ctaLink: '/register',
    ctaVariant: 'primary' as const,
    badge: 'Most Popular',
    audience: 'For power users',
    features: [
      'Unlimited service runs',
      '1 agent profile',
      'Priority email & calendar sync',
      'LaTeX report engine',
      'Job application tracker',
      'Paper interrogator',
      'Lecture summarizer',
      'Priority support',
    ],
  },
  {
    name: 'Team',
    icon: Building2,
    price: 'UGX 143,000',
    period: '/month',
    description: 'For study groups and labs.',
    cta: 'Start 7-Day Free Trial',
    ctaLink: '/register',
    ctaVariant: 'outline' as const,
    audience: 'For study groups',
    features: [
      'Everything in Individual',
      'Up to 5 agent profiles',
      'Shared workspace',
      'Admin dashboard',
      'Usage analytics',
      'Custom integrations',
      'Dedicated support',
    ],
  },
  {
    name: 'Enterprise',
    icon: Gift,
    price: 'Custom',
    period: '',
    description: 'For universities, institutions and large organizations.',
    cta: 'Contact Sales',
    ctaLink: 'mailto:sales@agenthub.dev',
    ctaVariant: 'outline' as const,
    audience: 'For institutions',
    features: [
      'Everything in Team',
      'Unlimited agents',
      'SLA & dedicated account manager',
      'On-premise deployment option',
      'Advanced security & compliance',
      'Custom training & onboarding',
    ],
  },
]

function PricingPage() {
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

  const currentPlanName = isAdmin ? 'Enterprise' : 'Individual'

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 h-12 bg-black/90 backdrop-blur-md flex items-center justify-between px-4 md:px-6 border-b border-white/5">
        <Link to="/" className="!text-white font-bold text-sm tracking-[0.4px] hover:!text-white/80 transition-colors">
          AgentHub
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {isAuth ? (
            <>
              <Link to="/dashboard" className="px-3 py-1.5 text-sm font-medium transition-colors !text-white/70 hover:!text-white relative group">
                Dashboard
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#0070d1] transition-all duration-300 group-hover:w-4/5 rounded-full" />
              </Link>
              <Link to="/pricing" className="px-3 py-1.5 text-sm font-medium transition-colors !text-white relative group">
                Pricing
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-0.5 bg-[#0070d1] rounded-full" />
              </Link>
              <Link to="/dashboard/settings" className="px-3 py-1.5 text-sm font-medium transition-colors !text-white/70 hover:!text-white relative group">
                Settings
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#0070d1] transition-all duration-300 group-hover:w-4/5 rounded-full" />
              </Link>
              {isAdmin && (
                <Link to="/dashboard/admin" className="px-3 py-1.5 text-sm font-medium transition-colors !text-white/70 hover:!text-white relative group">
                  Admin
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#0070d1] transition-all duration-300 group-hover:w-4/5 rounded-full" />
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/" className="px-3 py-1.5 text-sm font-medium transition-colors !text-white/70 hover:!text-white relative group">
                Home
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#0070d1] transition-all duration-300 group-hover:w-4/5 rounded-full" />
              </Link>
              <Link to="/pricing" className="px-3 py-1.5 text-sm font-medium transition-colors !text-white relative group">
                Pricing
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-0.5 bg-[#0070d1] rounded-full" />
              </Link>
              <Link to="/login" className="px-3 py-1.5 text-sm font-medium transition-colors !text-white/70 hover:!text-white relative group">
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
                <div className="h-8 w-8 rounded-full bg-white/10 text-white flex items-center justify-center text-xs font-semibold transition-transform group-hover:scale-105">
                  {initials}
                </div>
                <ChevronDown className="h-4 w-4 text-white/70 transition-transform duration-200" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
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
            7-Day Free Trial on All Paid Plans
          </span>
          <h1 className="text-[32px] md:text-[48px] font-light leading-[1.15] tracking-[-0.5px] font-['Roboto'] animate-fade-in-up delay-100">
            Simple, Transparent Pricing
          </h1>
          <p className="text-base leading-snug text-foreground/70 mt-4 animate-fade-in-up delay-200">
            Start free. Upgrade when you are ready. No credit card required for the trial.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="bg-white dark:bg-black text-black dark:text-white py-12 pb-24 relative">
        <div className="mx-auto px-6" style={{ maxWidth: '1200px' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {plans.map((plan, i) => {
              const isCurrentPlan = isAuth && plan.name === currentPlanName
              return (
                <div
                  key={plan.name}
                  className={`relative bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-8 flex flex-col card-hover-lift card-glow animate-fade-in-up ${
                    plan.badge ? 'ring-2 ring-[#0070d1]' : ''
                  } ${
                    isCurrentPlan
                      ? 'ring-2 ring-green-500 scale-[1.02] shadow-lg shadow-green-500/10'
                      : ''
                  }`}
                  style={{ animationDelay: `${200 + i * 100}ms` }}
                >
                  {plan.badge && !isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 overflow-hidden rounded-full">
                      <span className="relative bg-[#0070d1] text-white text-xs font-bold px-3 py-1 rounded-full block">
                        {plan.badge}
                        <span className="absolute inset-0 animate-shimmer rounded-full" />
                      </span>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Current Plan
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-[#0070d1]/10 flex items-center justify-center transition-transform duration-300 hover:scale-110">
                      <plan.icon className="h-5 w-5 text-[#0070d1]" />
                    </div>
                    <h3 className="text-[22px] font-light tracking-[0.1px] font-['Roboto']">
                      {plan.name}
                    </h3>
                  </div>

                  <p className="text-xs text-[#0070d1] font-semibold mb-3">{plan.audience}</p>

                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-[28px] md:text-[32px] font-semibold leading-none text-black dark:text-white">
                      {plan.price}
                    </span>
                    <span className="text-black/50 dark:text-white/50 text-sm font-medium">
                      {plan.period}
                    </span>
                  </div>

                  <p className="text-sm text-black/60 dark:text-white/60 mb-6">
                    {plan.description}
                  </p>

                  {isCurrentPlan ? (
                    <Link to="/dashboard" className="mb-8">
                      <Button
                        className="w-full rounded-full h-12 text-lg font-bold bg-green-500 text-white hover:bg-green-600 transition-transform hover:scale-[1.02] active:scale-95"
                      >
                        Go to Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <Link to={plan.ctaLink} className="mb-8">
                      <Button
                        className={`w-full rounded-full h-12 text-lg font-bold transition-transform hover:scale-[1.02] active:scale-95 ${
                          plan.ctaVariant === 'primary'
                            ? 'bg-[#0070d1] text-white hover:bg-[#0064b7]'
                            : 'border-foreground/20 text-foreground hover:bg-foreground/5'
                        }`}
                        variant={plan.ctaVariant === 'primary' ? 'default' : 'outline'}
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  )}

                  <ul className="space-y-2.5 mt-auto">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 group/item">
                        <Check className="h-5 w-5 text-[#0070d1] shrink-0 mt-0.5 transition-transform group-hover/item:scale-110" />
                        <span className="text-sm text-black/80 dark:text-white/80">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Referral Section */}
      <section className="bg-[#f5f7fa] dark:bg-[#181818] py-14 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="orb orb-green w-64 h-64 top-0 right-0 animate-blob" style={{ animationDelay: '4s' }} />
        </div>
        <div className="relative mx-auto px-6 text-center" style={{ maxWidth: '768px' }}>
          <h2 className="text-[32px] md:text-[44px] font-light leading-[1.15] tracking-[-0.5px] font-['Roboto'] text-black dark:text-white animate-fade-in-up">
            Earn Free Weeks
          </h2>
          <p className="text-lg md:text-xl leading-relaxed text-black/60 dark:text-white/60 mt-4 animate-fade-in-up delay-100">
            Refer a friend and you both get a free week. No limits — invite as many as you want.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 animate-fade-in-up delay-200">
            <Link to="/register">
              <Button className="bg-[#0070d1] text-white hover:bg-[#0064b7] rounded-full px-10 h-12 text-lg font-bold transition-transform hover:scale-105 active:scale-95">
                Get Your Code
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ / Trial Info */}
      <section className="relative bg-[#0070d1] text-white py-14 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 animate-gradient-shift" style={{ backgroundSize: '200% 200%' }} />
        </div>
        <div className="relative mx-auto px-6 text-center" style={{ maxWidth: '768px' }}>
          <h2 className="text-[32px] md:text-[44px] font-light leading-[1.15] tracking-[-0.5px] font-['Roboto'] animate-fade-in-up">
            7-Day Free Trial
          </h2>
          <p className="text-lg md:text-xl leading-relaxed text-white/80 mt-4 animate-fade-in-up delay-100">
            Every paid plan starts with a full week on us. Cancel anytime before the trial ends and you will not be charged.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 animate-fade-in-up delay-200">
            <Link to="/register">
              <Button className="text-[#0070d1] bg-white hover:bg-white/95 rounded-full px-10 h-12 text-lg font-bold transition-transform hover:scale-105 active:scale-95 shadow-xl shadow-black/10">
                Start Free Trial
              </Button>
            </Link>
            <Link to="/">
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 rounded-full px-10 h-12 text-lg font-bold transition-transform hover:scale-105 active:scale-95"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background text-foreground py-4 border-t border-border">
        <div className="mx-auto px-6" style={{ maxWidth: '1152px' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              &copy; 2026 AgentHub. Student intelligence, redefined.
            </span>
            <div className="flex items-center gap-5">
              <Link to="/" className="text-muted-foreground hover:text-foreground text-xs transition-colors">Privacy</Link>
              <Link to="/" className="text-muted-foreground hover:text-foreground text-xs transition-colors">Terms</Link>
              <Link to="/" className="text-muted-foreground hover:text-foreground text-xs transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
