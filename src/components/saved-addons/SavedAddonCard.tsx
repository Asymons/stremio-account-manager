import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAddonStore } from '@/store/addonStore'
import { SavedAddon } from '@/types/saved-addon'
import { Copy, ExternalLink, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { SavedAddonDetails } from './SavedAddonDetails'
import { useUIStore } from '@/store/uiStore'
import { useToast } from '@/hooks/use-toast'
import { maskUrl, getStremioLink } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface SavedAddonCardProps {
  savedAddon: SavedAddon
}

export function SavedAddonCard({ savedAddon }: SavedAddonCardProps) {
  const { deleteSavedAddon } = useAddonStore()
  const isPrivacyModeEnabled = useUIStore((state) => state.isPrivacyModeEnabled)
  const { toast } = useToast()
  const [showDetails, setShowDetails] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    try {
      await deleteSavedAddon(savedAddon.id)
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Failed to delete saved addon:', error)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString()
  }

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(savedAddon.installUrl)
    toast({
      title: 'URL Copied',
      description: 'Addon install URL copied to clipboard',
    })
  }

  const handleOpenInStremio = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.location.href = getStremioLink(savedAddon.installUrl)
  }

  const getHealthStatusColor = () => {
    if (!savedAddon.health) {
      return 'bg-gray-400' // Unchecked
    }
    return savedAddon.health.isOnline ? 'bg-green-500' : 'bg-red-500'
  }

  const getHealthTooltip = () => {
    if (!savedAddon.health) {
      return 'Health not checked'
    }
    const status = savedAddon.health.isOnline ? 'Online' : 'Offline'
    const lastChecked = new Date(savedAddon.health.lastChecked)
    const timeAgo = getTimeAgo(lastChecked)
    return `${status}\nLast checked: ${timeAgo}`
  }

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${getHealthStatusColor()}`}
                title={getHealthTooltip()}
              />
              <CardTitle className="text-lg line-clamp-2">{savedAddon.name}</CardTitle>
              {savedAddon.sourceType === 'cloned-from-account' && (
                <span className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary shrink-0">
                  Cloned
                </span>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className="p-1 hover:bg-accent rounded transition-colors duration-150 shrink-0">
                <MoreVertical className="h-5 w-5 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowDetails(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="flex-1">
          <div className="space-y-3">
            {/* Addon Info */}
            <div className="flex items-center gap-3">
              {savedAddon.manifest.logo ? (
                <img
                  src={savedAddon.manifest.logo}
                  alt={savedAddon.manifest.name}
                  className="w-10 h-10 rounded object-contain flex-shrink-0 bg-transparent"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-muted-foreground">📦</span>
                </div>
              )}
              <div className="text-sm min-w-0">
                <p className="font-medium truncate">{savedAddon.manifest.name}</p>
                <p className="text-xs text-muted-foreground">v{savedAddon.manifest.version}</p>
              </div>
            </div>

            {/* Tags */}
            {savedAddon.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {savedAddon.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Dates */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Created: {formatDate(savedAddon.createdAt)}</p>
              {savedAddon.lastUsed && <p>Last used: {formatDate(savedAddon.lastUsed)}</p>}
            </div>

            {/* URL Display and Actions */}
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={handleCopyUrl}
                className="text-[10px] text-muted-foreground truncate font-mono bg-muted/50 px-2 py-1.5 rounded flex-1 flex items-center justify-between gap-2 hover:bg-muted transition-colors group"
                title="Copy URL"
              >
                <span className="truncate">
                  {isPrivacyModeEnabled ? maskUrl(savedAddon.installUrl) : savedAddon.installUrl}
                </span>
                <Copy className="h-3 w-3 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
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
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Saved Addon</DialogTitle>
          </DialogHeader>
          <SavedAddonDetails savedAddon={savedAddon} onClose={() => setShowDetails(false)} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Saved Addon?"
        description={
          <>
            <p>Are you sure you want to delete "{savedAddon.name}"?</p>
            <p className="font-semibold">
              This will NOT remove it from accounts where it's already installed.
            </p>
          </>
        }
        confirmText="Delete"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
