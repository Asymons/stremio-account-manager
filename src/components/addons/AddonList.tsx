import { Button } from '@/components/ui/button'
import { useAccounts } from '@/hooks/useAccounts'
import { useAddons } from '@/hooks/useAddons'
import { useUIStore } from '@/store/uiStore'
import { AddonCard } from './AddonCard'
import { AddonReorderDialog } from './AddonReorderDialog'
import { InstallSavedAddonDialog } from './InstallSavedAddonDialog'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, GripVertical, Library } from 'lucide-react'
import { useState } from 'react'
import { maskEmail } from '@/lib/utils'

interface AddonListProps {
  accountId: string
}

export function AddonList({ accountId }: AddonListProps) {
  const navigate = useNavigate()
  const { accounts } = useAccounts()
  const { addons, removeAddon, loading } = useAddons(accountId)
  const openAddAddonDialog = useUIStore((state) => state.openAddAddonDialog)
  const [reorderDialogOpen, setReorderDialogOpen] = useState(false)
  const [installFromLibraryOpen, setInstallFromLibraryOpen] = useState(false)

  const account = accounts.find((acc) => acc.id === accountId)
  const isPrivacyModeEnabled = useUIStore((state) => state.isPrivacyModeEnabled)

  if (!account) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Account not found</p>
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="mt-4">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  const isNameCustomized = account.name !== account.email && account.name !== 'Stremio Account'
  const displayName =
    isPrivacyModeEnabled && !isNameCustomized
      ? account.name.includes('@')
        ? maskEmail(account.name)
        : '********'
      : account.name

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="h-8 w-8 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl font-bold truncate">{displayName}</h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              {addons.length} addon{addons.length !== 1 ? 's' : ''} installed
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setReorderDialogOpen(true)}
            disabled={addons.length === 0}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
          >
            <GripVertical className="h-4 w-4" />
            <span className="hidden xs:inline">Reorder</span>
            <span className="inline xs:hidden">Reorder</span>
          </Button>
          <Button
            onClick={() => openAddAddonDialog(accountId)}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
          >
            <span className="hidden xs:inline">Manual Install</span>
            <span className="inline xs:hidden">Install</span>
          </Button>
          <Button
            onClick={() => setInstallFromLibraryOpen(true)}
            size="sm"
            className="flex-1 sm:flex-none"
          >
            <Library className="h-4 w-4" />
            <span className="hidden xs:inline">From Library</span>
            <span className="inline xs:hidden">Library</span>
          </Button>
        </div>
      </div>

      {addons.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">No addons installed</p>
          <Button onClick={() => openAddAddonDialog(accountId)}>Install Your First Addon</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {addons.map((addon) => (
            <AddonCard
              key={addon.manifest.id}
              addon={addon}
              accountId={accountId}
              onRemove={removeAddon}
              loading={loading}
            />
          ))}
        </div>
      )}

      <AddonReorderDialog
        accountId={accountId}
        addons={addons}
        open={reorderDialogOpen}
        onOpenChange={setReorderDialogOpen}
      />

      {account && (
        <InstallSavedAddonDialog
          accountId={accountId}
          accountAuthKey={account.authKey}
          open={installFromLibraryOpen}
          onOpenChange={setInstallFromLibraryOpen}
        />
      )}
    </div>
  )
}
