// Generic API service types - can be extended in the future
export type ApiServiceType = 'realdebrid' | 'torbox' | 'tmdb' | 'trakt' | string // Allow custom service types

// Debrid-specific service types (subset of ApiServiceType)
export type DebridService = 'realdebrid' | 'torbox'

export interface ApiKey {
  id: string // UUID for key
  service: ApiServiceType // Service identifier (e.g., 'realdebrid', 'tmdb', 'trakt')
  apiKey: string // Encrypted API key/token
  label?: string // Optional name (e.g., "My RD Account", "Work TMDB")
  metadata?: Record<string, unknown> // Optional service-specific metadata
  createdAt: Date
}

export interface ApiKeyInput {
  service: ApiServiceType
  apiKey: string // Plain text (for form)
  label?: string
  metadata?: Record<string, unknown>
}

export interface AddonDebridConfig {
  addonId: string // manifest.id
  apiKeyId: string // References ApiKey.id
  service: DebridService // Cached for quick access
}

export interface AddonTypeDetector {
  name: string // "Torrentio"
  baseUrls: string[] // Domain patterns for detection
  detect: (url: string) => boolean
}

// Helper to check if a service is a debrid service
export function isDebridService(service: ApiServiceType): service is DebridService {
  return service === 'realdebrid' || service === 'torbox'
}

// Helper to get debrid API keys from a list of API keys
export function getDebridApiKeys(apiKeys: ApiKey[]): ApiKey[] {
  return apiKeys.filter((key) => isDebridService(key.service))
}
