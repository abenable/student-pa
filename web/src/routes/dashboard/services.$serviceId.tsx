import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Mail,
  FileText,
  Briefcase,
  BookOpen,
  Video,
  History,
} from 'lucide-react'

export const Route = createFileRoute('/dashboard/services/$serviceId')({
  component: ServiceDetailPage,
})

const serviceMap: Record<
  string,
  {
    title: string
    description: string
    placeholder: string
    icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
  }
> = {
  'inbox-calendar': {
    title: 'Inbox & Calendar Manager',
    description:
      'Triage unread emails, draft replies, and sync deadlines to your calendar.',
    placeholder:
      'Optional context: specific dates, professors, or keywords to focus on...',
    icon: Mail,
  },
  'lab-report': {
    title: 'Lab Report LaTeX Typesetter',
    description:
      'Generate beautifully formatted LaTeX lab reports with auto-compiled PDFs.',
    placeholder:
      'Paste your lab notes, data, and any specific formatting requirements...',
    icon: FileText,
  },
  'job-application': {
    title: 'Job Application Engine',
    description:
      'Draft tailored cover letters, optimize your resume, and track applications.',
    placeholder:
      'Paste the job description and your resume highlights...',
    icon: Briefcase,
  },
  'paper-interrogator': {
    title: 'Academic Paper Interrogator',
    description:
      'Upload PDFs, extract methodologies, summarize findings, and generate outlines.',
    placeholder:
      'What questions do you want answered from the paper?',
    icon: BookOpen,
  },
  'lecture-summarizer': {
    title: 'Lecture & Video Summarizer',
    description:
      'Convert lectures into searchable transcripts and chapterized summaries.',
    placeholder:
      'Paste a video URL or lecture transcript...',
    icon: Video,
  },
}

function ServiceDetailPage() {
  const { serviceId } = Route.useParams()
  const service = serviceMap[serviceId]

  if (!service) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <Link
          to="/dashboard/services"
          className="text-[#0070d1] font-medium"
        >
          ← Back to Services
        </Link>
        <div className="mt-8">
          <h1 className="text-[44px] font-light leading-[1.25] tracking-[0.1px] font-['Roboto']">
            Service not found
          </h1>
          <p className="text-lg text-black/60 dark:text-white/60 mt-4">
            The service you are looking for does not exist.
          </p>
          <Link
            to="/dashboard/services"
            className="mt-6 inline-flex bg-[#0070d1] text-white rounded-full px-7 py-3 h-12 items-center text-lg font-bold hover:bg-[#0064b7] transition-colors"
          >
            Browse Services
          </Link>
        </div>
      </div>
    )
  }

  const Icon = service.icon

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <Link to="/dashboard/services" className="text-[#0070d1] font-medium">
        ← Back to Services
      </Link>

      <div className="mt-8">
        <Icon size={64} color="#0070d1" strokeWidth={1.5} />
        <h1 className="text-[44px] font-light leading-[1.25] tracking-[0.1px] font-['Roboto'] mt-4">
          {service.title}
        </h1>
        <p className="text-lg text-black/60 dark:text-white/60 max-w-2xl mt-4">
          {service.description}
        </p>
      </div>

      <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-6 mt-8">
        <h2 className="text-[22px] font-light leading-[1.25] tracking-[0.1px]">
          Run Workflow
        </h2>
        <textarea
          placeholder={service.placeholder}
          className="w-full h-40 border border-[#cccccc] rounded-sm p-4 text-base focus:border-[#0070d1] focus:outline-none bg-white dark:bg-[#121314] mt-4 resize-none"
        />
        <button
          type="button"
          className="mt-4 bg-[#0070d1] text-white rounded-full px-7 py-3 h-12 font-bold text-lg inline-flex items-center hover:bg-[#0064b7] transition-colors"
        >
          Run Service
        </button>
      </div>

      <div className="mt-12">
        <h2 className="text-[22px] font-light leading-[1.25] tracking-[0.1px]">
          History
        </h2>
        <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-8 text-center mt-4">
          <History size={48} color="#0070d1" strokeWidth={1.5} className="mx-auto" />
          <p className="text-black/60 dark:text-white/60 mt-4 text-base">
            No runs yet. Execute this service to see results.
          </p>
        </div>
      </div>
    </div>
  )
}
