import { createFileRoute, Link } from '@tanstack/react-router'
import { Footer } from '#/components/Footer'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, FileText, Bot, CreditCard, Brain, Scale, Gavel, RefreshCw, Globe, Mail } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { ModeToggle } from '#/components/mode-toggle'
import { authClient } from '#/lib/auth-client'
import { isAdmin } from '#/lib/roles'

export const Route = createFileRoute('/terms')({
  component: TermsPage,
})

function TermsPage() {
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
      <nav className="sticky top-0 z-50 h-12 bg-background/90 backdrop-blur-md flex items-center justify-between px-4 md:px-6 border-b border-border/50">
        <Link to="/" className="brand-logo hover:opacity-90 transition-opacity">
          AgentHub
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {isAuth ? (
            <>
              <Link to="/dashboard" className="px-3 py-1.5 text-sm font-medium transition-colors text-foreground/70 hover:text-foreground relative group">
                Dashboard
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#0070d1] transition-all duration-300 group-hover:w-4/5 rounded-full" />
              </Link>
              <Link to="/services" className="px-3 py-1.5 text-sm font-medium transition-colors text-foreground/70 hover:text-foreground relative group">
                Services
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#0070d1] transition-all duration-300 group-hover:w-4/5 rounded-full" />
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
              <Link to="/services" className="px-3 py-1.5 text-sm font-medium transition-colors text-foreground/70 hover:text-foreground relative group">
                Services
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#0070d1] transition-all duration-300 group-hover:w-4/5 rounded-full" />
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
                <div className="absolute right-0 mt-2 w-56 bg-popover rounded-lg shadow-lg border border-border py-2 z-50 animate-scale-in">
                  <div className="px-4 py-2 border-b border-border/50">
                    <p className="text-sm font-semibold text-popover-foreground truncate">{session?.user?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                  </div>
                  <Link to="/dashboard/settings" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent transition-colors">Settings</Link>
                  <button onClick={() => { setDropdownOpen(false); authClient.signOut({ fetchOptions: { onSuccess: () => { window.location.href = '/' } } }) }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-accent transition-colors">Sign out</button>
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
            <FileText className="w-3.5 h-3.5" />
            Terms of Service
          </span>
          <h1 className="text-[32px] md:text-[48px] font-light leading-[1.15] tracking-[-0.5px] font-['Roboto'] animate-fade-in-up delay-100">
            Rules of the Road
          </h1>
          <p className="text-base leading-snug text-foreground/70 mt-4 animate-fade-in-up delay-200">
            By using AgentHub, you agree to these terms. Please read them carefully.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white dark:bg-black text-foreground py-12 pb-24">
        <div className="max-w-3xl mx-auto px-6 space-y-6">
          <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 md:p-8 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-5 w-5 text-[#0070d1]" />
              <h2 className="text-xl font-semibold">Acceptance of Terms</h2>
            </div>
            <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
              <p>
                By accessing or using AgentHub, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, you may not use our services. These terms apply to all visitors, users, and others who access or use the platform.
              </p>
            </div>
          </div>

          <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 md:p-8 animate-fade-in-up delay-100">
            <div className="flex items-center gap-3 mb-4">
              <Bot className="h-5 w-5 text-[#0070d1]" />
              <h2 className="text-xl font-semibold">Service Description</h2>
            </div>
            <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
              <p>
                AgentHub provides students with personal AI agents via Telegram bots, managed hosting, and customisable workflows. We also offer LLM API access through our unified gateway.
              </p>
              <p>
                <strong>AI-generated content limitations:</strong> Outputs from our AI agents are generated by large language models and may occasionally be inaccurate, incomplete, or outdated. You should always verify critical academic, legal, or financial information before acting on it. AgentHub is not responsible for decisions made based on AI-generated content.
              </p>
            </div>
          </div>

          <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 md:p-8 animate-fade-in-up delay-200">
            <div className="flex items-center gap-3 mb-4">
              <UserCheckIcon />
              <h2 className="text-xl font-semibold">User Accounts</h2>
            </div>
            <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
              <p>To use AgentHub, you must create an account with accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use.</p>
              <p>Accounts are personal and non-transferable. Sharing login credentials or reselling access is prohibited.</p>
            </div>
          </div>

          <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 md:p-8 animate-fade-in-up delay-300">
            <div className="flex items-center gap-3 mb-4">
              <Gavel className="h-5 w-5 text-[#0070d1]" />
              <h2 className="text-xl font-semibold">Acceptable Use</h2>
            </div>
            <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
              <p>You agree not to use AgentHub to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Violate any applicable laws or regulations.</li>
                <li>Infringe on the intellectual property rights of others.</li>
                <li>Upload malicious code, malware, or harmful content.</li>
                <li>Harass, abuse, or harm another person.</li>
                <li>Attempt to gain unauthorized access to our systems or other users' data.</li>
                <li>Use the platform for illegal academic dishonesty such as exam cheating or plagiarism.</li>
              </ul>
            </div>
          </div>

          <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 md:p-8 animate-fade-in-up delay-400">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="h-5 w-5 text-[#0070d1]" />
              <h2 className="text-xl font-semibold">Subscriptions & Billing</h2>
            </div>
            <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
              <p>AgentHub offers paid subscription plans billed on a monthly basis. All paid plans begin with a <strong>7-day free trial</strong>. You will not be charged if you cancel before the trial ends.</p>
              <p>After the trial, your subscription will automatically renew each month unless cancelled. You can cancel anytime from your account settings. No refunds are provided for partial months.</p>
              <p>We reserve the right to change pricing with 30 days' advance notice. Any price changes will take effect at the start of your next billing cycle.</p>
            </div>
          </div>

          <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 md:p-8 animate-fade-in-up delay-500">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="h-5 w-5 text-[#0070d1]" />
              <h2 className="text-xl font-semibold">Intellectual Property</h2>
            </div>
            <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
              <p>AgentHub and its original content, features, and functionality are and will remain the exclusive property of AgentHub Inc. The service is protected by copyright, trademark, and other laws.</p>
              <p>You retain ownership of any content you upload. By uploading content, you grant us a limited license to use it solely to provide and improve our services.</p>
            </div>
          </div>

          <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 md:p-8 animate-fade-in-up delay-600">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="h-5 w-5 text-[#0070d1]" />
              <h2 className="text-xl font-semibold">Limitation of Liability</h2>
            </div>
            <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
              <p>
                AgentHub is provided "as is" without warranties of any kind. To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of the service.
              </p>
              <p>
                Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim, or UGX 100,000 if you have not paid for the service.
              </p>
            </div>
          </div>

          <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 md:p-8 animate-fade-in-up delay-700">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className="h-5 w-5 text-[#0070d1]" />
              <h2 className="text-xl font-semibold">Termination</h2>
            </div>
            <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
              <p>We may suspend or terminate your account immediately, without prior notice, for conduct that we believe violates these terms or is harmful to other users, us, or third parties.</p>
              <p>Upon termination, your right to use the service will cease immediately. All provisions of these terms that by their nature should survive termination shall survive.</p>
            </div>
          </div>

          <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 md:p-8 animate-fade-in-up delay-800">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="h-5 w-5 text-[#0070d1]" />
              <h2 className="text-xl font-semibold">Governing Law</h2>
            </div>
            <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
              <p>These terms shall be governed by and construed in accordance with the laws of Uganda, without regard to its conflict of law provisions. Any disputes shall be resolved in the courts of Uganda.</p>
            </div>
          </div>

          <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 md:p-8 animate-fade-in-up delay-900">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className="h-5 w-5 text-[#0070d1]" />
              <h2 className="text-xl font-semibold">Changes to Terms</h2>
            </div>
            <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
              <p>We may update these terms from time to time. If changes are material, we will notify you via email or through the platform at least 14 days before they take effect. Your continued use of AgentHub after changes constitutes acceptance.</p>
            </div>
          </div>

          <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 md:p-8 animate-fade-in-up delay-1000">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="h-5 w-5 text-[#0070d1]" />
              <h2 className="text-xl font-semibold">Contact</h2>
            </div>
            <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
              <p>For questions about these terms, contact us at <a href="mailto:legal@agenthub.dev" className="text-[#0070d1] hover:underline">legal@agenthub.dev</a>.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function UserCheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0070d1]">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  )
}
