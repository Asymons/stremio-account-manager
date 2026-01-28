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
import { AddonDescriptor } from '@/types/addon'
import { decrypt } from '@/lib/crypto'
import { getDebridApiKeys } from '@/types/debrid'
import { getCurrentDebridService, getCurrentDebridKey } from '@/lib/addons/torrentio-utils'
import { Check } from 'lucide-react'

interface AddonDebridDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  addon: AddonDescriptor
  accountId: string
}

export function AddonDebridDialog({
  open,
  onOpenChange,
  addon,
  accountId,
}: AddonDebridDialogProps) {
  const { toast } = useToast()
  const accounts = useAccountStore((state) => state.accounts)
  const applyDebridKeyToAddon = useAccountStore((state) => state.applyDebridKeyToAddon)
  const removeDebridFromAddon = useAccountStore((state) => state.removeDebridFromAddon)
  const encryptionKey = useAuthStore((state) => state.encryptionKey)

  const account = accounts.find((acc) => acc.id === accountId)
  const apiKeys = account?.apiKeys || []
  const debridKeys = getDebridApiKeys(apiKeys)

  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [decryptedKeys, setDecryptedKeys] = useState<Record<string, string>>({})

  // Get current debrid configuration from addon URL
  const currentDebridService = getCurrentDebridService(addon.transportUrl)
  const currentDebridKey = getCurrentDebridKey(addon.transportUrl)

  // Create stable key IDs string for dependency comparison
  const keyIds = debridKeys
    .map((k) => k.id)
    .sort()
    .join(',')

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

        // Set initial selection based on current addon config
        const currentService = getCurrentDebridService(addon.transportUrl)
        const currentKey = getCurrentDebridKey(addon.transportUrl)

        if (currentKey && currentService) {
          const matchingKey = debridKeys.find(
            (key) => key.service === currentService && decrypted[key.id] === currentKey
          )
          if (matchingKey) {
            setSelectedKeyId(matchingKey.id)
          } else {
            // Key is embedded but not in our list (orphaned)
            setSelectedKeyId(null)
          }
        } else {
          setSelectedKeyId(null)
        }
      }
      decryptKeys()
    } else if (!open) {
      setDecryptedKeys({})
      setSelectedKeyId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, keyIds, encryptionKey, addon.transportUrl])

  const handleApply = async () => {
    setLoading(true)
    try {
      if (selectedKeyId === null) {
        // Remove debrid
        await removeDebridFromAddon(accountId, addon.manifest.id)
        toast({
          title: 'Success',
          description: 'Debrid configuration removed from addon',
        })
      } else {
        // Apply debrid key
        await applyDebridKeyToAddon(accountId, addon.manifest.id, selectedKeyId)
        const key = debridKeys.find((k) => k.id === selectedKeyId)
        const serviceName = key?.service === 'realdebrid' ? 'Real-Debrid' : 'TorBox'
        const label = key?.label ? ` (${key.label})` : ''
        toast({
          title: 'Success',
          description: `Addon configured with ${serviceName}${label}`,
        })
      }
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to configure debrid',
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

  const hasChanges =
    (selectedKeyId === null && currentDebridKey !== null) ||
    (selectedKeyId !== null &&
      (!currentDebridKey || decryptedKeys[selectedKeyId] !== currentDebridKey))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure Debrid for {addon.manifest.name}</DialogTitle>
          <DialogDescription>
            Select a debrid API key to use with this addon, or select "None" to remove debrid
            configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {currentDebridKey && (
            <div className="text-sm border rounded-lg p-3 bg-muted/50">
              <div className="font-medium">Current Configuration</div>
              <div className="text-muted-foreground mt-1">
                {currentDebridService === 'realdebrid' ? 'Real-Debrid' : 'TorBox'}:{' '}
                {maskApiKey(currentDebridKey)}
              </div>
            </div>
          )}

          {debridKeys.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <p className="text-muted-foreground mb-2">No API keys configured</p>
              <p className="text-sm text-muted-foreground">
                Add API keys in the "API Keys" menu to use them with addons
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Select API Key</Label>

              {/* None option */}
              <button
                onClick={() => setSelectedKeyId(null)}
                className={`w-full flex items-center justify-between p-3 border rounded-lg transition-colors ${
                  selectedKeyId === null ? 'bg-primary/10 border-primary' : 'hover:bg-accent/50'
                }`}
                disabled={loading}
              >
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium">None</div>
                  <div className="text-sm text-muted-foreground">(No debrid service)</div>
                </div>
                {selectedKeyId === null && <Check className="h-4 w-4 text-primary" />}
              </button>

              {/* API key options */}
              {debridKeys.map((key) => (
                <button
                  key={key.id}
                  onClick={() => setSelectedKeyId(key.id)}
                  className={`w-full flex items-center justify-between p-3 border rounded-lg transition-colors ${
                    selectedKeyId === key.id ? 'bg-primary/10 border-primary' : 'hover:bg-accent/50'
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
                      {decryptedKeys[key.id] ? maskApiKey(decryptedKeys[key.id]) : 'Loading...'}
                    </div>
                  </div>
                  {selectedKeyId === key.id && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={loading || !hasChanges}>
            {loading ? 'Applying...' : 'Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
