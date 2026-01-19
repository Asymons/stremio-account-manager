import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useAddonStore } from '@/store/addonStore'
import { useAccountStore } from '@/store/accountStore'
import { MergeStrategy } from '@/types/saved-addon'
import { useState } from 'react'

interface InstallSavedAddonDialogProps {
  accountId: string
  accountAuthKey: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function InstallSavedAddonDialog({
  accountId,
  accountAuthKey,
  open,
  onOpenChange,
  onSuccess,
}: InstallSavedAddonDialogProps) {
  const { library, bulkApplySavedAddons, loading } = useAddonStore()
  const syncAccount = useAccountStore((state) => state.syncAccount)

  const [selectedSavedAddonIds, setSelectedSavedAddonIds] = useState<Set<string>>(new Set())
  const [strategy, setStrategy] = useState<MergeStrategy>('replace-matching')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [result, setResult] = useState<any>(null)

  const savedAddons = Object.values(library).sort((a, b) => a.name.localeCompare(b.name))

  const toggleSavedAddon = (savedAddonId: string) => {
    setSelectedSavedAddonIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(savedAddonId)) {
        newSet.delete(savedAddonId)
      } else {
        newSet.add(savedAddonId)
      }
      return newSet
    })
  }

  const selectAll = () => {
    setSelectedSavedAddonIds(new Set(savedAddons.map((a) => a.id)))
  }

  const selectNone = () => {
    setSelectedSavedAddonIds(new Set())
  }

  const handleClose = () => {
    if (!loading && !success) {
      setSelectedSavedAddonIds(new Set())
      setError(null)
      setSuccess(false)
      setResult(null)
      setStrategy('replace-matching')
      onOpenChange(false)
    } else if (success) {
      // Allow closing even on success
      setSelectedSavedAddonIds(new Set())
      setError(null)
      setSuccess(false)
      setResult(null)
      setStrategy('replace-matching')
      onOpenChange(false)
    }
  }

  const handleInstall = async () => {
    if (selectedSavedAddonIds.size === 0) {
      setError('Please select at least one saved addon')
      return
    }

    setError(null)
    setSuccess(false)

    try {
      const accountsToApply = [{ id: accountId, authKey: accountAuthKey }]

      const bulkResult = await bulkApplySavedAddons(
        Array.from(selectedSavedAddonIds),
        accountsToApply,
        strategy
      )

      setResult(bulkResult)

      if (bulkResult.failed === 0) {
        setSuccess(true)
        // Sync account to refresh addons list
        await syncAccount(accountId)
        // Trigger success callback if provided
        if (onSuccess) {
          onSuccess()
        }
        // Auto-close after 2 seconds
        setTimeout(() => {
          handleClose()
        }, 2000)
      } else {
        setError(`Installation completed with ${bulkResult.failed} error(s)`)
        setSuccess(true) // Still show success state but with error info
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to install saved addons')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Install from Library</DialogTitle>
          <DialogDescription>
            Select saved addons to install to this account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Success Message */}
          {success && result && result.details.length > 0 && (
            <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                {result.details[0].result.added.length > 0 && (
                  <span>
                    Added {result.details[0].result.added.length} addon
                    {result.details[0].result.added.length !== 1 ? 's' : ''}
                  </span>
                )}
                {result.details[0].result.updated.length > 0 && (
                  <span>
                    {result.details[0].result.added.length > 0 ? ', ' : ''}
                    Updated {result.details[0].result.updated.length} addon
                    {result.details[0].result.updated.length !== 1 ? 's' : ''}
                  </span>
                )}
                {result.details[0].result.skipped.length > 0 && (
                  <span>
                    {result.details[0].result.added.length > 0 || result.details[0].result.updated.length > 0 ? ', ' : ''}
                    Skipped {result.details[0].result.skipped.length} addon
                    {result.details[0].result.skipped.length !== 1 ? 's' : ''}
                  </span>
                )}
                {result.details[0].result.added.length === 0 &&
                  result.details[0].result.updated.length === 0 &&
                  result.details[0].result.skipped.length === 0 && (
                    <span>Installation completed</span>
                  )}
                {result.failed > 0 && ` (${result.failed} failed)`}
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && !success && (
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Merge Strategy */}
          <div className="space-y-2">
            <Label>Merge Strategy</Label>
            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="strategy"
                  value="replace-matching"
                  checked={strategy === 'replace-matching'}
                  onChange={(e) => setStrategy(e.target.value as MergeStrategy)}
                  className="mt-1"
                  disabled={loading || success}
                />
                <div>
                  <p className="font-medium text-sm">Replace Matching</p>
                  <p className="text-xs text-muted-foreground">
                    If the addon already exists, replace it. Otherwise, add it.
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="strategy"
                  value="add-only"
                  checked={strategy === 'add-only'}
                  onChange={(e) => setStrategy(e.target.value as MergeStrategy)}
                  className="mt-1"
                  disabled={loading || success}
                />
                <div>
                  <p className="font-medium text-sm">Add Only</p>
                  <p className="text-xs text-muted-foreground">
                    Only add if the addon doesn't exist. Skip if already present.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Saved Addon Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Select Saved Addons ({selectedSavedAddonIds.size} selected)</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                  disabled={loading || success || savedAddons.length === 0}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectNone}
                  disabled={loading || success || selectedSavedAddonIds.size === 0}
                >
                  Clear
                </Button>
              </div>
            </div>

            <div className="border rounded-md max-h-64 overflow-y-auto">
              {savedAddons.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">
                  No saved addons available. Create saved addons first.
                </p>
              ) : (
                <div className="divide-y">
                  {savedAddons.map((savedAddon) => (
                    <label
                      key={savedAddon.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSavedAddonIds.has(savedAddon.id)}
                        onChange={() => toggleSavedAddon(savedAddon.id)}
                        disabled={loading || success}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{savedAddon.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {savedAddon.manifest.name}
                        </p>
                        {savedAddon.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {savedAddon.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                              >
                                {tag}
                              </span>
                            ))}
                            {savedAddon.tags.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{savedAddon.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleInstall}
              disabled={loading || selectedSavedAddonIds.size === 0 || success}
              className="flex-1"
            >
              {loading
                ? 'Installing...'
                : success
                  ? 'Installed!'
                  : `Install ${selectedSavedAddonIds.size} Addon${selectedSavedAddonIds.size !== 1 ? 's' : ''}`}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              {success ? 'Close' : 'Cancel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
