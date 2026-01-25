import { checkSavedAddonUpdates } from '@/api/addons'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { getHealthSummary } from '@/lib/addon-health'
import { useAddonStore } from '@/store/addonStore'
import { Plus, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { SavedAddonCard } from './SavedAddonCard'

export function SavedAddonLibrary() {
  const {
    library,
    getAllTags,
    initialize,
    loading,
    error,
    checkAllHealth,
    checkingHealth,
    createSavedAddon,
    updateSavedAddonManifest,
  } = useAddonStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addUrl, setAddUrl] = useState('')
  const [addName, setAddName] = useState('')
  const [addTags, setAddTags] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [checkingUpdates, setCheckingUpdates] = useState(false)
  const latestVersions = useAddonStore((state) => state.latestVersions)
  const updateLatestVersions = useAddonStore((state) => state.updateLatestVersions)
  const { toast } = useToast()

  const savedAddons = Object.values(library)
  const allTags = getAllTags()

  const updatesAvailable = savedAddons.filter((addon) => {
    const latest = latestVersions[addon.manifest.id]
    return latest && latest !== addon.manifest.version
  })

  const handleCheckUpdates = useCallback(async () => {
    if (savedAddons.length === 0) return

    setCheckingUpdates(true)
    try {
      const updateInfoList = await checkSavedAddonUpdates(savedAddons)
      const versions: Record<string, string> = {}
      updateInfoList.forEach((info) => {
        // Find matching manifest ID for this library addon
        const addon = savedAddons.find((a) => a.id === info.addonId)
        if (addon) {
          versions[addon.manifest.id] = info.latestVersion
        }
      })
      updateLatestVersions(versions)

      const updatesCount = updateInfoList.filter((info) => info.hasUpdate).length
      toast({
        title: 'Update Check Complete',
        description:
          updatesCount > 0
            ? `${updatesCount} addon${updatesCount !== 1 ? 's have' : ' has'} updates available`
            : 'All addons are up to date',
      })
    } catch (err) {
      toast({
        title: 'Check Failed',
        description: 'Failed to check for updates',
        variant: 'destructive',
      })
    } finally {
      setCheckingUpdates(false)
    }
  }, [savedAddons, toast, updateLatestVersions])

  const handleUpdateSavedAddon = useCallback(
    async (savedAddonId: string, addonName: string) => {
      try {
        await updateSavedAddonManifest(savedAddonId)

        toast({
          title: 'Addon Updated',
          description: `Successfully updated ${addonName} to the latest version`,
        })
      } catch (err) {
        toast({
          title: 'Update Failed',
          description: err instanceof Error ? err.message : 'Failed to update addon',
          variant: 'destructive',
        })
      }
    },
    [updateSavedAddonManifest, toast]
  )

  useEffect(() => {
    const init = async () => {
      await initialize()
      // Auto-check health on page load
      checkAllHealth()
    }
    init()
  }, [initialize, checkAllHealth])

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

  // Calculate health summary
  const healthSummary = useMemo(() => {
    return getHealthSummary(savedAddons)
  }, [savedAddons])

  const handleRefreshHealth = () => {
    checkAllHealth()
  }

  const handleOpenAddDialog = () => {
    setAddUrl('')
    setAddName('')
    setAddTags('')
    setAddError(null)
    setShowAddDialog(true)
  }

  const handleAddAddon = async () => {
    if (!addUrl.trim()) {
      setAddError('Please enter an addon URL')
      return
    }

    setAdding(true)
    setAddError(null)
    try {
      const tags = addTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      // createSavedAddon will fetch the manifest automatically
      await createSavedAddon(addName.trim() || '', addUrl.trim(), tags)

      toast({
        title: 'Addon Added',
        description: 'Addon has been saved to your library',
      })
      setShowAddDialog(false)
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add addon')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Saved Addons</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-4 mt-1">
            <p className="text-sm md:text-base text-muted-foreground">
              Manage your reusable addon configurations
            </p>
            {savedAddons.length > 0 && (
              <div className="flex items-center gap-3 text-sm">
                {checkingHealth ? (
                  <span className="text-muted-foreground flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Checking addons...
                  </span>
                ) : (
                  <>
                    {healthSummary.online > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span className="text-muted-foreground">{healthSummary.online} online</span>
                      </span>
                    )}
                    {healthSummary.offline > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <span className="text-muted-foreground">
                          {healthSummary.offline} offline
                        </span>
                      </span>
                    )}
                    {updatesAvailable.length > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span className="text-muted-foreground">
                          {updatesAvailable.length} update{updatesAvailable.length !== 1 ? 's' : ''}
                        </span>
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button onClick={handleOpenAddDialog} size="sm">
            <Plus className="h-4 w-4" />
            Add by URL
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckUpdates}
            disabled={checkingUpdates || savedAddons.length === 0}
          >
            <RefreshCw className={`h-4 w-4 ${checkingUpdates ? 'animate-spin' : ''}`} />
            {checkingUpdates ? 'Checking...' : 'Check Updates'}
          </Button>
          {savedAddons.length > 0 && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefreshHealth}
              disabled={checkingHealth}
              title="Refresh health status"
              className="hidden sm:inline-flex"
            >
              <RefreshCw className={`h-4 w-4 ${checkingHealth ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </div>

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
                <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
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
                  Click <strong>"Add by URL"</strong> above to add an addon, or go to an{' '}
                  <strong>Account</strong> page and click <strong>"Save to Library"</strong> on an
                  installed addon.
                </p>
                <Button onClick={handleOpenAddDialog}>
                  <Plus className="h-4 w-4" />
                  Add by URL
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
            <SavedAddonCard
              key={addon.id}
              savedAddon={addon}
              latestVersion={latestVersions[addon.manifest.id]}
              onUpdate={handleUpdateSavedAddon}
            />
          ))}
        </div>
      )}

      {/* Add by URL Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Addon by URL</DialogTitle>
            <DialogDescription>
              Enter an addon URL to add it to your library. The manifest will be fetched
              automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="addon-url">Addon URL *</Label>
              <Input
                id="addon-url"
                value={addUrl}
                onChange={(e) => setAddUrl(e.target.value)}
                placeholder="https://addon.example.com/manifest.json"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addon-name">Name (optional)</Label>
              <Input
                id="addon-name"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Leave blank to use addon's name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addon-tags">Tags (comma separated)</Label>
              <Input
                id="addon-tags"
                value={addTags}
                onChange={(e) => setAddTags(e.target.value)}
                placeholder="e.g., movies, debrid, streaming"
              />
            </div>

            {addError && <p className="text-sm text-destructive">{addError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={adding}>
              Cancel
            </Button>
            <Button onClick={handleAddAddon} disabled={adding}>
              {adding ? 'Adding...' : 'Add Addon'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
