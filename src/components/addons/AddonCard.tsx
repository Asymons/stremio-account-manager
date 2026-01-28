import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { getStremioLink, maskUrl } from '@/lib/utils'
import { useAddonStore } from '@/store/addonStore'
import { useUIStore } from '@/store/uiStore'
import { AddonDescriptor } from '@/types/addon'
import { Copy, ExternalLink, RefreshCw, Settings, Key } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CinemetaConfigurationDialog } from './CinemetaConfigurationDialog'
import { isCinemetaAddon, detectAllPatches } from '@/lib/cinemeta-utils'
import { CinemetaManifest } from '@/types/cinemeta'
import { isDebridSupportedAddon } from '@/lib/debrid-utils'
import { getCurrentDebridService } from '@/lib/addons/torrentio-utils'
import { AddonDebridDialog } from './AddonDebridDialog'

interface AddonCardProps {
  addon: AddonDescriptor
  accountId: string
  accountAuthKey: string
  onRemove: (accountId: string, addonId: string) => void
  onUpdate?: (accountId: string, addonId: string) => Promise<void>
  latestVersion?: string
  loading?: boolean
}

export function AddonCard({
  addon,
  accountId,
  accountAuthKey,
  onRemove,
  onUpdate,
  latestVersion,
  loading,
}: AddonCardProps) {
  const { library, createSavedAddon, loading: storeLoading } = useAddonStore()
  const isPrivacyModeEnabled = useUIStore((state) => state.isPrivacyModeEnabled)
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveTags, setSaveTags] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [showDebridDialog, setShowDebridDialog] = useState(false)

  const handleRemove = () => {
    setShowRemoveDialog(true)
  }

  const handleConfirmRemove = () => {
    onRemove(accountId, addon.manifest.id)
    setShowRemoveDialog(false)
  }

  const isProtected = addon.flags?.protected

  // Check if this addon is already in the library
  const isInLibrary = useMemo(() => {
    return Object.values(library).some(
      (savedAddon) =>
        savedAddon.manifest.id === addon.manifest.id && savedAddon.installUrl === addon.transportUrl
    )
  }, [library, addon.manifest.id, addon.transportUrl])

  const canSaveToLibrary = !addon.flags?.protected && !addon.flags?.official && !isInLibrary

  const hasUpdate = latestVersion ? latestVersion !== addon.manifest.version : false
  const canUpdate = !addon.flags?.protected && onUpdate

  const isCinemeta = useMemo(() => isCinemetaAddon(addon), [addon])

  const cinemetaPatches = useMemo(() => {
    if (!isCinemeta) return null
    const patches = detectAllPatches(addon.manifest as CinemetaManifest)
    const hasAnyPatches =
      patches.searchArtifactsPatched ||
      patches.standardCatalogsPatched ||
      patches.metaResourcePatched
    return hasAnyPatches ? patches : null
  }, [isCinemeta, addon.manifest])

  const isDebridSupported = useMemo(
    () => isDebridSupportedAddon(addon.transportUrl),
    [addon.transportUrl]
  )

  const currentDebridService = useMemo(
    () => (isDebridSupported ? getCurrentDebridService(addon.transportUrl) : null),
    [isDebridSupported, addon.transportUrl]
  )

  const openSaveModal = () => {
    setSaveName(addon.manifest.name)
    setSaveTags('')
    setSaveError(null)
    setShowSaveModal(true)
  }

  const closeSaveModal = () => {
    setShowSaveModal(false)
    setSaveName('')
    setSaveTags('')
    setSaveError(null)
  }

  const handleSaveToLibrary = async () => {
    if (!saveName.trim()) {
      setSaveError('Please enter a name for this addon.')
      return
    }

    setSaving(true)
    setSaveError(null)
    try {
      const tags = saveTags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
      await createSavedAddon(saveName.trim(), addon.transportUrl, tags, addon.manifest)
      closeSaveModal()
    } catch (error) {
      console.error('Failed to save addon to library:', error)
      setSaveError('Failed to save addon to library. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(addon.transportUrl)
    toast({
      title: 'URL Copied',
      description: 'Addon URL copied to clipboard',
    })
  }

  const handleOpenInStremio = () => {
    window.location.href = getStremioLink(addon.transportUrl)
  }

  const handleUpdate = async () => {
    if (!onUpdate) return
    setUpdating(true)
    try {
      await onUpdate(accountId, addon.manifest.id)
      toast({
        title: 'Addon Updated',
        description: `Successfully updated ${addon.manifest.name}`,
      })
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update addon',
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader>
          <div className="flex items-start gap-3">
            {addon.manifest.logo && (
              <div className="bg-muted p-1.5 rounded-md">
                <img
                  src={addon.manifest.logo}
                  alt={addon.manifest.name}
                  className="w-12 h-12 rounded object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">
                {addon.manifest.name}
                {(addon.flags?.protected || addon.flags?.official) && (
                  <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-md">
                    {addon.flags?.protected ? 'Protected' : 'Official'}
                  </span>
                )}
                {cinemetaPatches && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-md">
                    Patched
                  </span>
                )}
                {currentDebridService && (
                  <span className="ml-2 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-1 rounded-md">
                    {currentDebridService === 'realdebrid' ? 'RD' : 'TB'}
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-xs flex items-center gap-2">
                v{addon.manifest.version}
                {hasUpdate && latestVersion && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    → v{latestVersion}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-2">{addon.manifest.description}</p>
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={handleCopyUrl}
              className="text-xs text-muted-foreground truncate font-mono bg-muted/50 px-2 py-1.5 rounded flex-1 flex items-center justify-between gap-2 hover:bg-muted transition-colors group"
              title="Copy URL"
            >
              <span className="truncate">
                {isPrivacyModeEnabled ? maskUrl(addon.transportUrl) : addon.transportUrl}
              </span>
              <Copy className="h-3.5 w-3.5 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleOpenInStremio}
              title="Open in Stremio"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          {canSaveToLibrary && (
            <Button
              variant="secondary"
              size="sm"
              onClick={openSaveModal}
              disabled={loading || storeLoading || saving}
              className="w-full"
            >
              Save to Library
            </Button>
          )}
          {isCinemeta && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowConfigDialog(true)}
              disabled={loading}
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          )}
          {isDebridSupported && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowDebridDialog(true)}
              disabled={loading}
              className="w-full"
            >
              <Key className="h-4 w-4 mr-2" />
              {currentDebridService ? 'Update' : 'Configure'} Debrid
            </Button>
          )}
          {canUpdate && (
            <Button
              variant={hasUpdate ? 'default' : 'secondary'}
              size="sm"
              onClick={handleUpdate}
              disabled={loading || updating}
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${updating ? 'animate-spin' : ''}`} />
              {updating ? 'Updating...' : hasUpdate ? 'Update Addon' : 'Reinstall'}
            </Button>
          )}
          {!isProtected && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={loading}
              className="w-full"
            >
              Remove
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Save to Library Modal */}
      <Dialog open={showSaveModal} onOpenChange={(open) => !open && closeSaveModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save to Library</DialogTitle>
            <DialogDescription>
              Save this addon to your library for easy access and management.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="addon-name">Name</Label>
              <Input
                id="addon-name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Enter addon name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addon-tags">Tags (comma separated)</Label>
              <Input
                id="addon-tags"
                value={saveTags}
                onChange={(e) => setSaveTags(e.target.value)}
                placeholder="e.g., movies, debrid, streaming"
              />
            </div>

            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeSaveModal} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveToLibrary} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <ConfirmationDialog
        open={showRemoveDialog}
        onOpenChange={setShowRemoveDialog}
        title="Remove Addon?"
        description={`Remove "${addon.manifest.name}"?`}
        confirmText="Remove"
        isDestructive={true}
        onConfirm={handleConfirmRemove}
      />

      {/* Cinemeta Configuration Dialog */}
      {isCinemeta && (
        <CinemetaConfigurationDialog
          open={showConfigDialog}
          onOpenChange={setShowConfigDialog}
          addon={addon}
          accountId={accountId}
          accountAuthKey={accountAuthKey}
        />
      )}

      {/* Debrid Configuration Dialog */}
      {isDebridSupported && (
        <AddonDebridDialog
          open={showDebridDialog}
          onOpenChange={setShowDebridDialog}
          addon={addon}
          accountId={accountId}
        />
      )}
    </>
  )
}
