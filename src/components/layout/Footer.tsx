import { ExternalLink, Github, Heart, MessageSquare } from 'lucide-react'

export function Footer() {
  return (
    <>
      <footer className="border-t border-border bg-card/30 mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 md:flex md:items-center md:justify-center gap-2 sm:gap-4">
              <a
                href="https://forms.gle/ZWLpogunjnWRXa5y6"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150 border md:border-transparent"
              >
                <MessageSquare className="h-4 w-4" />
                Feedback
              </a>
              <a
                href="https://ko-fi.com/alessioca"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150 border md:border-transparent"
              >
                <Heart className="h-4 w-4" />
                Donate
              </a>
              <a
                href="https://www.torbox.app/subscription?referral=b6407151-ee1c-4b9d-8a63-562494dd6c76"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150 border md:border-transparent"
              >
                <ExternalLink className="h-4 w-4" />
                TorBox
              </a>
              <a
                href="https://github.com/Asymons/stremio-account-manager"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150 border md:border-transparent"
              >
                <Github className="h-4 w-4" />
                Source
              </a>
            </div>

            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <span className="text-sm text-muted-foreground">
                Made with ❤️ by{' '}
                <a
                  href="https://alessio.ca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  Alessio
                </a>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
