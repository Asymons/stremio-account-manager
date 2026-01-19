import { Button } from '@/components/ui/button'
import { useAccounts } from '@/hooks/useAccounts'
import { useUIStore } from '@/store/uiStore'
import { Download, Upload } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export function Header() {
  const location = useLocation()
  const openExportDialog = useUIStore((state) => state.openExportDialog)
  const openImportDialog = useUIStore((state) => state.openImportDialog)
  const { accounts } = useAccounts()

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Stremio Account Manager</h1>
            <p className="text-sm text-muted-foreground">
              Manage multiple Stremio accounts and addons
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={openImportDialog}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openExportDialog}
              disabled={accounts.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mt-4 border-b">
          <Link
            to="/"
            className={`pb-2 px-1 border-b-2 transition-colors ${location.pathname === '/' || location.pathname.startsWith('/account/')
              ? 'border-primary text-primary font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            Accounts
          </Link>
          <Link
            to="/saved-addons"
            className={`pb-2 px-1 border-b-2 transition-colors ${location.pathname === '/saved-addons'
              ? 'border-primary text-primary font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            Saved Addons
          </Link>
          <Link
            to="/faq"
            className={`pb-2 px-1 border-b-2 transition-colors ${location.pathname === '/faq'
              ? 'border-primary text-primary font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            FAQ
          </Link>
        </div>
      </div>
    </header>
  )
}
