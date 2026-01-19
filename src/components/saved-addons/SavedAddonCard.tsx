import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAddonStore } from '@/store/addonStore'
import { SavedAddon } from '@/types/saved-addon'
import { MoreVertical, Pencil, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { SavedAddonDetails } from './SavedAddonDetails'

interface SavedAddonCardProps {
  savedAddon: SavedAddon
}

export function SavedAddonCard({ savedAddon }: SavedAddonCardProps) {
  const { deleteSavedAddon } = useAddonStore()
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

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <CardTitle className="text-lg line-clamp-2">{savedAddon.name}</CardTitle>
              {savedAddon.sourceType === 'cloned-from-account' && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 shrink-0">
                  Cloned
                </span>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors shrink-0">
                <MoreVertical className="h-5 w-5 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowDetails(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
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
                <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-gray-500 dark:text-gray-400">📦</span>
                </div>
              )}
              <div className="text-sm min-w-0">
                <p className="font-medium truncate">{savedAddon.manifest.name}</p>
                <p className="text-xs text-muted-foreground">
                  v{savedAddon.manifest.version}
                </p>
              </div>
            </div>

            {/* Tags */}
            {savedAddon.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {savedAddon.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Dates */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Created: {formatDate(savedAddon.createdAt)}</p>
              {savedAddon.lastUsed && (
                <p>Last used: {formatDate(savedAddon.lastUsed)}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>Edit Saved Addon</DialogTitle>
            <button
              type="button"
              onClick={() => setShowDetails(false)}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </DialogHeader>
          <SavedAddonDetails
            savedAddon={savedAddon}
            onClose={() => setShowDetails(false)}
          />
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
            <p className="font-semibold">This will NOT remove it from accounts where it's already installed.</p>
          </>
        }
        confirmText="Delete"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
