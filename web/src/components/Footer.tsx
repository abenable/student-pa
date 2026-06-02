import { Link } from '@tanstack/react-router'

export function Footer() {
  return (
    <footer className="bg-background text-foreground py-4 border-t border-border">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            &copy; 2026 AgentHub. Student intelligence, redefined.
          </span>
          <div className="flex items-center gap-5">
            <Link
              to="/privacy"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              Terms
            </Link>
            <Link
              to="/support"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              Support
            </Link>
            <a
              href="https://github.com/abenable/student-pa"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              Source
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
