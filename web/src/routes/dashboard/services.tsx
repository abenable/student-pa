import { createFileRoute, Link } from '@tanstack/react-router'
import { Mail, FileText, Briefcase, BookOpen, Video } from 'lucide-react'

export const Route = createFileRoute('/dashboard/services')({
  component: ServicesPage,
})

const services = [
  {
    id: 'inbox-calendar',
    title: 'Inbox & Calendar Manager',
    description:
      'Triage unread emails, draft replies, and sync deadlines to your calendar.',
    icon: Mail,
    cta: 'Triage Inbox',
  },
  {
    id: 'lab-report',
    title: 'Lab Report LaTeX Typesetter',
    description:
      'Generate beautifully formatted LaTeX lab reports with auto-compiled PDFs.',
    icon: FileText,
    cta: 'Generate Report',
  },
  {
    id: 'job-application',
    title: 'Job Application Engine',
    description:
      'Draft tailored cover letters, optimize your resume, and track applications.',
    icon: Briefcase,
    cta: 'Draft Application',
  },
  {
    id: 'paper-interrogator',
    title: 'Academic Paper Interrogator',
    description:
      'Upload PDFs, extract methodologies, summarize findings, and generate outlines.',
    icon: BookOpen,
    cta: 'Analyze Paper',
  },
  {
    id: 'lecture-summarizer',
    title: 'Lecture & Video Summarizer',
    description:
      'Convert lectures into searchable transcripts and chapterized summaries.',
    icon: Video,
    cta: 'Summarize Lecture',
  },
]

function ServicesPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-[44px] font-light leading-[1.25] tracking-[0.1px] font-['Roboto']">
        Services
      </h1>
      <p className="text-lg text-black/60 dark:text-white/60 mt-2">
        Run any of your agent's built-in workflows.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {services.map((service) => {
          const Icon = service.icon
          return (
            <div
              key={service.id}
              className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-6 flex flex-col"
            >
              <Icon
                size={48}
                color="#0070d1"
                strokeWidth={1.5}
              />
              <h2 className="text-[22px] font-light leading-[1.25] tracking-[0.1px] mt-4">
                {service.title}
              </h2>
              <p className="text-black/60 dark:text-white/60 mt-2 flex-1">
                {service.description}
              </p>
              <Link
                to="/dashboard/services/$serviceId"
                params={{ serviceId: service.id }}
                className="mt-4 inline-flex bg-[#0070d1] text-white rounded-full px-7 py-3 h-12 items-center text-lg font-bold hover:bg-[#0064b7] transition-colors self-start"
              >
                Run
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
