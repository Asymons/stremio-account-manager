import { installAddon as apiInstallAddon, removeAddon as apiRemoveAddon, getAddons, updateAddons } from '@/api/addons'
import { loginWithCredentials } from '@/api/auth'
import { decrypt, encrypt } from '@/lib/encryption'
import { accountExportSchema } from '@/lib/validation'
import { AccountExport, StremioAccount } from '@/types/account'
import { AddonDescriptor } from '@/types/addon'
import localforage from 'localforage'
import { create } from 'zustand'

const STORAGE_KEY = 'stremio-manager:accounts'

interface AccountStore {
  accounts: StremioAccount[]
  loading: boolean
  error: string | null

  // Actions
  initialize: () => Promise<void>
  addAccountByAuthKey: (authKey: string, name: string) => Promise<void>
  addAccountByCredentials: (email: string, password: string, name: string) => Promise<void>
  removeAccount: (id: string) => Promise<void>
  syncAccount: (id: string) => Promise<void>
  syncAllAccounts: () => Promise<void>
  installAddonToAccount: (accountId: string, addonUrl: string) => Promise<void>
  removeAddonFromAccount: (accountId: string, addonId: string) => Promise<void>
  reorderAddons: (accountId: string, newOrder: AddonDescriptor[]) => Promise<void>
  exportAccounts: (includeCredentials: boolean) => string
  importAccounts: (json: string) => Promise<void>
  updateAccount: (id: string, data: { name: string, authKey?: string, email?: string, password?: string }) => Promise<void>
  clearError: () => void
}

