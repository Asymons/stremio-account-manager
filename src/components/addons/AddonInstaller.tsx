import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUIStore } from '@/store/uiStore'
import { useAccounts } from '@/hooks/useAccounts'
import { useAccountStore } from '@/store/accountStore'

export function AddonInstaller() {
  const isOpen = useUIStore((state) => state.isAddAddonDialogOpen)
  const closeDialog = useUIStore((state) => state.closeAddAddonDialog)
  const { selectedAccountId } = useAccounts()
  const installAddon = useAccountStore((state) => state.installAddonToAccount)
  const loading = useAccountStore((state) => state.loading)

  const [addonUrl, setAddonUrl] = useState('')
  const [error, setError] = useState('')

  const handleClose = () => {
    setAddonUrl('')
    setError('')
    closeDialog()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedAccountId) {
      setError('No account selected')
      return
    }

    if (!addonUrl.trim()) {
      setError('Addon URL is required')
      return
    }

    try {
      // Validate URL format
      new URL(addonUrl)

      await installAddon(selectedAccountId, addonUrl.trim())
      handleClose()
    } catch (err) {
      if (err instanceof TypeError) {
        setError('Invalid URL format')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to install addon')
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Install Addon</DialogTitle>
          <DialogDescription>
            Enter the addon URL to install it to the selected account
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="addonUrl">Addon URL</Label>
            <Input
              id="addonUrl"
              type="url"
              value={addonUrl}
              onChange={(e) => setAddonUrl(e.target.value)}
              placeholder="https://example.com/addon/manifest.json"
              required
            />
            <p className="text-xs text-muted-foreground">
              The URL should point to the addon's base URL (e.g., https://addon.example.com)
            </p>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Installing...' : 'Install Addon'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
