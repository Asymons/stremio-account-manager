import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { normalizeTagName } from '@/lib/addon-validator'
import { useAddonStore } from '@/store/addonStore'
import { useState } from 'react'

interface SavedAddonFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function SavedAddonForm({ onSuccess, onCancel }: SavedAddonFormProps) {
  const { createSavedAddon, loading, error } = useAddonStore()

  const [formData, setFormData] = useState({
    name: '',
    installUrl: '',
    tags: '',
  })
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    // Validate
    if (!formData.name.trim()) {
      setFormError('Saved addon name is required')
      return
    }

    if (!formData.installUrl.trim()) {
      setFormError('Install URL is required')
      return
    }

    try {
      // Parse tags (comma or space separated)
      const tags = formData.tags
        .split(/[,\s]+/)
        .map((t) => normalizeTagName(t))
        .filter(Boolean)

      await createSavedAddon(
        formData.name.trim(),
        formData.installUrl.trim(),
        tags
      )

      onSuccess()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create saved addon')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Display */}
      {(formError || error) && (
        <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">
            {formError || error}
          </p>
        </div>
      )}

      {/* Saved Addon Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Saved Addon Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="e.g., Torrentio - RD+AD"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          maxLength={100}
          required
        />
        <p className="text-xs text-muted-foreground">
          A descriptive name to help you identify this addon configuration
        </p>
      </div>

      {/* Install URL */}
      <div className="space-y-2">
        <Label htmlFor="installUrl">
          Install URL <span className="text-red-500">*</span>
        </Label>
        <Input
          id="installUrl"
          type="url"
          placeholder="https://..."
          value={formData.installUrl}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, installUrl: e.target.value }))
          }
          required
        />
        <p className="text-xs text-muted-foreground">
          The full addon URL including any configuration parameters
        </p>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags">Tags (Optional)</Label>
        <Input
          id="tags"
          type="text"
          placeholder="e.g., essential, torrent, debrid"
          value={formData.tags}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, tags: e.target.value }))
          }
        />
        <p className="text-xs text-muted-foreground">
          Comma or space separated tags for organizing saved addons
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Creating...' : 'Create Saved Addon'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
