import { AddonDescriptor } from '@/types/addon'
import { stremioClient } from './stremio-client'

export async function getAddons(authKey: string): Promise<AddonDescriptor[]> {
  return stremioClient.getAddonCollection(authKey)
}

export async function updateAddons(authKey: string, addons: AddonDescriptor[]): Promise<void> {
  return stremioClient.setAddonCollection(authKey, addons)
}

export async function installAddon(authKey: string, addonUrl: string): Promise<AddonDescriptor[]> {
  // First, fetch the addon manifest
  const newAddon = await stremioClient.fetchAddonManifest(addonUrl)

  // Get current addons
  const currentAddons = await getAddons(authKey)

  // Check if addon already installed
  const existingIndex = currentAddons.findIndex(
    (addon) => addon.manifest.id === newAddon.manifest.id
  )

  let updatedAddons: AddonDescriptor[]

  if (existingIndex >= 0) {
    // Update existing addon
    updatedAddons = [...currentAddons]
    updatedAddons[existingIndex] = newAddon
  } else {
    // Add new addon
    updatedAddons = [...currentAddons, newAddon]
  }

  // Update the collection
  await updateAddons(authKey, updatedAddons)

  return updatedAddons
}

export async function removeAddon(authKey: string, addonId: string): Promise<AddonDescriptor[]> {
  // Get current addons
  const currentAddons = await getAddons(authKey)

  // Remove the addon
  const updatedAddons = currentAddons.filter((addon) => addon.manifest.id !== addonId)

  // Update the collection
  await updateAddons(authKey, updatedAddons)

  return updatedAddons
}

export async function fetchAddonManifest(url: string): Promise<AddonDescriptor> {
  return stremioClient.fetchAddonManifest(url)
}

/**
 * Reinstall an addon by removing and re-installing it with Stremio.
 * This triggers Stremio to fetch the latest manifest from the addon URL.
 */
export async function reinstallAddon(
  authKey: string,
  addonId: string
): Promise<{
  addons: AddonDescriptor[]
  updatedAddon: AddonDescriptor | null
  previousVersion?: string
  newVersion?: string
}> {
  const currentAddons = await getAddons(authKey)

  const existingAddon = currentAddons.find((addon) => addon.manifest.id === addonId)

  if (!existingAddon) {
    return { addons: currentAddons, updatedAddon: null }
  }

  // Skip protected addons
  if (existingAddon.flags?.protected) {
    return { addons: currentAddons, updatedAddon: null }
  }

  const previousVersion = existingAddon.manifest.version
  const transportUrl = existingAddon.transportUrl
  const addonIndex = currentAddons.findIndex((addon) => addon.manifest.id === addonId)

  // Remove the addon first
  await removeAddon(authKey, addonId)

  // Re-install it (which will use installAddon's standard flow)
  const addonsAfterInstall = await installAddon(authKey, transportUrl)

  // Find the reinstalled addon to get its new version
  const reinstalledAddon = addonsAfterInstall.find((addon) => addon.manifest.id === addonId)

  // If we need to preserve position, reorder the addons
  if (reinstalledAddon && addonIndex >= 0 && addonIndex < addonsAfterInstall.length - 1) {
    const addonsWithoutReinstalled = addonsAfterInstall.filter(
      (addon) => addon.manifest.id !== addonId
    )
    const reorderedAddons = [...addonsWithoutReinstalled]
    reorderedAddons.splice(addonIndex, 0, reinstalledAddon)
    await updateAddons(authKey, reorderedAddons)

    // Refetch to get what Stremio actually has
    const finalAddons = await getAddons(authKey)
    const finalAddon = finalAddons.find((addon) => addon.manifest.id === addonId)

    return {
      addons: finalAddons,
      updatedAddon: finalAddon || null,
      previousVersion,
      newVersion: finalAddon?.manifest.version,
    }
  }

  return {
    addons: addonsAfterInstall,
    updatedAddon: reinstalledAddon || null,
    previousVersion,
    newVersion: reinstalledAddon?.manifest.version,
  }
}

/**
 * Update info for a single addon
 */
export interface AddonUpdateInfo {
  addonId: string
  name: string
  transportUrl: string
  installedVersion: string
  latestVersion: string
  hasUpdate: boolean
}

/**
 * Check which addons have updates available by comparing installed versions
 * with the latest versions from their transport URLs.
 * Fetches manifests sequentially to avoid overwhelming the server/proxy.
 */
export async function checkAddonUpdates(addons: AddonDescriptor[]): Promise<AddonUpdateInfo[]> {
  // Filter out protected and official addons
  const checkableAddons = addons.filter(
    (addon) => !addon.flags?.protected && !addon.flags?.official
  )

  console.log(`[Update Check] Checking ${checkableAddons.length} addons sequentially...`)

  const results: AddonUpdateInfo[] = []

  for (const addon of checkableAddons) {
    try {
      const latestManifest = await stremioClient.fetchAddonManifest(addon.transportUrl)
      const hasUpdate = latestManifest.manifest.version !== addon.manifest.version

      console.log(
        `[Update Check] ${addon.manifest.name}: installed=${addon.manifest.version}, latest=${latestManifest.manifest.version}, hasUpdate=${hasUpdate}`
      )

      results.push({
        addonId: addon.manifest.id,
        name: addon.manifest.name,
        transportUrl: addon.transportUrl,
        installedVersion: addon.manifest.version,
        latestVersion: latestManifest.manifest.version,
        hasUpdate,
      })
    } catch (error) {
      console.warn(`[Update Check] Failed to check ${addon.manifest.name}:`, error)
      console.warn(`  URL was: ${addon.transportUrl}`)
    }
  }

  console.log(`[Update Check] Complete: ${results.length} checked`)

  return results
}

/**
 * Check which saved addons have updates available.
 * Fetches manifests sequentially to avoid overwhelming the server/proxy.
 */
export async function checkSavedAddonUpdates(
  savedAddons: {
    id: string
    name: string
    installUrl: string
    manifest: { id: string; name: string; version: string }
  }[]
): Promise<AddonUpdateInfo[]> {
  console.log(`[Update Check] Checking ${savedAddons.length} saved addons sequentially...`)

  const results: AddonUpdateInfo[] = []

  for (const addon of savedAddons) {
    try {
      const latestManifest = await stremioClient.fetchAddonManifest(addon.installUrl)
      const hasUpdate = latestManifest.manifest.version !== addon.manifest.version

      console.log(
        `[Update Check] ${addon.name}: installed=${addon.manifest.version}, latest=${latestManifest.manifest.version}, hasUpdate=${hasUpdate}`
      )

      results.push({
        addonId: addon.id,
        name: addon.name,
        transportUrl: addon.installUrl,
        installedVersion: addon.manifest.version,
        latestVersion: latestManifest.manifest.version,
        hasUpdate,
      })
    } catch (error) {
      console.warn(`[Update Check] Failed to check ${addon.name}:`, error)
      console.warn(`  URL was: ${addon.installUrl}`)
    }
  }

  console.log(`[Update Check] Complete: ${results.length} checked`)

  return results
}
