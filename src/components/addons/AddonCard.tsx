import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAddonStore } from '@/store/addonStore'
import { AddonDescriptor } from '@/types/addon'
import { useMemo, useState } from 'react'

interface AddonCardProps {
  addon: AddonDescriptor
  accountId: string
  onRemove: (accountId: string, addonId: string) => void
  loading?: boolean
}

export function AddonCard({ addon, accountId, onRemove, loading }: AddonCardProps) {
  const { library, createSavedAddon, loading: storeLoading } = useAddonStore()
  const [saving, setSaving] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveTags, setSaveTags] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)

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
        savedAddon.manifest.id === addon.manifest.id &&
        savedAddon.installUrl === addon.transportUrl
    )
  }, [library, addon.manifest.id, addon.transportUrl])

  const canSaveToLibrary = !addon.flags?.protected && !addon.flags?.official && !isInLibrary

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          {addon.manifest.logo && (
            <img
              src={addon.manifest.logo}
              alt={addon.manifest.name}
              className="w-12 h-12 rounded object-contain bg-transparent"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">
              {addon.manifest.name}
              {(addon.flags?.protected || addon.flags?.official) && (
                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  {addon.flags?.protected ? 'Protected' : 'Official'}
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              v{addon.manifest.version}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {addon.manifest.description}
        </p>
        <div className="mt-2 text-xs text-muted-foreground truncate">
          {addon.transportUrl}
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

            {saveError && (
              <p className="text-sm text-destructive">{saveError}</p>
            )}
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
    </Card>
  )
}

