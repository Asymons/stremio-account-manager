import {
  installAddon as apiInstallAddon,
  removeAddon as apiRemoveAddon,
  getAddons,
  updateAddons,
} from '@/api/addons'
import { loginWithCredentials } from '@/api/auth'
import { decrypt, encrypt } from '@/lib/crypto'
import { useAuthStore } from '@/store/authStore'
import { accountExportSchema } from '@/lib/validation'
import { loadAddonLibrary, saveAddonLibrary } from '@/lib/addon-storage'
import { toast } from '@/hooks/use-toast'
import { AccountExport, StremioAccount } from '@/types/account'
import { AddonDescriptor } from '@/types/addon'
import { SavedAddon } from '@/types/saved-addon'
import localforage from 'localforage'
import { create } from 'zustand'

const STORAGE_KEY = 'stremio-manager:accounts'

// Helper function to sanitize addon manifests by converting null to undefined
const sanitizeAddonManifest = (manifest: AddonDescriptor['manifest']) => {
  return {
    ...manifest,
    logo: manifest.logo ?? undefined,
    background: manifest.background ?? undefined,
    idPrefixes: manifest.idPrefixes ?? undefined,
  }
}

// Helper function to get encryption key from auth store
const getEncryptionKey = () => {
  const key = useAuthStore.getState().encryptionKey
  if (!key) throw new Error('App is locked')
  return key
}

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
  exportAccounts: (includeCredentials: boolean) => Promise<string>
  importAccounts: (json: string) => Promise<void>
  updateAccount: (
    id: string,
    data: { name: string; authKey?: string; email?: string; password?: string }
  ) => Promise<void>
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
        const accounts = storedAccounts.map((acc) => ({
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

      // Normalize addon manifests
      const normalizedAddons = addons.map((addon) => ({
        ...addon,
        manifest: sanitizeAddonManifest(addon.manifest),
      }))

      const account: StremioAccount = {
        id: crypto.randomUUID(),
        name,
        authKey: await encrypt(authKey, getEncryptionKey()),
        addons: normalizedAddons,
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

      // Normalize addon manifests
      const normalizedAddons = addons.map((addon) => ({
        ...addon,
        manifest: sanitizeAddonManifest(addon.manifest),
      }))

      const account: StremioAccount = {
        id: crypto.randomUUID(),
        name: name || email,
        email,
        authKey: await encrypt(response.authKey, getEncryptionKey()),
        password: await encrypt(password, getEncryptionKey()),
        addons: normalizedAddons,
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

      const authKey = await decrypt(account.authKey, getEncryptionKey())
      const addons = await getAddons(authKey)

      // Normalize addon manifests
      const normalizedAddons = addons.map((addon) => ({
        ...addon,
        manifest: sanitizeAddonManifest(addon.manifest),
      }))

      const updatedAccount = {
        ...account,
        addons: normalizedAddons,
        lastSync: new Date(),
        status: 'active' as const,
      }

      const accounts = get().accounts.map((acc) => (acc.id === id ? updatedAccount : acc))

      set({ accounts })
      await localforage.setItem(STORAGE_KEY, accounts)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sync account'
      const account = get().accounts.find((acc) => acc.id === id)

      // Mark account as error
      const accounts = get().accounts.map((acc) =>
        acc.id === id ? { ...acc, status: 'error' as const } : acc
      )
      set({ accounts, error: message })

      // Show toast notification
      toast({
        variant: 'destructive',
        title: 'Sync Failed',
        description: `Unable to sync "${account?.name}". Please check your credentials.`,
      })

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
        const authKey = await decrypt(account.authKey, getEncryptionKey())
        const addons = await getAddons(authKey)

        // Normalize addon manifests
        const normalizedAddons = addons.map((addon) => ({
          ...addon,
          manifest: sanitizeAddonManifest(addon.manifest),
        }))

        const updatedAccount = {
          ...account,
          addons: normalizedAddons,
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

        // Show toast notification for this account
        toast({
          variant: 'destructive',
          title: 'Sync Failed',
          description: `Unable to sync "${account.name}". Please check your credentials.`,
        })
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

      const authKey = await decrypt(account.authKey, getEncryptionKey())
      const updatedAddons = await apiInstallAddon(authKey, addonUrl)

      // Normalize addon manifests
      const normalizedAddons = updatedAddons.map((addon) => ({
        ...addon,
        manifest: sanitizeAddonManifest(addon.manifest),
      }))

      const updatedAccount = {
        ...account,
        addons: normalizedAddons,
        lastSync: new Date(),
      }

      const accounts = get().accounts.map((acc) => (acc.id === accountId ? updatedAccount : acc))

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

      const authKey = await decrypt(account.authKey, getEncryptionKey())
      const updatedAddons = await apiRemoveAddon(authKey, addonId)

      // Normalize addon manifests
      const normalizedAddons = updatedAddons.map((addon) => ({
        ...addon,
        manifest: sanitizeAddonManifest(addon.manifest),
      }))

      const updatedAccount = {
        ...account,
        addons: normalizedAddons,
        lastSync: new Date(),
      }

      const accounts = get().accounts.map((acc) => (acc.id === accountId ? updatedAccount : acc))

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

      const authKey = await decrypt(account.authKey, getEncryptionKey())
      await updateAddons(authKey, newOrder)

      const updatedAccount = {
        ...account,
        addons: newOrder,
        lastSync: new Date(),
      }

      const accounts = get().accounts.map((acc) => (acc.id === accountId ? updatedAccount : acc))

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

  exportAccounts: async (includeCredentials) => {
    try {
      // Load saved addon library
      const addonLibrary = await loadAddonLibrary()
      const savedAddons = Object.values(addonLibrary).map((addon) => ({
        ...addon,
        manifest: sanitizeAddonManifest(addon.manifest),
        createdAt: addon.createdAt.toISOString(),
        updatedAt: addon.updatedAt.toISOString(),
        lastUsed: addon.lastUsed?.toISOString(),
      }))

      const data: AccountExport = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        accounts: await Promise.all(
          get().accounts.map(async (acc) => ({
            name: acc.name,
            email: acc.email,
            authKey: includeCredentials
              ? await decrypt(acc.authKey, getEncryptionKey())
              : undefined,
            password:
              includeCredentials && acc.password
                ? await decrypt(acc.password, getEncryptionKey())
                : undefined,
            addons: acc.addons.map((addon) => ({
              ...addon,
              manifest: sanitizeAddonManifest(addon.manifest),
            })),
          }))
        ),
        savedAddons: savedAddons.length > 0 ? savedAddons : undefined,
      }

      return JSON.stringify(data, null, 2)
    } catch (error) {
      console.error('Failed to load addon library during export:', error)
      // Fallback: export without saved addons
      const data: AccountExport = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        accounts: await Promise.all(
          get().accounts.map(async (acc) => ({
            name: acc.name,
            email: acc.email,
            authKey: includeCredentials
              ? await decrypt(acc.authKey, getEncryptionKey())
              : undefined,
            password:
              includeCredentials && acc.password
                ? await decrypt(acc.password, getEncryptionKey())
                : undefined,
            addons: acc.addons.map((addon) => ({
              ...addon,
              manifest: sanitizeAddonManifest(addon.manifest),
            })),
          }))
        ),
      }

      return JSON.stringify(data, null, 2)
    }
  },

  importAccounts: async (json) => {
    set({ loading: true, error: null })
    try {
      const data = JSON.parse(json)

      // Validate with Zod
      const validated = accountExportSchema.parse(data)

      const newAccounts: StremioAccount[] = await Promise.all(
        validated.accounts.map(async (acc) => ({
          id: crypto.randomUUID(),
          name: acc.name,
          email: acc.email,
          authKey: acc.authKey ? await encrypt(acc.authKey, getEncryptionKey()) : '',
          password: acc.password ? await encrypt(acc.password, getEncryptionKey()) : undefined,
          addons: acc.addons.map((addon) => ({
            ...addon,
            manifest: sanitizeAddonManifest(addon.manifest),
          })),
          lastSync: new Date(),
          status: 'active',
        }))
      )

      // Merge with existing accounts
      const accounts = [...get().accounts, ...newAccounts]
      set({ accounts })

      await localforage.setItem(STORAGE_KEY, accounts)

      // Import saved addons if present
      if (validated.savedAddons && validated.savedAddons.length > 0) {
        try {
          const existingLibrary = await loadAddonLibrary()

          // Merge saved addons with existing library (generate new IDs to avoid conflicts)
          const newLibrary = { ...existingLibrary }
          for (const savedAddon of validated.savedAddons) {
            const newId = crypto.randomUUID()
            const addon: SavedAddon = {
              ...savedAddon,
              id: newId,
              manifest: sanitizeAddonManifest(savedAddon.manifest),
              createdAt: new Date(savedAddon.createdAt),
              updatedAt: new Date(savedAddon.updatedAt),
              lastUsed: savedAddon.lastUsed ? new Date(savedAddon.lastUsed) : undefined,
            }
            newLibrary[newId] = addon
          }

          await saveAddonLibrary(newLibrary)
        } catch (error) {
          console.error('Failed to import saved addons:', error)
          // Don't fail the entire import if saved addons fail
          toast({
            variant: 'destructive',
            title: 'Warning',
            description: 'Accounts imported successfully, but saved addons failed to import.',
          })
        }
      }
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

      const updatedAccount = { ...account, name: data.name }

      // If credentials changed, re-validate
      if (data.authKey || (data.email && data.password)) {
        let authKey = ''

        if (data.authKey) {
          authKey = data.authKey
          updatedAccount.authKey = await encrypt(authKey, getEncryptionKey())
        } else if (data.email && data.password) {
          const response = await loginWithCredentials(data.email, data.password)
          authKey = response.authKey
          updatedAccount.email = data.email
          updatedAccount.password = await encrypt(data.password, getEncryptionKey())
          updatedAccount.authKey = await encrypt(authKey, getEncryptionKey())
        }

        // Fetch addons with new key
        const addons = await getAddons(authKey)

        // Normalize addon manifests
        const normalizedAddons = addons.map((addon) => ({
          ...addon,
          manifest: sanitizeAddonManifest(addon.manifest),
        }))

        updatedAccount.addons = normalizedAddons
        updatedAccount.status = 'active'
        updatedAccount.lastSync = new Date()
      }

      const accounts = get().accounts.map((acc) => (acc.id === id ? updatedAccount : acc))

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
