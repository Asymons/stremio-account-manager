import { ExternalLink, Github, Heart, MessageSquare } from 'lucide-react'

export function Footer() {
  return (
    <>
      <footer className="border-t border-border bg-card/50 mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="hidden sm:inline">Stremio Account Manager</span>
              <a
                href="https://forms.gle/ZWLpogunjnWRXa5y6"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                Feedback
              </a>
              <a
                href="https://ko-fi.com/alessioca"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Heart className="h-4 w-4" />
                Donate
              </a>
              <a
                href="https://www.torbox.app/subscription?referral=b6407151-ee1c-4b9d-8a63-562494dd6c76"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                TorBox Referral
              </a>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/Asymons/stremio-account-manager"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Github className="h-4 w-4" />
                View Source
              </a>
              <span className="text-xs">Made with ❤️</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
