import { AddonDescriptor } from '@/types/addon'
import { DebridService } from '@/types/debrid'

// Base URL patterns for Torrentio detection
export const TORRENTIO_BASE_URLS = [
  'torrentio.strem.fun',
  'torrentio.strem.now.sh',
  'torrentio.strem.io',
]

export interface TorrentioConfig {
  baseUrl: string
  qualityFilter?: string
  debridService?: DebridService
  debridKey?: string
  otherParams: string[]
}

/**
 * Detects if a URL belongs to Torrentio addon
 */
export function isTorrentioAddon(transportUrl: string): boolean {
  try {
    const url = new URL(transportUrl)
    return TORRENTIO_BASE_URLS.some((baseUrl) => url.hostname === baseUrl)
  } catch {
    return false
  }
}

/**
 * Detects if a manifest ID belongs to Torrentio
 */
export function isTorrentioManifest(manifestId: string): boolean {
  return manifestId.includes('torrentio')
}

/**
 * Parses a Torrentio URL into its configuration components
 * Format: https://{domain}/{config}/manifest.json
 * Config: pipe-separated parameters (e.g., qualityfilter=480p|realdebrid=KEY)
 */
export function parseTorrentioUrl(url: string): TorrentioConfig {
  const urlObj = new URL(url)
  const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`

  // Extract the config segment (between domain and /manifest.json)
  const pathParts = urlObj.pathname.split('/')
  const configSegment = pathParts.find((part) => part && part !== 'manifest.json')

  const config: TorrentioConfig = {
    baseUrl,
    otherParams: [],
  }

  if (!configSegment) {
    return config
  }

  // Parse pipe-separated parameters
  const params = configSegment.split('|')

  for (const param of params) {
    if (param.startsWith('qualityfilter=')) {
      config.qualityFilter = param.substring('qualityfilter='.length)
    } else if (param.startsWith('realdebrid=')) {
      config.debridService = 'realdebrid'
      config.debridKey = param.substring('realdebrid='.length)
    } else if (param.startsWith('torbox=')) {
      config.debridService = 'torbox'
      config.debridKey = param.substring('torbox='.length)
    } else if (param) {
      // Keep other parameters we don't recognize
      config.otherParams.push(param)
    }
  }

  return config
}

/**
 * Builds a Torrentio URL from configuration components
 */
export function buildTorrentioUrl(config: TorrentioConfig): string {
  const params: string[] = []

  // Add quality filter if present
  if (config.qualityFilter) {
    params.push(`qualityfilter=${config.qualityFilter}`)
  }

  // Add debrid service and key if present
  if (config.debridService && config.debridKey) {
    if (config.debridService === 'realdebrid') {
      params.push(`realdebrid=${config.debridKey}`)
    } else if (config.debridService === 'torbox') {
      params.push(`torbox=${config.debridKey}`)
    }
  }

  // Add other params
  params.push(...config.otherParams)

  // Build the URL
  const configSegment = params.length > 0 ? params.join('|') : ''
  const path = configSegment ? `/${configSegment}/manifest.json` : '/manifest.json'

  return `${config.baseUrl}${path}`
}

/**
 * Applies a debrid service and API key to a Torrentio URL
 * Replaces existing debrid configuration if present
 */
export function applyDebridToTorrentioUrl(
  url: string,
  service: DebridService,
  apiKey: string
): string {
  const config = parseTorrentioUrl(url)

  // Update debrid configuration
  config.debridService = service
  config.debridKey = apiKey

  return buildTorrentioUrl(config)
}

/**
 * Removes debrid configuration from a Torrentio URL
 */
export function removeDebridFromTorrentioUrl(url: string): string {
  const config = parseTorrentioUrl(url)

  // Remove debrid configuration
  delete config.debridService
  delete config.debridKey

  return buildTorrentioUrl(config)
}

/**
 * Finds all Torrentio addons in a list of addons
 */
export function findAllTorrentioAddons(addons: AddonDescriptor[]): AddonDescriptor[] {
  return addons.filter((addon) => isTorrentioAddon(addon.transportUrl))
}

/**
 * Extracts the current debrid service from a Torrentio URL (if any)
 */
export function getCurrentDebridService(url: string): DebridService | null {
  const config = parseTorrentioUrl(url)
  return config.debridService || null
}

/**
 * Extracts the current debrid API key from a Torrentio URL (if any)
 */
export function getCurrentDebridKey(url: string): string | null {
  const config = parseTorrentioUrl(url)
  return config.debridKey || null
}
