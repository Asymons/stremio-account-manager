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

  if (!account) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Account not found</p>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{account.name}</h2>
            <p className="text-sm text-muted-foreground">
              {addons.length} addon{addons.length !== 1 ? 's' : ''} installed
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setReorderDialogOpen(true)}
            disabled={addons.length === 0}
            variant="outline"
          >
            <GripVertical className="h-4 w-4 mr-2" />
            Reorder Addons
          </Button>
          <Button
            onClick={() => setInstallFromLibraryOpen(true)}
            variant="outline"
          >
            <Library className="h-4 w-4 mr-2" />
            Install from Library
          </Button>
          <Button onClick={() => openAddAddonDialog(accountId)}>
            Install Addon
          </Button>
        </div>
      </div>

      {addons.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">No addons installed</p>
          <Button onClick={() => openAddAddonDialog(accountId)}>
            Install Your First Addon
          </Button>
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
