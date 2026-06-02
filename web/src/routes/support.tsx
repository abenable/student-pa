import { createFileRoute, Link } from '@tanstack/react-router'
import { Footer } from '#/components/Footer'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, HelpCircle, Mail, BookOpen, MessageSquare, Bot, Calendar, Play, CreditCard, KeyRound, Send, ChevronUp, LifeBuoy } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { ModeToggle } from '#/components/mode-toggle'
import { authClient } from '#/lib/auth-client'
import { isAdmin } from '#/lib/roles'
import { Input } from '#/components/ui/input'

export const Route = createFileRoute('/support')({
  component: SupportPage,
})

const faqs = [
  {
    id: 'create-agent',
    question: 'How do I create an agent?',
    answer:
      'Go to your Dashboard and click "Provision Agent". Choose a name, avatar, and personality for your agent. Once created, we will host your agent and provide a Telegram bot link you can start chatting with immediately. You can customize workflows and enable services from the agent settings page.',
    icon: Bot,
  },
  {
    id: 'connect-calendar',
    question: 'How do I connect my calendar?',
    answer:
      'Navigate to Dashboard → Settings → Integrations. Click "Connect Google Calendar" and authorize AgentHub to access your calendar. You can revoke this access at any time. Once connected, your agent can read your schedule, set reminders, and suggest optimal study times.',
    icon: Calendar,
  },
  {
    id: 'run-services',
    question: 'How do I run services?',
    answer:
      'Open your Dashboard and go to the Products page. Browse available workflows like Lecture Summarizer, Report Generator, or Job Tracker. Click on a workflow to configure it, then either run it manually or set up triggers so your agent runs it automatically based on schedules or chat commands.',
    icon: Play,
  },
  {
    id: 'billing',
    question: 'How does billing work?',
    answer:
      'All paid plans start with a 7-day free trial. During signup, you provide a payment method, but you will not be charged until the trial ends. You can cancel anytime before then at no cost. After the trial, you are billed monthly. Invoices are emailed to your registered address.',
    icon: CreditCard,
  },
  {
    id: 'recovery',
    question: 'How do I recover my account?',
    answer:
      'If you forgot your password, use the "Forgot Password" link on the login page. We will send a secure reset link to your email. If you no longer have access to your email, contact support with proof of ownership and we will help you regain access.',
    icon: KeyRound,
  },
]

function SupportPage() {
  const { data: session } = authClient.useSession()
  const isAuth = !!session?.user
  const isAdminUser = isAdmin((session?.user as any)?.role)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [openFaq, setOpenFaq] = useState<string | null>('create-agent')
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formMessage, setFormMessage] = useState('')

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
            <LifeBuoy className="w-3.5 h-3.5" />
            Help Center
          </span>
          <h1 className="text-[32px] md:text-[48px] font-light leading-[1.15] tracking-[-0.5px] font-['Roboto'] animate-fade-in-up delay-100">
            How Can We Help?
          </h1>
          <p className="text-base leading-snug text-foreground/70 mt-4 animate-fade-in-up delay-200">
            Find answers, browse FAQs, or reach out to our support team.
          </p>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="bg-white dark:bg-black text-foreground py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 text-center card-hover-lift animate-fade-in-up">
              <div className="h-12 w-12 rounded-full bg-[#0070d1]/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-5 w-5 text-[#0070d1]" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Email Support</h3>
              <p className="text-sm text-foreground/60 mb-3">We usually reply within 24 hours.</p>
              <a href="mailto:support@agenthub.dev" className="text-sm text-[#0070d1] hover:underline">support@agenthub.dev</a>
            </div>

            <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 text-center card-hover-lift animate-fade-in-up delay-100">
              <div className="h-12 w-12 rounded-full bg-[#0070d1]/10 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-5 w-5 text-[#0070d1]" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Documentation</h3>
              <p className="text-sm text-foreground/60 mb-3">Read guides and API references.</p>
              <a href="https://docs.agenthub.dev" target="_blank" rel="noreferrer" className="text-sm text-[#0070d1] hover:underline inline-flex items-center gap-1">
                View Docs <ExternalLinkIcon />
              </a>
            </div>

            <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 text-center card-hover-lift animate-fade-in-up delay-200">
              <div className="h-12 w-12 rounded-full bg-[#0070d1]/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-5 w-5 text-[#0070d1]" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Community</h3>
              <p className="text-sm text-foreground/60 mb-3">Ask questions and share tips.</p>
              <a href="https://discord.gg/agenthub" target="_blank" rel="noreferrer" className="text-sm text-[#0070d1] hover:underline inline-flex items-center gap-1">
                Join Discord <ExternalLinkIcon />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="bg-[#f5f7fa] dark:bg-[#181818] py-12">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-8">
            <HelpCircle className="h-6 w-6 text-[#0070d1]" />
            <h2 className="text-2xl font-semibold">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === faq.id
              const Icon = faq.icon
              return (
                <div
                  key={faq.id}
                  className="bg-white dark:bg-[#121314] rounded-xl border border-border/50 overflow-hidden animate-fade-in-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-accent/50 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-lg bg-[#0070d1]/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-[#0070d1]" />
                    </div>
                    <span className="flex-1 text-sm font-semibold text-foreground">{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-0 pl-[4.5rem]">
                      <p className="text-sm text-foreground/80 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="bg-white dark:bg-black text-foreground py-12 pb-24">
        <div className="max-w-2xl mx-auto px-6">
          <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 md:p-8 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-1">
              <Send className="h-5 w-5 text-[#0070d1]" />
              <h2 className="text-xl font-semibold">Contact Us</h2>
            </div>
            <p className="text-sm text-foreground/60 mb-6">Have a question that is not answered above? Send us a message.</p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-sm font-medium">Name</label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="bg-background"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="message" className="text-sm font-medium">Message</label>
                <textarea
                  id="message"
                  rows={5}
                  placeholder="Describe your issue or question..."
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="flex items-center justify-end">
                <Button
                  type="submit"
                  className="bg-[#0070d1] text-white hover:bg-[#0064b7] rounded-full px-8 h-11 font-semibold transition-transform hover:scale-[1.02] active:scale-95"
                >
                  Send Message
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function ExternalLinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}
