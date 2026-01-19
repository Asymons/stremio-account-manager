import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { normalizeTagName } from '@/lib/addon-validator'
import { useAddonStore } from '@/store/addonStore'
import { SavedAddon } from '@/types/saved-addon'
import { useState } from 'react'

interface SavedAddonDetailsProps {
  savedAddon: SavedAddon
  onClose: () => void
}

export function SavedAddonDetails({
  savedAddon,
  onClose,
}: SavedAddonDetailsProps) {
  const { updateSavedAddon, loading, error } = useAddonStore()

  const [formData, setFormData] = useState({
    name: savedAddon.name,
    tags: savedAddon.tags.join(', '),
    installUrl: savedAddon.installUrl,
  })
  const [formError, setFormError] = useState<string | null>(null)

  const hasChanges =
    formData.name !== savedAddon.name ||
    formData.tags !== savedAddon.tags.join(', ') ||
    formData.installUrl !== savedAddon.installUrl

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    try {
      // Parse tags
      const tags = formData.tags
        .split(/[,\s]+/)
        .map((t) => normalizeTagName(t))
        .filter(Boolean)

      await updateSavedAddon(savedAddon.id, {
        name: formData.name.trim(),
        tags,
        installUrl: formData.installUrl.trim(),
      })

      onClose()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update saved addon')
    }
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {(formError || error) && (
        <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">
            {formError || error}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Saved Addon Name */}
        <div className="space-y-2">
          <Label htmlFor="edit-name">Saved Addon Name</Label>
          <Input
            id="edit-name"
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            maxLength={100}
            required
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label htmlFor="edit-tags">Tags</Label>
          <Input
            id="edit-tags"
            type="text"
            value={formData.tags}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, tags: e.target.value }))
            }
            placeholder="e.g., essential, torrent, debrid"
          />
        </div>

        {/* Install URL */}
        <div className="space-y-2">
          <Label htmlFor="edit-url">Install URL</Label>
          <Input
            id="edit-url"
            type="url"
            value={formData.installUrl}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, installUrl: e.target.value }))
            }
            required
          />
        </div>

        {/* Manifest Info */}
        <div className="space-y-2">
          <Label>Addon Info</Label>
          <div className="flex items-start gap-3">
            {savedAddon.manifest.logo ? (
              <img
                src={savedAddon.manifest.logo}
                alt={savedAddon.manifest.name}
                className="w-12 h-12 rounded object-contain flex-shrink-0 bg-transparent"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                <span className="text-lg text-gray-500 dark:text-gray-400">📦</span>
              </div>
            )}
            <div className="text-sm space-y-1">
              <p>
                <span className="font-medium">Name:</span> {savedAddon.manifest.name}
              </p>
              <p>
                <span className="font-medium">ID:</span> {savedAddon.manifest.id}
              </p>
              <p>
                <span className="font-medium">Version:</span> {savedAddon.manifest.version}
              </p>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-2">
          <Label>Metadata</Label>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Created: {new Date(savedAddon.createdAt).toLocaleString()}</p>
            <p>Updated: {new Date(savedAddon.updatedAt).toLocaleString()}</p>
            {savedAddon.lastUsed && (
              <p>Last used: {new Date(savedAddon.lastUsed).toLocaleString()}</p>
            )}
            <p>Source: {savedAddon.sourceType === 'manual' ? 'Manual' : 'Cloned from account'}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="submit"
            disabled={loading || !hasChanges}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
