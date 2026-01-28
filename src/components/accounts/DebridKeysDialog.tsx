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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useAccountStore } from '@/store/accountStore'
import { useAuthStore } from '@/store/authStore'
import { ApiKey, ApiServiceType } from '@/types/debrid'
import { decrypt } from '@/lib/crypto'
import { getDebridApiKeys } from '@/types/debrid'
import { Trash2, Edit2, Plus, Key, ExternalLink } from 'lucide-react'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

interface DebridKeysDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId: string
}

type EditMode = 'list' | 'add' | 'edit'

const SERVICE_OPTIONS = [
  { value: 'realdebrid', label: 'Real-Debrid', helpUrl: 'https://real-debrid.com/apitoken' },
  { value: 'torbox', label: 'TorBox', helpUrl: 'https://torbox.app/settings' },
]

export function DebridKeysDialog({ open, onOpenChange, accountId }: DebridKeysDialogProps) {
  const { toast } = useToast()
  const accounts = useAccountStore((state) => state.accounts)
  const addApiKey = useAccountStore((state) => state.addApiKey)
  const updateApiKey = useAccountStore((state) => state.updateApiKey)
  const removeApiKey = useAccountStore((state) => state.removeApiKey)
  const encryptionKey = useAuthStore((state) => state.encryptionKey)

  const account = accounts.find((acc) => acc.id === accountId)
  const apiKeys = account?.apiKeys || []
  const debridKeys = getDebridApiKeys(apiKeys)

  const [mode, setMode] = useState<EditMode>('list')
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null)
  const [service, setService] = useState<ApiServiceType>('realdebrid')
  const [apiKey, setApiKey] = useState('')
  const [label, setLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null)
  const [decryptedKeys, setDecryptedKeys] = useState<Record<string, string>>({})

  // Create stable key IDs string for dependency comparison
  const keyIds = debridKeys
    .map((k) => k.id)
    .sort()
    .join(',')

  // Decrypt keys when dialog opens or keys change
  useEffect(() => {
    if (open && encryptionKey && debridKeys.length > 0) {
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
    } else if (!open || debridKeys.length === 0) {
      setDecryptedKeys({})
    }
  }, [open, keyIds, encryptionKey])

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setMode('list')
      setEditingKeyId(null)
      setService('realdebrid')
      setApiKey('')
      setLabel('')
    }
  }, [open])

  const handleStartAdd = () => {
    setMode('add')
    setEditingKeyId(null)
    setService('realdebrid')
    setApiKey('')
    setLabel('')
  }

  const handleStartEdit = async (key: ApiKey) => {
    if (!encryptionKey) return

    setMode('edit')
    setEditingKeyId(key.id)
    setService(key.service)
    setLabel(key.label || '')

    // Decrypt the key for editing
    try {
      const decrypted = await decrypt(key.apiKey, encryptionKey)
      setApiKey(decrypted)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to decrypt API key',
        variant: 'destructive',
      })
    }
  }

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast({
        title: 'Error',
        description: 'API key is required',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      if (mode === 'add') {
        await addApiKey(accountId, {
          service,
          apiKey: apiKey.trim(),
          label: label.trim() || undefined,
        })
        toast({
          title: 'Success',
          description: 'API key added successfully',
        })
      } else if (mode === 'edit' && editingKeyId) {
        await updateApiKey(accountId, editingKeyId, {
          service,
          apiKey: apiKey.trim(),
          label: label.trim() || undefined,
        })
        toast({
          title: 'Success',
          description: 'API key updated successfully',
        })
      }
      setMode('list')
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save API key',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteKeyId) return

    setLoading(true)
    try {
      await removeApiKey(accountId, deleteKeyId)
      toast({
        title: 'Success',
        description: 'API key removed successfully',
      })
      setDeleteKeyId(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove API key',
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
    return SERVICE_OPTIONS.find((opt) => opt.value === serviceType)?.label || serviceType
  }

  const getServiceHelpUrl = (serviceType: string) => {
    return SERVICE_OPTIONS.find((opt) => opt.value === serviceType)?.helpUrl
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === 'list' && 'Debrid API Keys'}
              {mode === 'add' && 'Add API Key'}
              {mode === 'edit' && 'Edit API Key'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'list' &&
                'Manage your debrid service API keys. These can be applied to individual addons.'}
              {(mode === 'add' || mode === 'edit') &&
                'Enter your debrid service API key. It will be encrypted and stored securely.'}
            </DialogDescription>
          </DialogHeader>

          {mode === 'list' ? (
            <div className="space-y-4">
              {debridKeys.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-lg">
                  <Key className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground mb-4">No API keys configured</p>
                  <Button onClick={handleStartAdd}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Key
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {debridKeys.map((key) => (
                      <div
                        key={key.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
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
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStartEdit(key)}
                            disabled={loading}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteKeyId(key.id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleStartAdd} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Key
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="service">Service</Label>
                <select
                  id="service"
                  value={service}
                  onChange={(e) => setService(e.target.value as ApiServiceType)}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  disabled={loading}
                >
                  {SERVICE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {getServiceHelpUrl(service) && (
                  <a
                    href={getServiceHelpUrl(service)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    Get API key
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="label">Label (Optional)</Label>
                <Input
                  id="label"
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g., My Account, Work, Shared"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {mode === 'list' ? (
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setMode('list')} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteKeyId !== null}
        onOpenChange={(open) => !open && setDeleteKeyId(null)}
        onConfirm={handleDelete}
        title="Delete API Key"
        description="Are you sure you want to delete this API key? Addons using this key will keep the embedded key in their URLs."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
      />
    </>
  )
}
