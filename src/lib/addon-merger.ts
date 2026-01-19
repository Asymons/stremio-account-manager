import { AddonDescriptor } from '@/types/addon'
import { SavedAddon, MergeStrategy, MergeResult } from '@/types/saved-addon'
import { fetchAddonManifest } from '@/api/addons'

/**
 * Addon Merger
 *
 * Implements smart merging logic for applying saved addons to accounts.
 */

/**
 * Merge addons into an account's addon collection
 *
 * @param currentAddons - The account's current addon collection
 * @param savedAddons - Saved addons to apply
 * @param strategy - Merge strategy ('replace-matching' or 'add-only')
 * @returns Updated addon collection and merge result
 */
export async function mergeAddons(
  currentAddons: AddonDescriptor[],
  savedAddons: SavedAddon[],
  strategy: MergeStrategy = 'replace-matching'
): Promise<{ addons: AddonDescriptor[]; result: MergeResult }> {
  const result: MergeResult = {
    added: [],
    updated: [],
    skipped: [],
    protected: [],
  }

  // Start with current addons
  let updatedAddons = [...currentAddons]

  for (const savedAddon of savedAddons) {
    // Use cached manifest ID to check if addon already exists
    const addonId = savedAddon.manifest.id
    
    // Find existing addon with same ID
    const existingIndex = updatedAddons.findIndex(
      (a) => a.manifest.id === addonId
    )

    if (existingIndex >= 0) {
      const existing = updatedAddons[existingIndex]

      // Skip protected addons
      if (existing.flags?.protected) {
        result.protected.push({
          addonId,
          name: existing.manifest.name,
        })
        continue
      }

      if (strategy === 'replace-matching') {
        try {
          // Fetch the latest manifest from the saved addon's URL
          const manifest = await fetchAddonManifest(savedAddon.installUrl)
          
          // Replace existing addon
          const oldUrl = existing.transportUrl
          updatedAddons[existingIndex] = manifest

          result.updated.push({
            addonId,
            oldUrl,
            newUrl: manifest.transportUrl,
          })
        } catch (error) {
          // If fetch fails, skip this addon (can't update without manifest)
          console.error(`Failed to fetch manifest for saved addon ${savedAddon.name}:`, error)
          result.skipped.push({
            addonId,
            reason: 'fetch-failed',
          })
        }
      } else {
        // add-only strategy - skip if already exists
        result.skipped.push({
          addonId,
          reason: 'already-exists',
        })
      }
    } else {
      // New addon - try to fetch latest manifest, fallback to cached if needed
      try {
        const manifest = await fetchAddonManifest(savedAddon.installUrl)
        updatedAddons.push(manifest)

        result.added.push({
          addonId,
          name: manifest.manifest.name,
          installUrl: manifest.transportUrl,
        })
      } catch (error) {
        // If fetch fails, use cached manifest as fallback
        console.warn(`Failed to fetch manifest for saved addon ${savedAddon.name}, using cached manifest:`, error)
        
        // Create AddonDescriptor from cached manifest
        const cachedManifest: AddonDescriptor = {
          transportUrl: savedAddon.installUrl,
          manifest: savedAddon.manifest,
        }
        
        updatedAddons.push(cachedManifest)

        result.added.push({
          addonId,
          name: savedAddon.manifest.name,
          installUrl: savedAddon.installUrl,
        })
      }
    }
  }

  return { addons: updatedAddons, result }
}

/**
 * Remove addons from an account's collection
 *
 * @param currentAddons - The account's current addon collection
 * @param addonIds - Addon IDs to remove
 * @returns Updated addon collection and list of removed addons
 */
export function removeAddons(
  currentAddons: AddonDescriptor[],
  addonIds: string[]
): {
  addons: AddonDescriptor[]
  removed: string[]
  protectedAddons: string[]
} {
  const removed: string[] = []
  const protectedAddons: string[] = []

  const updatedAddons = currentAddons.filter((addon) => {
    const shouldRemove = addonIds.includes(addon.manifest.id)

    if (shouldRemove) {
      // Don't remove protected addons
      if (addon.flags?.protected) {
        protectedAddons.push(addon.manifest.id)
        return true // Keep it
      }

      removed.push(addon.manifest.id)
      return false // Remove it
    }

    return true // Keep it
  })

  return { addons: updatedAddons, removed, protectedAddons }
}

/**
 * Preview what will happen when merging saved addons
 * (same as merge but doesn't actually apply)
 */
export async function previewMerge(
  currentAddons: AddonDescriptor[],
  savedAddons: SavedAddon[],
  strategy: MergeStrategy = 'replace-matching'
): Promise<MergeResult> {
  const { result } = await mergeAddons(currentAddons, savedAddons, strategy)
  return result
}

/**
 * Check if two addon URLs are equivalent
 * (normalize and compare)
 */
export function areUrlsEquivalent(url1: string, url2: string): boolean {
  const normalize = (url: string) => {
    try {
      const parsed = new URL(url)
      const params = new URLSearchParams(parsed.search)
      const sortedParams = new URLSearchParams(
        Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b))
      )
      parsed.search = sortedParams.toString()
      return parsed.toString().toLowerCase().replace(/\/$/, '')
    } catch {
      return url.toLowerCase().replace(/\/$/, '')
    }
  }

  return normalize(url1) === normalize(url2)
}
