import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { Check, Zap, Crown, Building2, Gift, ChevronDown } from 'lucide-react'
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
    price: '$0',
    period: '/month',
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
    price: '$12',
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
    price: '$39',
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

  // Demo: all logged-in users shown as "Individual" plan for now
  const currentPlanName = isAdmin ? 'Enterprise' : 'Individual'

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      {/* Nav */}
      <nav className="sticky top-0 z-50 h-12 bg-black flex items-center justify-between px-4 md:px-6 border-b border-foreground/10">
        <Link to="/" className="!text-white font-bold text-sm tracking-[0.4px] hover:!text-white/80">
          AgentHub
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {isAuth ? (
            <>
              <Link to="/dashboard" className="px-3 py-1.5 text-sm font-medium transition-colors !text-white/70 hover:!text-white">
                Dashboard
              </Link>
              <Link to="/pricing" className="px-3 py-1.5 text-sm font-medium transition-colors !text-white">
                Pricing
              </Link>
              <Link to="/dashboard/settings" className="px-3 py-1.5 text-sm font-medium transition-colors !text-white/70 hover:!text-white">
                Settings
              </Link>
              {isAdmin && (
                <Link to="/dashboard/admin" className="px-3 py-1.5 text-sm font-medium transition-colors !text-white/70 hover:!text-white">
                  Admin
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/" className="px-3 py-1.5 text-sm font-medium transition-colors !text-white/70 hover:!text-white">
                Home
              </Link>
              <Link to="/pricing" className="px-3 py-1.5 text-sm font-medium transition-colors !text-white hover:!text-white">
                Pricing
              </Link>
              <Link to="/login" className="px-3 py-1.5 text-sm font-medium transition-colors !text-white/70 hover:!text-white">
                Sign In
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ModeToggle />
          {isAuth ? (
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setDropdownOpen((prev) => !prev)} className="flex items-center gap-1.5 outline-none" aria-label="User menu">
                <div className="h-8 w-8 rounded-full bg-white/10 text-white flex items-center justify-center text-xs font-semibold">
                  {initials}
                </div>
                <ChevronDown className="h-4 w-4 text-white/70" />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#181818] rounded-lg shadow-lg border border-black/10 dark:border-white/10 py-2 z-50">
                  <div className="px-4 py-2 border-b border-black/5 dark:border-white/10">
                    <p className="text-sm font-semibold text-black dark:text-white truncate">{session?.user?.name || 'User'}</p>
                    <p className="text-xs text-black/60 dark:text-white/60 truncate">{session?.user?.email}</p>
                  </div>
                  <Link to="/dashboard/settings" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-black dark:text-white hover:bg-[#f5f7fa] dark:hover:bg-[#121314]">Settings</Link>
                  <button onClick={() => { setDropdownOpen(false); authClient.signOut({ fetchOptions: { onSuccess: () => window.location.href = '/' } }) }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-[#f5f7fa] dark:hover:bg-[#121314]">Sign out</button>
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
      <section className="bg-background text-foreground py-12 md:py-16 text-center">
        <div className="mx-auto px-6" style={{ maxWidth: '768px' }}>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0070d1]/10 text-[#0070d1] text-sm font-bold mb-4">
            7-Day Free Trial on All Paid Plans
          </span>
          <h1 className="text-[32px] md:text-[44px] font-light leading-[1.2] tracking-[-0.1px] font-['Roboto']">
            Simple, Transparent Pricing
          </h1>
          <p className="text-base leading-snug text-foreground/70 mt-4">
            Start free. Upgrade when you are ready. No credit card required for the trial.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="bg-white dark:bg-black text-black dark:text-white py-12 pb-24">
        <div className="mx-auto px-6" style={{ maxWidth: '1200px' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {plans.map((plan) => {
              const isCurrentPlan = isAuth && plan.name === currentPlanName
              return (
                <div
                  key={plan.name}
                  className={`relative bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-8 flex flex-col transition-all ${
                    plan.badge ? 'ring-2 ring-[#0070d1]' : ''
                  } ${
                    isCurrentPlan
                      ? 'ring-2 ring-green-500 scale-[1.02] shadow-lg shadow-green-500/10'
                      : ''
                  }`}
                >
                  {plan.badge && !isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-[#0070d1] text-white text-xs font-bold px-3 py-1 rounded-full">
                        {plan.badge}
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
                    <div className="h-10 w-10 rounded-full bg-[#0070d1]/10 flex items-center justify-center">
                      <plan.icon className="h-5 w-5 text-[#0070d1]" />
                    </div>
                    <h3 className="text-[22px] font-light tracking-[0.1px] font-['Roboto']">
                      {plan.name}
                    </h3>
                  </div>

                  <p className="text-xs text-[#0070d1] font-semibold mb-3">{plan.audience}</p>

                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-[44px] font-light leading-none text-black dark:text-white">
                      {plan.price}
                    </span>
                    <span className="text-black/50 dark:text-white/50 text-sm">
                      {plan.period}
                    </span>
                  </div>

                  <p className="text-sm text-black/60 dark:text-white/60 mb-6">
                    {plan.description}
                  </p>

                  {isCurrentPlan ? (
                    <Link to="/dashboard" className="mb-8">
                      <Button
                        className="w-full rounded-full h-12 text-lg font-bold bg-green-500 text-white hover:bg-green-600"
                      >
                        Go to Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <Link to={plan.ctaLink} className="mb-8">
                      <Button
                        className={`w-full rounded-full h-12 text-lg font-bold ${
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

                <ul className="space-y-1.5 mt-auto">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-[#0070d1] shrink-0 mt-0.5" />
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
      <section className="bg-[#f5f7fa] dark:bg-[#181818] py-16">
        <div className="mx-auto px-6 text-center" style={{ maxWidth: '768px' }}>
          <h2 className="text-[32px] md:text-[44px] font-light leading-[1.25] tracking-[0.1px] font-['Roboto'] text-black dark:text-white">
            Earn Free Weeks
          </h2>
          <p className="text-lg md:text-xl leading-relaxed text-black/60 dark:text-white/60 mt-4">
            Refer a friend and you both get a free week. No limits — invite as many as you want.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/register">
              <Button className="bg-[#0070d1] text-white hover:bg-[#0064b7] rounded-full px-10 h-12 text-lg font-bold">
                Get Your Code
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ / Trial Info */}
      <section className="bg-[#0070d1] text-white py-16">
        <div className="mx-auto px-6 text-center" style={{ maxWidth: '768px' }}>
          <h2 className="text-[32px] md:text-[44px] font-light leading-[1.25] tracking-[0.1px] font-['Roboto']">
            7-Day Free Trial
          </h2>
          <p className="text-lg md:text-xl leading-relaxed text-white/80 mt-4">
            Every paid plan starts with a full week on us. Cancel anytime before the trial ends and you will not be charged.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/register">
              <Button className="text-[#0070d1] bg-white hover:bg-white/90 rounded-full px-10 h-12 text-lg font-bold">
                Start Free Trial
              </Button>
            </Link>
            <Link to="/">
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 rounded-full px-10 h-12 text-lg font-bold"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0070d1] text-white py-12 border-t border-white/10">
        <div className="mx-auto px-6" style={{ maxWidth: '1152px' }}>
          <div className="text-2xl font-bold">AgentHub</div>
          <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-sm text-white/80">
              &copy; 2026 AgentHub. Student intelligence, redefined.
            </span>
            <div className="flex items-center gap-6">
              <Link to="/" className="text-white/80 hover:text-white text-sm transition-colors">
                Privacy
              </Link>
              <Link to="/" className="text-white/80 hover:text-white text-sm transition-colors">
                Terms
              </Link>
              <Link to="/" className="text-white/80 hover:text-white text-sm transition-colors">
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
