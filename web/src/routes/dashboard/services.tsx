import { createFileRoute, Link } from '@tanstack/react-router'
import {
  User,
  Users,
  Building2,
  Workflow,
  BrainCircuit,
  ShieldCheck,
  Gauge,
  Zap,
  Mail,
  FileText,
  Briefcase,
  BookOpen,
  Video,
  ArrowRight,
  Network,
  Lock,
  LineChart,
  MessagesSquare,
  GitBranch,
  Sparkles,
} from 'lucide-react'

export const Route = createFileRoute('/dashboard/services')({
  component: ProductsPage,
})

const productTiers = [
  {
    id: 'personal',
    title: 'AgentHub Personal',
    subtitle: 'Your dedicated intelligence layer',
    icon: User,
    accent: '#0070d1',
    description:
      'A single, persistent agent that learns your preferences, manages your schedule, and executes workflows autonomously — while keeping you in control.',
    features: [
      { icon: MessagesSquare, text: 'Unique Telegram bot with persistent memory' },
      { icon: BrainCircuit, text: 'Context-aware reasoning across sessions' },
      { icon: Workflow, text: 'Built-in workflows: inbox, calendar, research, writing' },
      { icon: Zap, text: '24/7 event-driven execution with human-in-the-loop gates' },
      { icon: Gauge, text: 'Cost-optimized routing across LLM providers via LiteLLM' },
      { icon: Lock, text: 'Private, isolated conversations & encrypted state' },
    ],
    cta: 'Launch Your Agent',
    ctaTo: '/dashboard/onboarding' as const,
  },
  {
    id: 'team',
    title: 'AgentHub Teams',
    subtitle: 'Collaborative agent swarms',
    icon: Users,
    accent: '#10b981',
    description:
      'Multi-agent orchestration for research groups, startups, and departments. Deploy specialized agents that communicate, delegate, and build shared knowledge.',
    features: [
      { icon: Network, text: 'Agent-to-agent (A2A) communication & delegation protocols' },
      { icon: Users, text: 'Shared agent workspaces with role-based specialization' },
      { icon: BrainCircuit, text: 'Collaborative memory graphs & team knowledge bases' },
      { icon: GitBranch, text: 'Workflow pipelines with branching, review & consensus' },
      { icon: MessagesSquare, text: 'Slack, Discord & Microsoft Teams integrations' },
      { icon: LineChart, text: 'Team-wide usage analytics & cost allocation' },
    ],
    cta: 'Upgrade to Teams',
    ctaTo: '/pricing' as const,
  },
  {
    id: 'enterprise',
    title: 'AgentHub Enterprise',
    subtitle: 'Mission-critical orchestration at scale',
    icon: Building2,
    accent: '#8b5cf6',
    description:
      'Deployed inside your VPC with full governance, auditability, and enterprise integrations. The control plane for hundreds of agents across business units.',
    features: [
      { icon: ShieldCheck, text: 'SSO/SAML, RBAC, SOC2 & GDPR compliance frameworks' },
      { icon: Lock, text: 'On-premise or VPC-isolated model inference' },
      { icon: GitBranch, text: 'Advanced orchestration DAGs with deterministic execution' },
      { icon: LineChart, text: 'Real-time observability, evaluation & drift detection dashboards' },
      { icon: Network, text: 'Native integrations: SAP, Salesforce, Jira, GitHub, GSuite' },
      { icon: Gauge, text: 'Department-level cost controls, quotas & fallback chains' },
    ],
    cta: 'Contact Sales',
    ctaTo: '/support' as const,
  },
]

const capabilities = [
  {
    title: 'Dynamic Task Decomposition',
    description:
      'High-level goals are automatically broken into sub-tasks, routed to specialist agents, and re-assembled into coherent outputs.',
    icon: GitBranch,
  },
  {
    title: 'Intelligent Agent Router',
    description:
      'Our router evaluates task complexity, privacy requirements, and latency constraints to pick the optimal model and agent for every request.',
    icon: Network,
  },
  {
    title: 'Persistent Memory Layers',
    description:
      'Short-term conversation context, long-term user preferences, and team knowledge graphs — all queryable in milliseconds.',
    icon: BrainCircuit,
  },
  {
    title: 'Sandboxed Execution',
    description:
      'Every agent runs in an isolated Docker container with restricted network access, environment secrets, and automatic health checks.',
    icon: ShieldCheck,
  },
  {
    title: 'Multi-Model Gateway',
    description:
      'Unified LiteLLM gateway provides automatic failover, load balancing, and cost optimization across OpenAI, Anthropic, Mistral, and local models.',
    icon: Zap,
  },
  {
    title: 'Event-Driven Triggers',
    description:
      'Webhooks, cron schedules, Telegram commands, email filters, and calendar events — all wired into reactive agent pipelines.',
    icon: Workflow,
  },
]

