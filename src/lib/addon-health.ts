import axios from 'axios'
import { SavedAddon } from '@/types/saved-addon'

/**
 * Check if an addon URL is accessible
 * @param addonUrl The addon install URL
 * @returns true if online (200 response), false otherwise
 */
export async function checkAddonHealth(addonUrl: string): Promise<boolean> {
  try {
    // Ensure URL ends with /manifest.json
    const manifestUrl = addonUrl.endsWith('/manifest.json') ? addonUrl : `${addonUrl}/manifest.json`

    // Simple HEAD request with timeout
    const response = await axios.head(manifestUrl, {
      timeout: 5000, // 5 second timeout
    })

    return response.status === 200
  } catch {
    // Any error (CORS, timeout, network, 404, 500, etc.) = offline
    return false
  }
}

/**
 * Update a saved addon with health status
 */
export async function updateAddonHealth(addon: SavedAddon): Promise<SavedAddon> {
  const isOnline = await checkAddonHealth(addon.installUrl)

  return {
    ...addon,
    health: {
      isOnline,
      lastChecked: Date.now(),
    },
  }
}

/**
 * Check health for multiple addons with concurrency control
 * @param addons Array of saved addons to check
 * @param onProgress Optional callback for progress updates
 * @returns Array of addons with updated health status
 */
export async function checkAllAddonsHealth(
  addons: SavedAddon[],
  onProgress?: (completed: number, total: number) => void
): Promise<SavedAddon[]> {
  const CONCURRENT_LIMIT = 5
  const results: SavedAddon[] = []

  for (let i = 0; i < addons.length; i += CONCURRENT_LIMIT) {
    const batch = addons.slice(i, i + CONCURRENT_LIMIT)
    const checked = await Promise.all(batch.map((addon) => updateAddonHealth(addon)))
    results.push(...checked)

    // Report progress
    if (onProgress) {
      onProgress(Math.min(i + CONCURRENT_LIMIT, addons.length), addons.length)
    }
  }

  return results
}

/**
 * Get health summary statistics
 */
export function getHealthSummary(addons: SavedAddon[]): {
  online: number
  offline: number
  unchecked: number
} {
  let online = 0
  let offline = 0
  let unchecked = 0

  for (const addon of addons) {
    if (!addon.health) {
      unchecked++
    } else if (addon.health.isOnline) {
      online++
    } else {
      offline++
    }
  }

  return { online, offline, unchecked }
}
