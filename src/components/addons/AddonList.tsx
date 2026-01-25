import { checkAddonUpdates, reinstallAddon } from '@/api/addons'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useAccounts } from '@/hooks/useAccounts'
import { useAddons } from '@/hooks/useAddons'
import { decrypt } from '@/lib/crypto'
import { maskEmail } from '@/lib/utils'
import { useAccountStore } from '@/store/accountStore'
import { useAddonStore } from '@/store/addonStore'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { ArrowLeft, GripVertical, Library, RefreshCw } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AddonCard } from './AddonCard'
import { AddonReorderDialog } from './AddonReorderDialog'
import { InstallSavedAddonDialog } from './InstallSavedAddonDialog'

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
  const [checkingUpdates, setCheckingUpdates] = useState(false)
  const latestVersions = useAddonStore((state) => state.latestVersions)
  const updateLatestVersions = useAccountStore((state) => state.updateLatestVersions)
  const [updatingAll, setUpdatingAll] = useState(false)
  const encryptionKey = useAuthStore((state) => state.encryptionKey)
  const syncAccount = useAccountStore((state) => state.syncAccount)
  const { toast } = useToast()

  const account = accounts.find((acc) => acc.id === accountId)
  const isPrivacyModeEnabled = useUIStore((state) => state.isPrivacyModeEnabled)

  const updatesAvailable = addons.filter((addon) => {
    const latest = latestVersions[addon.manifest.id]
    return latest && latest !== addon.manifest.version
  })

  const handleCheckUpdates = useCallback(async () => {
    if (!account || !encryptionKey) return

    setCheckingUpdates(true)
    try {
      // First sync account to get the latest addons from the server
      await syncAccount(accountId)

      const updateInfoList = await checkAddonUpdates(addons)
      const versions: Record<string, string> = {}
      updateInfoList.forEach((info) => {
        versions[info.addonId] = info.latestVersion
      })
      updateLatestVersions(versions)

      const updatesCount = updateInfoList.filter((info) => info.hasUpdate).length
      toast({
        title: 'Refresh Complete',
        description:
          updatesCount > 0
            ? `${updatesCount} addon${updatesCount !== 1 ? 's have' : ' has'} updates available`
            : 'All addons are up to date',
      })
    } catch (error) {
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh addons',
        variant: 'destructive',
      })
    } finally {
      setCheckingUpdates(false)
    }
  }, [account, encryptionKey, addons, toast, updateLatestVersions, syncAccount, accountId])

  const handleUpdateAddon = useCallback(
    async (_accountId: string, addonId: string) => {
      if (!account || !encryptionKey) return

      const authKey = await decrypt(account.authKey, encryptionKey)
      await reinstallAddon(authKey, addonId)

      // Sync account to refresh addon list
      await syncAccount(accountId)
    },
    [account, encryptionKey, accountId, syncAccount]
  )

  const handleUpdateAll = useCallback(async () => {
    if (!account || !encryptionKey) return

    const addonsToUpdate = updatesAvailable.map((addon) => addon.manifest.id)
    if (addonsToUpdate.length === 0) return

    setUpdatingAll(true)
    try {
      const authKey = await decrypt(account.authKey, encryptionKey)

      let successCount = 0
      for (const addonId of addonsToUpdate) {
        try {
          await reinstallAddon(authKey, addonId)
          successCount++
        } catch (error) {
          console.warn(`Failed to update addon ${addonId}:`, error)
        }
      }

      // Sync account to refresh addon list
      await syncAccount(accountId)

      toast({
        title: 'Updates Complete',
        description: `Successfully updated ${successCount} of ${addonsToUpdate.length} addons`,
      })
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update addons',
        variant: 'destructive',
      })
    } finally {
      setUpdatingAll(false)
    }
  }, [account, encryptionKey, updatesAvailable, accountId, syncAccount, toast])

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
              {updatesAvailable.length > 0 && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  ({updatesAvailable.length} update{updatesAvailable.length !== 1 ? 's' : ''}{' '}
                  available)
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button
            onClick={handleCheckUpdates}
            disabled={addons.length === 0 || checkingUpdates}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className={`h-4 w-4 ${checkingUpdates ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">
              {checkingUpdates ? 'Refreshing...' : 'Refresh'}
            </span>
            <span className="inline xs:hidden">{checkingUpdates ? '...' : 'Refresh'}</span>
          </Button>
          {updatesAvailable.length > 0 && (
            <Button
              onClick={handleUpdateAll}
              disabled={updatingAll}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <RefreshCw className={`h-4 w-4 ${updatingAll ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">
                {updatingAll ? 'Updating...' : `Update all addons (${updatesAvailable.length})`}
              </span>
              <span className="inline xs:hidden">
                {updatingAll ? '...' : `Update (${updatesAvailable.length})`}
              </span>
            </Button>
          )}
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
              onUpdate={handleUpdateAddon}
              latestVersion={latestVersions[addon.manifest.id]}
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
