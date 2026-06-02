import { createFileRoute, Link } from '@tanstack/react-router'
import { Footer } from '#/components/Footer'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Shield, Database, Lock, ExternalLink, UserCheck, Cookie, Mail } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { ModeToggle } from '#/components/mode-toggle'
import { authClient } from '#/lib/auth-client'
import { isAdmin } from '#/lib/roles'

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
})

function PrivacyPage() {
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
            <Shield className="w-3.5 h-3.5" />
            Privacy Policy
          </span>
          <h1 className="text-[32px] md:text-[48px] font-light leading-[1.15] tracking-[-0.5px] font-['Roboto'] animate-fade-in-up delay-100">
            Your Data, Your Control
          </h1>
          <p className="text-base leading-snug text-foreground/70 mt-4 animate-fade-in-up delay-200">
            We take your privacy seriously. This policy explains what we collect, how we use it, and how we keep it safe.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white dark:bg-black text-foreground py-12 pb-24">
        <div className="max-w-3xl mx-auto px-6 space-y-6">
          <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 md:p-8 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <Database className="h-5 w-5 text-[#0070d1]" />
              <h2 className="text-xl font-semibold">Data We Collect</h2>
            </div>
            <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
              <p>
                We collect only the information necessary to provide you with a personalized AI assistant experience. This includes:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Account details:</strong> name, email address, and university affiliation.</li>
                <li><strong>Academic content:</strong> lecture notes, uploaded documents, and assignment descriptions you choose to share with your agent.</li>
                <li><strong>Calendar & email integrations:</strong> event data and read-only email metadata to enable scheduling and reminders. We do not read the content of your emails unless explicitly authorized for a specific service.</li>
                <li><strong>Agent interactions:</strong> chat messages and command history to improve context memory and service quality.</li>
                <li><strong>Usage analytics:</strong> service run counts, feature usage, and error logs.</li>
              </ul>
            </div>
          </div>

          <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 md:p-8 animate-fade-in-up delay-100">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-5 w-5 text-[#0070d1]" />
              <h2 className="text-xl font-semibold">How We Use Your Data</h2>
            </div>
            <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
              <p>Your data is used strictly to deliver and improve AgentHub services:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Powering your personal AI agent with relevant context and memory.</li>
                <li>Running services such as lecture summarization, report generation, and job application tracking.</li>
                <li>Synchronizing with your connected calendars and email for scheduling assistance.</li>
                <li>Sending important account and service-related notifications.</li>
                <li>Aggregating anonymized analytics to improve platform performance and reliability.</li>
              </ul>
              <p>We <strong>never</strong> sell your personal data or academic content to third parties.</p>
            </div>
          </div>

          <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 md:p-8 animate-fade-in-up delay-200">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="h-5 w-5 text-[#0070d1]" />
              <h2 className="text-xl font-semibold">Data Storage & Security</h2>
            </div>
            <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
              <p>
                We use industry-standard encryption at rest and in transit. All data is stored in secure, SOC 2-compliant cloud infrastructure.
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>TLS 1.3 for all data in transit.</li>
                <li>AES-256 encryption for data at rest.</li>
                <li>Strict access controls with role-based permissions for staff.</li>
                <li>Regular automated backups and disaster recovery plans.</li>
                <li>Isolated containers ensure your agent data is logically separated from other users.</li>
              </ul>
            </div>
          </div>

          <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 md:p-8 animate-fade-in-up delay-300">
            <div className="flex items-center gap-3 mb-4">
              <ExternalLink className="h-5 w-5 text-[#0070d1]" />
              <h2 className="text-xl font-semibold">Third-Party Services</h2>
            </div>
            <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
              <p>We integrate with trusted third-party providers to deliver core features:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Telegram API:</strong> for agent bot messaging. Shared data is limited to message delivery.</li>
                <li><strong>Google Calendar & Gmail APIs:</strong> for scheduling and notification services. Access is scoped and revocable at any time in your settings.</li>
                <li><strong>LiteLLM Gateway:</strong> for AI model inference. Prompts may be processed through vetted LLM providers under strict data processing agreements.</li>
                <li><strong>Payment processors:</strong> billing details are handled securely by PCI-DSS compliant providers. We do not store full payment card data.</li>
              </ul>
            </div>
          </div>

          <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 md:p-8 animate-fade-in-up delay-400">
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="h-5 w-5 text-[#0070d1]" />
              <h2 className="text-xl font-semibold">Your Rights</h2>
            </div>
            <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
              <p>You have the right to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Access and export a copy of your personal data at any time.</li>
                <li>Correct inaccurate or incomplete information.</li>
                <li>Request deletion of your account and associated data, subject to legal retention requirements.</li>
                <li>Withdraw consent for optional data processing (e.g., calendar sync) without impacting core service functionality.</li>
                <li>Object to processing for direct marketing or non-essential analytics.</li>
              </ul>
              <p>To exercise these rights, contact us at <a href="mailto:privacy@agenthub.dev" className="text-[#0070d1] hover:underline">privacy@agenthub.dev</a>.</p>
            </div>
          </div>

          <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 md:p-8 animate-fade-in-up delay-500">
            <div className="flex items-center gap-3 mb-4">
              <Cookie className="h-5 w-5 text-[#0070d1]" />
              <h2 className="text-xl font-semibold">Cookies</h2>
            </div>
            <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
              <p>
                We use cookies and similar technologies to authenticate users, remember preferences, and analyze traffic. Essential cookies are required for the platform to function.
              </p>
              <p>
                You can manage cookie preferences through your browser settings. Disabling certain cookies may limit features such as theme persistence or session management.
              </p>
            </div>
          </div>

          <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 md:p-8 animate-fade-in-up delay-600">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="h-5 w-5 text-[#0070d1]" />
              <h2 className="text-xl font-semibold">Contact</h2>
            </div>
            <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
              <p>
                If you have questions about this policy or how we handle your data, reach out to us:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Email: <a href="mailto:privacy@agenthub.dev" className="text-[#0070d1] hover:underline">privacy@agenthub.dev</a></li>
                <li>Address: AgentHub Inc., Kampala, Uganda</li>
              </ul>
              <p>We aim to respond to all privacy inquiries within 48 hours.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
