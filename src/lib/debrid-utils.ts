import { AddonDescriptor } from '@/types/addon'
import { ApiKey, AddonTypeDetector, isDebridService } from '@/types/debrid'
import {
  TORRENTIO_BASE_URLS,
  isTorrentioAddon,
  applyDebridToTorrentioUrl,
  removeDebridFromTorrentioUrl,
} from './addons/torrentio-utils'

// Addon type registry
export const ADDON_TYPES: Record<string, AddonTypeDetector> = {
  torrentio: {
    name: 'Torrentio',
    baseUrls: TORRENTIO_BASE_URLS,
    detect: isTorrentioAddon,
  },
  // Future: other debrid-supported addons can be added here
}

/**
 * Gets the addon type for a given transport URL
 * Returns the type key (e.g., 'torrentio') or null if not recognized
 */
export function getAddonType(transportUrl: string): string | null {
  for (const [typeKey, detector] of Object.entries(ADDON_TYPES)) {
    if (detector.detect(transportUrl)) {
      return typeKey
    }
  }
  return null
}

/**
 * Checks if an addon is supported for debrid configuration
 */
export function isDebridSupportedAddon(transportUrl: string): boolean {
  return getAddonType(transportUrl) !== null
}

/**
 * Applies a debrid API key to any supported addon
 * Returns a new addon descriptor with updated transportUrl
 */
export function applyDebridKeyToAddon(addon: AddonDescriptor, apiKey: ApiKey): AddonDescriptor {
  const addonType = getAddonType(addon.transportUrl)

  if (!addonType) {
    throw new Error('Addon type not supported for debrid configuration')
  }

  // Validate that this is a debrid service
  if (!isDebridService(apiKey.service)) {
    throw new Error(`API key service "${apiKey.service}" is not a debrid service`)
  }

  let newTransportUrl: string

  switch (addonType) {
    case 'torrentio':
      newTransportUrl = applyDebridToTorrentioUrl(addon.transportUrl, apiKey.service, apiKey.apiKey)
      break
    default:
      throw new Error(`Debrid configuration not implemented for addon type: ${addonType}`)
  }

  return {
    ...addon,
    transportUrl: newTransportUrl,
  }
}

/**
 * Removes debrid configuration from any supported addon
 * Returns a new addon descriptor with updated transportUrl
 */
export function removeDebridFromAddon(addon: AddonDescriptor): AddonDescriptor {
  const addonType = getAddonType(addon.transportUrl)

  if (!addonType) {
    throw new Error('Addon type not supported for debrid configuration')
  }

  let newTransportUrl: string

  switch (addonType) {
    case 'torrentio':
      newTransportUrl = removeDebridFromTorrentioUrl(addon.transportUrl)
      break
    default:
      throw new Error(`Debrid removal not implemented for addon type: ${addonType}`)
  }

  return {
    ...addon,
    transportUrl: newTransportUrl,
  }
}

/**
 * Finds all addons of a specific type
 */
export function findAddonsByType(addons: AddonDescriptor[], addonType: string): AddonDescriptor[] {
  const detector = ADDON_TYPES[addonType]
  if (!detector) {
    return []
  }

  return addons.filter((addon) => detector.detect(addon.transportUrl))
}

/**
 * Gets a list of all supported addon type names
 */
export function getSupportedAddonTypes(): Array<{ key: string; name: string }> {
  return Object.entries(ADDON_TYPES).map(([key, detector]) => ({
    key,
    name: detector.name,
  }))
}

/**
 * Gets the display name for an addon type
 */
export function getAddonTypeName(addonTypeKey: string): string {
  return ADDON_TYPES[addonTypeKey]?.name || addonTypeKey
}