const workflows = [
  {
    id: 'inbox-calendar',
    title: 'Inbox & Calendar Manager',
    description: 'Triage unread emails, draft replies, and sync deadlines to your calendar.',
    icon: Mail,
  },
  {
    id: 'lab-report',
    title: 'Lab Report LaTeX Typesetter',
    description: 'Generate beautifully formatted LaTeX lab reports with auto-compiled PDFs.',
    icon: FileText,
  },
  {
    id: 'job-application',
    title: 'Job Application Engine',
    description: 'Draft tailored cover letters, optimize your resume, and track applications.',
    icon: Briefcase,
  },
  {
    id: 'paper-interrogator',
    title: 'Academic Paper Interrogator',
    description: 'Upload PDFs, extract methodologies, summarize findings, and generate outlines.',
    icon: BookOpen,
  },
  {
    id: 'lecture-summarizer',
    title: 'Lecture & Video Summarizer',
    description: 'Convert lectures into searchable transcripts and chapterized summaries.',
    icon: Video,
  },
]

function ProductsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Hero */}
      <section className="text-center animate-fade-in-up">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0070d1]/10 text-[#0070d1] text-sm font-bold mb-5">
          <Sparkles className="w-3.5 h-3.5" />
          Agent Orchestration Platform
        </span>
        <h1 className="text-[32px] md:text-[48px] font-light leading-[1.15] tracking-[-0.5px] font-['Roboto'] text-black dark:text-white">
          The Operating System for<br className="hidden md:block" /> Agent Orchestration
        </h1>
        <p className="text-base md:text-lg leading-snug text-black/60 dark:text-white/60 mt-4 max-w-2xl mx-auto">
          The future isn&apos;t one AI assistant — it&apos;s orchestrated swarms of specialized agents
          that collaborate, delegate, and learn. From a single personal agent to
          enterprise-grade fleets, AgentHub is the control plane.
        </p>
      </section>

      {/* Product Tiers */}
      <section className="mt-16 md:mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        {productTiers.map((tier, i) => {
          const Icon = tier.icon
          return (
            <div
              key={tier.id}
              className="bg-[#f5f7fa] dark:bg-[#181818] rounded-2xl p-6 md:p-8 flex flex-col animate-fade-in-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${tier.accent}15` }}
              >
                <Icon size={28} strokeWidth={1.5} style={{ color: tier.accent }} />
              </div>
              <h2 className="text-[20px] md:text-[22px] font-medium leading-[1.25] tracking-[-0.2px] text-black dark:text-white mt-4">
                {tier.title}
              </h2>
              <p className="text-xs font-semibold mt-1 uppercase tracking-wide" style={{ color: tier.accent }}>
                {tier.subtitle}
              </p>
              <p className="text-sm text-black/60 dark:text-white/60 mt-3 leading-relaxed flex-1">
                {tier.description}
              </p>

              <ul className="mt-5 space-y-2.5">
                {tier.features.map((feature) => {
                  const FeatIcon = feature.icon
                  return (
                    <li key={feature.text} className="flex items-start gap-2.5">
                      <FeatIcon
                        size={16}
                        strokeWidth={1.5}
                        className="text-[#0070d1] shrink-0 mt-0.5"
                      />
                      <span className="text-sm text-black/80 dark:text-white/80 leading-snug">
                        {feature.text}
                      </span>
                    </li>
                  )
                })}
              </ul>

              <Link
                to={tier.ctaTo}
                className="mt-6 inline-flex items-center justify-center gap-2 bg-[#0070d1] text-white rounded-full px-6 py-3 h-11 text-sm font-bold hover:bg-[#0064b7] transition-all hover:scale-105 active:scale-95 w-full"
              >
                {tier.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )
        })}
      </section>

      {/* Capabilities Grid */}
      <section className="mt-20">
        <div className="mb-10">
          <h2 className="text-[28px] md:text-[36px] font-light leading-[1.15] tracking-[-0.5px] font-['Roboto'] text-black dark:text-white">
            Orchestration Engine
          </h2>
          <p className="text-base text-black/60 dark:text-white/60 mt-2 max-w-2xl">
            The infrastructure that makes multi-agent systems reliable, observable, and cost-effective at any scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap, i) => {
            const CapIcon = cap.icon
            return (
              <div
                key={cap.title}
                className="bg-white dark:bg-black border border-black/5 dark:border-white/5 rounded-xl p-6 card-hover-lift animate-fade-in-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-10 h-10 rounded-lg bg-[#0070d1]/10 flex items-center justify-center mb-4">
                  <CapIcon size={22} strokeWidth={1.5} className="text-[#0070d1]" />
                </div>
                <h3 className="text-base font-semibold text-black dark:text-white">
                  {cap.title}
                </h3>
                <p className="text-sm text-black/60 dark:text-white/60 mt-2 leading-relaxed">
                  {cap.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Workflow Catalog */}
      <section className="mt-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-[28px] md:text-[36px] font-light leading-[1.15] tracking-[-0.5px] font-['Roboto'] text-black dark:text-white">
              Workflow Catalog
            </h2>
            <p className="text-base text-black/60 dark:text-white/60 mt-2">
              Pre-built workflows you can run today with a single command.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {workflows.map((workflow) => {
            const Icon = workflow.icon
            return (
              <div
                key={workflow.id}
                className="bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6 flex flex-col card-hover-lift"
              >
                <Icon size={40} color="#0070d1" strokeWidth={1.5} />
                <h3 className="text-[18px] font-medium leading-[1.25] mt-4 text-black dark:text-white">
                  {workflow.title}
                </h3>
                <p className="text-sm text-black/60 dark:text-white/60 mt-2 flex-1">
                  {workflow.description}
                </p>
                <Link
                  to="/dashboard/services/$serviceId"
                  params={{ serviceId: workflow.id }}
                  className="mt-4 inline-flex bg-[#0070d1] text-white rounded-full px-6 py-2.5 h-10 items-center text-sm font-bold hover:bg-[#0064b7] transition-colors self-start"
                >
                  Run
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      {/* Architecture Insight */}
      <section className="mt-20 bg-gradient-to-br from-[#0070d1]/5 to-transparent dark:from-[#0070d1]/10 rounded-2xl p-8 md:p-10">
        <h2 className="text-[24px] md:text-[28px] font-medium leading-[1.25] tracking-[-0.2px] text-black dark:text-white">
          Why Orchestration Matters
        </h2>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-base text-black/70 dark:text-white/70 leading-relaxed">
              A single LLM call solves simple tasks. Real-world work is messy: it requires planning,
              tool use, verification, and often collaboration across domains. Agent orchestration is
              the layer that coordinates these steps — routing sub-tasks to the right models,
              maintaining state across long-running jobs, and gracefully handling failures.
            </p>
            <p className="text-base text-black/70 dark:text-white/70 leading-relaxed mt-4">
              Without orchestration, agents are expensive toys. With it, they become reliable
              coworkers that improve over time.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-white dark:bg-[#181818] rounded-xl p-4">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400 text-sm font-bold">
                1
              </div>
              <div>
                <p className="text-sm font-semibold text-black dark:text-white">Decompose</p>
                <p className="text-xs text-black/60 dark:text-white/60">Break goals into verifiable sub-tasks</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white dark:bg-[#181818] rounded-xl p-4">
              <div className="h-10 w-10 rounded-full bg-[#0070d1]/10 flex items-center justify-center text-[#0070d1] text-sm font-bold">
                2
              </div>
              <div>
                <p className="text-sm font-semibold text-black dark:text-white">Route</p>
                <p className="text-xs text-black/60 dark:text-white/60">Assign each sub-task to the best specialist</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white dark:bg-[#181818] rounded-xl p-4">
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 text-sm font-bold">
                3
              </div>
              <div>
                <p className="text-sm font-semibold text-black dark:text-white">Execute</p>
                <p className="text-xs text-black/60 dark:text-white/60">Run in sandboxed environments with full observability</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white dark:bg-[#181818] rounded-xl p-4">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 text-sm font-bold">
                4
              </div>
              <div>
                <p className="text-sm font-semibold text-black dark:text-white">Verify</p>
                <p className="text-xs text-black/60 dark:text-white/60">Human-in-the-loop or automated quality gates</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="mt-16 pb-12">
        <h2 className="text-[24px] md:text-[32px] font-light leading-[1.15] tracking-[-0.5px] font-['Roboto'] text-black dark:text-white text-center">
          Ready to orchestrate?
        </h2>
        <div className="w-full flex justify-center mt-3">
          <p className="text-base text-black/60 dark:text-white/60 text-center" style={{ maxWidth: '500px' }}>
            Start with a personal agent and scale to a fleet. The infrastructure is already built.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/dashboard/onboarding"
            className="inline-flex bg-[#0070d1] text-white rounded-full px-8 py-3 h-12 items-center text-lg font-bold hover:bg-[#0064b7] transition-all hover:scale-105 active:scale-95"
          >
            Launch Your Agent
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 rounded-full px-8 py-3 h-12 text-lg font-bold border border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all hover:scale-105 active:scale-95"
          >
            View Pricing
          </Link>
        </div>
      </section>
    </div>
  )
}
