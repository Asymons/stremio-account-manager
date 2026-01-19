import { AddonDescriptor } from './addon'

export type AccountStatus = 'active' | 'error'

export interface StremioAccount {
  id: string
  name: string
  email?: string
  authKey: string // Encrypted
  password?: string // Encrypted (optional)
  addons: AddonDescriptor[]
  lastSync: Date
  status: AccountStatus
}

export interface AccountCredentials {
  email: string
  password: string
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
  }>
}
