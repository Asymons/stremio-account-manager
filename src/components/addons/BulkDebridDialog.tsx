import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useAccountStore } from '@/store/accountStore'
import { useAuthStore } from '@/store/authStore'
import { decrypt } from '@/lib/crypto'
import { getDebridApiKeys } from '@/types/debrid'
import { findAddonsByType, getAddonTypeName } from '@/lib/debrid-utils'
import { AlertTriangle, Check, Loader2 } from 'lucide-react'

interface BulkDebridDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId: string
  addonType: string
}

type OperationMode = 'apply' | 'remove'

export function BulkDebridDialog({
  open,
  onOpenChange,
  accountId,
  addonType,
}: BulkDebridDialogProps) {
  const { toast } = useToast()
  const accounts = useAccountStore((state) => state.accounts)
  const bulkApplyDebridKey = useAccountStore((state) => state.bulkApplyDebridKey)
  const bulkRemoveDebrid = useAccountStore((state) => state.bulkRemoveDebrid)
  const encryptionKey = useAuthStore((state) => state.encryptionKey)

  const account = accounts.find((acc) => acc.id === accountId)
  const apiKeys = account?.apiKeys || []
  const debridKeys = getDebridApiKeys(apiKeys)
  const affectedAddons = account ? findAddonsByType(account.addons, addonType) : []
  const addonTypeName = getAddonTypeName(addonType)

  const [mode, setMode] = useState<OperationMode>('apply')
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null)
  const [decryptedKeys, setDecryptedKeys] = useState<Record<string, string>>({})

  // Decrypt keys when dialog opens
  useEffect(() => {
    if (open && encryptionKey) {
      const decryptKeys = async () => {
        const decrypted: Record<string, string> = {}
        for (const key of debridKeys) {
          try {
            decrypted[key.id] = await decrypt(key.apiKey, encryptionKey)
          } catch (error) {
            console.error(`Failed to decrypt key ${key.id}:`, error)
          }
        }
        setDecryptedKeys(decrypted)
      }
      decryptKeys()
    }
  }, [open, debridKeys, encryptionKey])

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setMode('apply')
      setSelectedKeyId(debridKeys.length > 0 ? debridKeys[0].id : null)
      setResult(null)
    }
  }, [open, debridKeys])

  const handleExecute = async () => {
    setLoading(true)
    setResult(null)
    try {
      if (mode === 'apply') {
        if (!selectedKeyId) {
          toast({
            title: 'Error',
            description: 'Please select an API key',
            variant: 'destructive',
          })
          return
        }
        const result = await bulkApplyDebridKey(accountId, addonType, selectedKeyId)
        setResult(result)

        const key = debridKeys.find((k) => k.id === selectedKeyId)
        const serviceName = key?.service === 'realdebrid' ? 'Real-Debrid' : 'TorBox'
        const label = key?.label ? ` (${key.label})` : ''

        toast({
          title: 'Bulk Operation Complete',
          description: `Applied ${serviceName}${label} to ${result.success} of ${result.success + result.failed} addons`,
        })

        if (result.failed === 0) {
          // Close dialog if all succeeded
          setTimeout(() => onOpenChange(false), 1500)
        }
      } else {
        const result = await bulkRemoveDebrid(accountId, addonType)
        setResult(result)

        toast({
          title: 'Bulk Operation Complete',
          description: `Removed debrid from ${result.success} of ${result.success + result.failed} addons`,
        })

        if (result.failed === 0) {
          // Close dialog if all succeeded
          setTimeout(() => onOpenChange(false), 1500)
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Bulk operation failed',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const maskApiKey = (key: string) => {
    if (key.length <= 4) return '••••'
    return '••••••••' + key.slice(-4)
  }

  const getServiceLabel = (serviceType: string) => {
    return serviceType === 'realdebrid' ? 'Real-Debrid' : 'TorBox'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Debrid Operations - {addonTypeName}</DialogTitle>
          <DialogDescription>
            Apply or remove debrid configuration from all {addonTypeName} addons in this account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Affected addons preview */}
          <div className="border rounded-lg p-3 bg-muted/50">
            <div className="font-medium text-sm">Affected Addons</div>
            <div className="text-sm text-muted-foreground mt-1">
              {affectedAddons.length} {addonTypeName} addon
              {affectedAddons.length !== 1 ? 's' : ''} will be modified
            </div>
            {affectedAddons.length > 0 && (
              <div className="mt-2 space-y-1">
                {affectedAddons.slice(0, 3).map((addon) => (
                  <div key={addon.manifest.id} className="text-xs text-muted-foreground">
                    • {addon.manifest.name}
                  </div>
                ))}
                {affectedAddons.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    ... and {affectedAddons.length - 3} more
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Operation mode selection */}
          <div className="space-y-2">
            <Label>Operation</Label>
            <div className="flex gap-2">
              <Button
                variant={mode === 'apply' ? 'default' : 'outline'}
                onClick={() => setMode('apply')}
                disabled={loading}
                className="flex-1"
              >
                Apply Key
              </Button>
              <Button
                variant={mode === 'remove' ? 'default' : 'outline'}
                onClick={() => setMode('remove')}
                disabled={loading}
                className="flex-1"
              >
                Remove Debrid
              </Button>
            </div>
          </div>

          {/* Key selection (only for apply mode) */}
          {mode === 'apply' && (
            <div className="space-y-2">
              {debridKeys.length === 0 ? (
                <div className="text-center py-4 border border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground">No API keys configured</p>
                </div>
              ) : (
                <>
                  <Label>Select API Key</Label>
                  <div className="space-y-2">
                    {debridKeys.map((key) => (
                      <button
                        key={key.id}
                        onClick={() => setSelectedKeyId(key.id)}
                        className={`w-full flex items-center justify-between p-3 border rounded-lg transition-colors ${
                          selectedKeyId === key.id
                            ? 'bg-primary/10 border-primary'
                            : 'hover:bg-accent/50'
                        }`}
                        disabled={loading}
                      >
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{getServiceLabel(key.service)}</span>
                            {key.label && (
                              <span className="text-sm text-muted-foreground">({key.label})</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {decryptedKeys[key.id]
                              ? maskApiKey(decryptedKeys[key.id])
                              : 'Loading...'}
                          </div>
                        </div>
                        {selectedKeyId === key.id && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 border border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              {mode === 'apply' ? (
                <>
                  This will modify the URLs of {affectedAddons.length} addon
                  {affectedAddons.length !== 1 ? 's' : ''} and sync changes to Stremio.
                </>
              ) : (
                <>
                  This will remove debrid configuration from {affectedAddons.length} addon
                  {affectedAddons.length !== 1 ? 's' : ''} and sync changes to Stremio.
                </>
              )}
            </div>
          </div>

          {/* Result display */}
          {result && (
            <div className="p-3 border rounded-lg bg-muted/50">
              <div className="font-medium text-sm">Result</div>
              <div className="text-sm mt-1">
                <div className="text-green-600 dark:text-green-400">
                  ✓ Successfully modified: {result.success}
                </div>
                {result.failed > 0 && (
                  <div className="text-red-600 dark:text-red-400">✗ Failed: {result.failed}</div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button
              onClick={handleExecute}
              disabled={
                loading ||
                affectedAddons.length === 0 ||
                (mode === 'apply' && (!selectedKeyId || debridKeys.length === 0))
              }
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Execute'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