export const useAccountStore = create<AccountStore>((set, get) => ({
  accounts: [],
  loading: false,
  error: null,

  initialize: async () => {
    try {
      const storedAccounts = await localforage.getItem<StremioAccount[]>(STORAGE_KEY)
      if (storedAccounts && Array.isArray(storedAccounts)) {
        // Convert date strings back to Date objects
        const accounts = storedAccounts.map(acc => ({
          ...acc,
          lastSync: new Date(acc.lastSync),
        }))
        set({ accounts })
      }
    } catch (error) {
      console.error('Failed to load accounts from storage:', error)
      set({ error: 'Failed to load saved accounts' })
    }
  },

  addAccountByAuthKey: async (authKey, name) => {
    set({ loading: true, error: null })
    try {
      // Validate auth key by fetching addons
      const addons = await getAddons(authKey)

      const account: StremioAccount = {
        id: crypto.randomUUID(),
        name,
        authKey: encrypt(authKey),
        addons,
        lastSync: new Date(),
        status: 'active',
      }

      const accounts = [...get().accounts, account]
      set({ accounts })

      // Persist to storage
      await localforage.setItem(STORAGE_KEY, accounts)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add account'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  addAccountByCredentials: async (email, password, name) => {
    set({ loading: true, error: null })
    try {
      // Login to get auth key
      const response = await loginWithCredentials(email, password)

      // Fetch addons
      const addons = await getAddons(response.authKey)

      const account: StremioAccount = {
        id: crypto.randomUUID(),
        name: name || email,
        email,
        authKey: encrypt(response.authKey),
        password: encrypt(password),
        addons,
        lastSync: new Date(),
        status: 'active',
      }

      const accounts = [...get().accounts, account]
      set({ accounts })

      // Persist to storage
      await localforage.setItem(STORAGE_KEY, accounts)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add account'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  removeAccount: async (id) => {
    const accounts = get().accounts.filter((acc) => acc.id !== id)
    set({ accounts })
    await localforage.setItem(STORAGE_KEY, accounts)
  },

  syncAccount: async (id) => {
    set({ loading: true, error: null })
    try {
      const account = get().accounts.find((acc) => acc.id === id)
      if (!account) {
        throw new Error('Account not found')
      }

      const authKey = decrypt(account.authKey)
      const addons = await getAddons(authKey)

      const updatedAccount = {
        ...account,
        addons,
        lastSync: new Date(),
        status: 'active' as const,
      }

      const accounts = get().accounts.map((acc) =>
        acc.id === id ? updatedAccount : acc
      )

      set({ accounts })
      await localforage.setItem(STORAGE_KEY, accounts)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sync account'

      // Mark account as error
      const accounts = get().accounts.map((acc) =>
        acc.id === id ? { ...acc, status: 'error' as const } : acc
      )
      set({ accounts, error: message })

      await localforage.setItem(STORAGE_KEY, accounts)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  syncAllAccounts: async () => {
    set({ loading: true, error: null })
    const accounts = get().accounts

    for (const account of accounts) {
      try {
        const authKey = decrypt(account.authKey)
        const addons = await getAddons(authKey)

        const updatedAccount = {
          ...account,
          addons,
          lastSync: new Date(),
          status: 'active' as const,
        }

        const updatedAccounts = get().accounts.map((acc) =>
          acc.id === account.id ? updatedAccount : acc
        )

        set({ accounts: updatedAccounts })
      } catch (error) {
        // Mark account as error but continue with others
        const updatedAccounts = get().accounts.map((acc) =>
          acc.id === account.id ? { ...acc, status: 'error' as const } : acc
        )
        set({ accounts: updatedAccounts })
      }
    }

    await localforage.setItem(STORAGE_KEY, get().accounts)
    set({ loading: false })
  },

  installAddonToAccount: async (accountId, addonUrl) => {
    set({ loading: true, error: null })
    try {
      const account = get().accounts.find((acc) => acc.id === accountId)
      if (!account) {
        throw new Error('Account not found')
      }

      const authKey = decrypt(account.authKey)
      const updatedAddons = await apiInstallAddon(authKey, addonUrl)

      const updatedAccount = {
        ...account,
        addons: updatedAddons,
        lastSync: new Date(),
      }

      const accounts = get().accounts.map((acc) =>
        acc.id === accountId ? updatedAccount : acc
      )

      set({ accounts })
      await localforage.setItem(STORAGE_KEY, accounts)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to install addon'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  removeAddonFromAccount: async (accountId, addonId) => {
    set({ loading: true, error: null })
    try {
      const account = get().accounts.find((acc) => acc.id === accountId)
      if (!account) {
        throw new Error('Account not found')
      }

      const authKey = decrypt(account.authKey)
      const updatedAddons = await apiRemoveAddon(authKey, addonId)

      const updatedAccount = {
        ...account,
        addons: updatedAddons,
        lastSync: new Date(),
      }

      const accounts = get().accounts.map((acc) =>
        acc.id === accountId ? updatedAccount : acc
      )

      set({ accounts })
      await localforage.setItem(STORAGE_KEY, accounts)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove addon'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  reorderAddons: async (accountId, newOrder) => {
    set({ loading: true, error: null })
    try {
      const account = get().accounts.find((acc) => acc.id === accountId)
      if (!account) {
        throw new Error('Account not found')
      }

      const authKey = decrypt(account.authKey)
      await updateAddons(authKey, newOrder)

      const updatedAccount = {
        ...account,
        addons: newOrder,
        lastSync: new Date(),
      }

      const accounts = get().accounts.map((acc) =>
        acc.id === accountId ? updatedAccount : acc
      )

      set({ accounts })
      await localforage.setItem(STORAGE_KEY, accounts)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reorder addons'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  exportAccounts: (includeCredentials) => {
    const data: AccountExport = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      accounts: get().accounts.map((acc) => ({
        name: acc.name,
        email: acc.email,
        authKey: includeCredentials ? decrypt(acc.authKey) : undefined,
        password: includeCredentials && acc.password ? decrypt(acc.password) : undefined,
        addons: acc.addons,
      })),
    }

    return JSON.stringify(data, null, 2)
  },

  importAccounts: async (json) => {
    set({ loading: true, error: null })
    try {
      const data = JSON.parse(json)

      // Validate with Zod
      const validated = accountExportSchema.parse(data)

      const newAccounts: StremioAccount[] = validated.accounts.map((acc) => ({
        id: crypto.randomUUID(),
        name: acc.name,
        email: acc.email,
        authKey: acc.authKey ? encrypt(acc.authKey) : '',
        password: acc.password ? encrypt(acc.password) : undefined,
        addons: acc.addons,
        lastSync: new Date(),
        status: 'active',
      }))

      // Merge with existing accounts
      const accounts = [...get().accounts, ...newAccounts]
      set({ accounts })

      await localforage.setItem(STORAGE_KEY, accounts)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import accounts'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  updateAccount: async (id, data) => {
    set({ loading: true, error: null })
    try {
      const account = get().accounts.find((acc) => acc.id === id)
      if (!account) {
        throw new Error('Account not found')
      }

      let updatedAccount = { ...account, name: data.name }

      // If credentials changed, re-validate
      if (data.authKey || (data.email && data.password)) {
        let authKey = ''
        
        if (data.authKey) {
          authKey = data.authKey
          updatedAccount.authKey = encrypt(authKey)
        } else if (data.email && data.password) {
          const response = await loginWithCredentials(data.email, data.password)
          authKey = response.authKey
          updatedAccount.email = data.email
          updatedAccount.password = encrypt(data.password)
          updatedAccount.authKey = encrypt(authKey)
        }

        // Fetch addons with new key
        const addons = await getAddons(authKey)
        updatedAccount.addons = addons
        updatedAccount.status = 'active'
        updatedAccount.lastSync = new Date()
      }

      const accounts = get().accounts.map((acc) =>
        acc.id === id ? updatedAccount : acc
      )

      set({ accounts })
      await localforage.setItem(STORAGE_KEY, accounts)
    } catch (error) {
       const message = error instanceof Error ? error.message : 'Failed to update account'
       set({ error: message })
       throw error
    } finally {
      set({ loading: false })
    }
  },

  clearError: () => {
    set({ error: null })
  },
}))
