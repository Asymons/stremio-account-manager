import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useAddonStore } from '@/store/addonStore'
import { useEffect, useMemo, useState } from 'react'
import { SavedAddonCard } from './SavedAddonCard'
import { SavedAddonForm } from './SavedAddonForm'

export function SavedAddonLibrary() {
  const { library, getAllTags, initialize, loading, error } = useAddonStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    initialize()
  }, [initialize])

  const savedAddons = Object.values(library)
  const allTags = getAllTags()

  // Filter saved addons based on search and tag
  const filteredAddons = useMemo(() => {
    let filtered = savedAddons

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (addon) =>
          addon.name.toLowerCase().includes(query) ||
          addon.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    // Filter by selected tag
    if (selectedTag) {
      filtered = filtered.filter((addon) => addon.tags.includes(selectedTag))
    }

    // Sort by lastUsed (most recent first), then by name
    return filtered.sort((a, b) => a.name.localeCompare(b.name))
  }, [savedAddons, searchQuery, selectedTag])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Saved Addons</h1>
          <p className="text-muted-foreground mt-1">
            Manage your reusable addon configurations
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>New Saved Addon</Button>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Saved Addon</DialogTitle>
          </DialogHeader>
          <SavedAddonForm
            onSuccess={() => setShowCreateDialog(false)}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Error Display */}
      {error && (
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search saved addons by name or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Tag Filter Pills */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedTag === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTag(null)}
          >
            All ({savedAddons.length})
          </Button>
          {allTags.map((tag) => {
            const count = savedAddons.filter((addon) => addon.tags.includes(tag)).length
            return (
              <Button
                key={tag}
                variant={selectedTag === tag ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              >
                {tag} ({count})
              </Button>
            )
          })}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading saved addons...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredAddons.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            {searchQuery || selectedTag ? (
              <div>
                <p className="text-lg font-medium mb-2">No saved addons found</p>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filters
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedTag(null)
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">No saved addons yet</p>
                <p className="text-muted-foreground mb-4">
                  Create your first saved addon to get started
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  Create Saved Addon
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Saved Addon Grid */}
      {!loading && filteredAddons.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAddons.map((addon) => (
            <SavedAddonCard key={addon.id} savedAddon={addon} />
          ))}
        </div>
      )}


    </div>
  )
}
