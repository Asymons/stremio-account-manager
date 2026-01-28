import { AddonDescriptor } from './addon'
import { SavedAddon } from './saved-addon'
import { ApiKey } from './debrid'

export type AccountStatus = 'active' | 'error'

export interface StremioAccount {
  id: string
  name: string
  email?: string
  authKey: string // Encrypted
  password?: string // Encrypted (optional)
  addons: AddonDescriptor[]
  apiKeys?: ApiKey[] // Generic API keys (debrid, TMDB, Trakt, etc.)
  lastSync: Date
  status: AccountStatus
}

export interface AccountCredentials {
  email: string
  password: string
}

export interface SavedAddonExport extends Omit<SavedAddon, 'createdAt' | 'updatedAt' | 'lastUsed'> {
  createdAt: string
  updatedAt: string
  lastUsed?: string
}

export interface ApiKeyExport {
  id: string
  service: string
  apiKey: string // Plain text in export (if credentials included)
  label?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface AccountExport {
  version: string
  exportedAt: string
  accounts: Array<{
    name: string
    email?: string
    authKey?: string // User decides whether to include
    password?: string // User decides whether to include
    addons: AddonDescriptor[]
    apiKeys?: ApiKeyExport[] // API keys (if credentials included)
  }>
  savedAddons?: SavedAddonExport[]
}
