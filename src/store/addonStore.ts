import {
  getAddons,
  reinstallAddon as reinstallAddonApi,
  updateAddons,
  fetchAddonManifest,
} from '@/api/addons'
import { checkAllAddonsHealth } from '@/lib/addon-health'
import { mergeAddons, removeAddons } from '@/lib/addon-merger'
import {
  findSavedAddonByUrl,
  loadAccountAddonStates,
  loadAddonLibrary,
  saveAccountAddonStates,
  saveAddonLibrary,
} from '@/lib/addon-storage'
import { normalizeTagName } from '@/lib/addon-validator'
import { decrypt } from '@/lib/crypto'
import { useAuthStore } from '@/store/authStore'
import { AddonManifest } from '@/types/addon'
import {
  AccountAddonState,
  BulkResult,
  InstalledAddon,
  MergeResult,
  MergeStrategy,
  SavedAddon,
} from '@/types/saved-addon'
import { create } from 'zustand'
import localforage from 'localforage'

// Helper function to get encryption key from auth store
const getEncryptionKey = () => {
  const key = useAuthStore.getState().encryptionKey
  if (!key) throw new Error('App is locked')
  return key
}

interface AddonStore {
  // State
  library: Record<string, SavedAddon>
  latestVersions: Record<string, string>
  accountStates: Record<string, AccountAddonState>
  loading: boolean
  error: string | null
  checkingHealth: boolean

  // Initialization
  initialize: () => Promise<void>

  // === Update Management ===
  updateLatestVersions: (versions: Record<string, string>) => void
  getLatestVersion: (manifestId: string) => string | undefined

  // === Saved Addon Management ===
  createSavedAddon: (
    name: string,
    installUrl: string,
    tags?: string[],
    existingManifest?: AddonManifest
  ) => Promise<string>
  updateSavedAddon: (
    id: string,
    updates: Partial<Pick<SavedAddon, 'name' | 'tags' | 'installUrl'>>
  ) => Promise<void>
  updateSavedAddonManifest: (id: string) => Promise<void>
  deleteSavedAddon: (id: string) => Promise<void>
  getSavedAddon: (id: string) => SavedAddon | null

  // === Tag Management ===
  getSavedAddonsByTag: (tag: string) => SavedAddon[]
  getAllTags: () => string[]
  renameTag: (oldTag: string, newTag: string) => Promise<void>

  // === Application (Single Saved Addon) ===
  applySavedAddonToAccount: (
    savedAddonId: string,
    accountId: string,
    accountAuthKey: string,
    strategy?: MergeStrategy
  ) => Promise<MergeResult>
  applySavedAddonToAccounts: (
    savedAddonId: string,
    accountIds: Array<{ id: string; authKey: string }>,
    strategy?: MergeStrategy
  ) => Promise<BulkResult>

  // === Application (Tag-based) ===
  applyTagToAccount: (
    tag: string,
    accountId: string,
    accountAuthKey: string,
    strategy?: MergeStrategy
  ) => Promise<MergeResult>
  applyTagToAccounts: (
    tag: string,
    accountIds: Array<{ id: string; authKey: string }>,
    strategy?: MergeStrategy
  ) => Promise<BulkResult>

  // === Bulk Operations (Account-First Workflow) ===
  bulkApplySavedAddons: (
    savedAddonIds: string[],
    accountIds: Array<{ id: string; authKey: string }>,
    strategy?: MergeStrategy
  ) => Promise<BulkResult>
  bulkApplyTag: (
    tag: string,
    accountIds: Array<{ id: string; authKey: string }>,
    strategy?: MergeStrategy
  ) => Promise<BulkResult>
  bulkRemoveAddons: (
    addonIds: string[],
    accountIds: Array<{ id: string; authKey: string }>
  ) => Promise<BulkResult>
  bulkRemoveByTag: (
    tag: string,
    accountIds: Array<{ id: string; authKey: string }>
  ) => Promise<BulkResult>
  bulkReinstallAddons: (
    addonIds: string[],
    accountIds: Array<{ id: string; authKey: string }>
  ) => Promise<BulkResult>

  // === Sync ===
  syncAccountState: (accountId: string, accountAuthKey: string) => Promise<void>
  syncAllAccountStates: (accounts: Array<{ id: string; authKey: string }>) => Promise<void>

  // === Import/Export ===
  exportLibrary: () => string
  importLibrary: (json: string, merge: boolean) => Promise<void>

  // === Health Checking ===
  checkAllHealth: () => Promise<void>

  // Utility
  clearError: () => void
  reset: () => void
}

export const useAddonStore = create<AddonStore>((set, get) => ({
  library: {},
  latestVersions: {},
  accountStates: {},
  loading: false,
  error: null,
  checkingHealth: false,

  initialize: async () => {
    try {
      const [library, accountStates, latestVersions] = await Promise.all([
        loadAddonLibrary(),
        loadAccountAddonStates(),
        localforage.getItem<Record<string, string>>('stremio-manager:latest-versions'),
      ])

      set({
        library,
        accountStates,
        latestVersions: latestVersions || {},
      })
    } catch (error) {
      console.error('Failed to initialize addon store:', error)
      set({ error: 'Failed to load addon data' })
    }
  },

  updateLatestVersions: (versions) => {
    const newVersions = { ...get().latestVersions, ...versions }
    set({ latestVersions: newVersions })
    localforage.setItem('stremio-manager:latest-versions', newVersions).catch(console.error)
  },

  getLatestVersion: (manifestId) => {
    return get().latestVersions[manifestId]
  },

  // === Saved Addon Management ===

  createSavedAddon: async (name, installUrl, tags = [], existingManifest) => {
    set({ loading: true, error: null })
    try {
      let manifest = existingManifest

      // If no manifest provided, fetch it from the URL
      if (!manifest) {
        const addonDescriptor = await fetchAddonManifest(installUrl)
        manifest = addonDescriptor.manifest
      }

      // Normalize tags
      const normalizedTags = tags.map(normalizeTagName).filter(Boolean)

      // Use provided name or fall back to manifest name
      const addonName = name.trim() || manifest.name

      const savedAddon: SavedAddon = {
        id: crypto.randomUUID(),
        name: addonName,
        installUrl,
        manifest,
        tags: normalizedTags,
        createdAt: new Date(),
        updatedAt: new Date(),
        sourceType: 'manual',
      }

      const library = { ...get().library, [savedAddon.id]: savedAddon }
      set({ library })

      await saveAddonLibrary(library)
      return savedAddon.id
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create saved addon'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  updateSavedAddon: async (id, updates) => {
    set({ loading: true, error: null })
    try {
      const savedAddon = get().library[id]
      if (!savedAddon) {
        throw new Error('Saved addon not found')
      }

      const updatedSavedAddon = { ...savedAddon }

      // Update other fields
      if (updates.name !== undefined) {
        updatedSavedAddon.name = updates.name.trim()
      }
      if (updates.tags !== undefined) {
        updatedSavedAddon.tags = updates.tags.map(normalizeTagName).filter(Boolean)
      }

      updatedSavedAddon.updatedAt = new Date()

      const library = { ...get().library, [id]: updatedSavedAddon }
      set({ library })

      await saveAddonLibrary(library)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update saved addon'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  updateSavedAddonManifest: async (id) => {
    const savedAddon = get().library[id]
    if (!savedAddon) {
      throw new Error('Saved addon not found')
    }

    // Capture previous version for logging
    const previousVersion = savedAddon.manifest.version

    // Fetch fresh manifest from the install URL
    const addonDescriptor = await fetchAddonManifest(savedAddon.installUrl)
    const freshManifest = addonDescriptor.manifest

    // Verify manifest ID matches (prevent replacing with wrong addon)
    if (freshManifest.id !== savedAddon.manifest.id) {
      throw new Error('Addon ID mismatch - this may be a different addon')
    }

    // Update the saved addon with fresh manifest
    const updatedSavedAddon = {
      ...savedAddon,
      manifest: freshManifest,
      updatedAt: new Date(),
    }

    const library = { ...get().library, [id]: updatedSavedAddon }
    set({ library })

    await saveAddonLibrary(library)

    // Update latestVersions to clear the update badge
    const latestVersions = { ...get().latestVersions }
    latestVersions[freshManifest.id] = freshManifest.version
    set({ latestVersions })
    localforage.setItem('stremio-manager:latest-versions', latestVersions).catch(console.error)

    console.log(
      `Updated saved addon "${savedAddon.name}" from v${previousVersion} to v${freshManifest.version}`
    )
  },

  deleteSavedAddon: async (id) => {
    const library = { ...get().library }
    delete library[id]
    set({ library })
    await saveAddonLibrary(library)
  },

  getSavedAddon: (id) => {
    return get().library[id] || null
  },

  // === Tag Management ===

  getSavedAddonsByTag: (tag) => {
    const normalizedTag = normalizeTagName(tag)
    return Object.values(get().library).filter((savedAddon) =>
      savedAddon.tags.some((t) => normalizeTagName(t) === normalizedTag)
    )
  },

  getAllTags: () => {
    const tagsSet = new Set<string>()
    Object.values(get().library).forEach((savedAddon) => {
      savedAddon.tags.forEach((tag) => tagsSet.add(tag))
    })
    return Array.from(tagsSet).sort()
  },

  renameTag: async (oldTag, newTag) => {
    const normalizedOld = normalizeTagName(oldTag)
    const normalizedNew = normalizeTagName(newTag)

    if (!normalizedNew) {
      throw new Error('Invalid new tag name')
    }

    const library = { ...get().library }
    let hasChanges = false

    for (const savedAddon of Object.values(library)) {
      const tagIndex = savedAddon.tags.findIndex((t) => normalizeTagName(t) === normalizedOld)
      if (tagIndex >= 0) {
        savedAddon.tags[tagIndex] = normalizedNew
        savedAddon.updatedAt = new Date()
        hasChanges = true
      }
    }

    if (hasChanges) {
      set({ library })
      await saveAddonLibrary(library)
    }
  },

  // === Application (Single Saved Addon) ===

  applySavedAddonToAccount: async (
    savedAddonId,
    accountId,
    accountAuthKey,
    strategy = 'replace-matching'
  ) => {
    set({ loading: true, error: null })
    try {
      const savedAddon = get().library[savedAddonId]
      if (!savedAddon) {
        throw new Error('Saved addon not found')
      }

      // Get current addons from account
      const authKey = await decrypt(accountAuthKey, getEncryptionKey())
      const currentAddons = await getAddons(authKey)

      // Merge the saved addon
      const { addons: updatedAddons, result } = await mergeAddons(
        currentAddons,
        [savedAddon],
        strategy
      )

      // Update account addons
      await updateAddons(authKey, updatedAddons)

      // Update saved addon lastUsed
      const library = { ...get().library }
      library[savedAddonId] = { ...savedAddon, lastUsed: new Date() }
      set({ library })
      await saveAddonLibrary(library)

      // Sync account state
      await get().syncAccountState(accountId, accountAuthKey)

      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to apply saved addon'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  applySavedAddonToAccounts: async (savedAddonId, accountIds, strategy = 'replace-matching') => {
    const savedAddon = get().library[savedAddonId]
    if (!savedAddon) {
      throw new Error('Saved addon not found')
    }

    return get().bulkApplySavedAddons([savedAddonId], accountIds, strategy)
  },

  // === Application (Tag-based) ===

  applyTagToAccount: async (tag, accountId, accountAuthKey, strategy = 'replace-matching') => {
    const savedAddons = get().getSavedAddonsByTag(tag)
    if (savedAddons.length === 0) {
      throw new Error(`No saved addons found with tag: ${tag}`)
    }

    set({ loading: true, error: null })
    try {
      // Get current addons from account
      const authKey = await decrypt(accountAuthKey, getEncryptionKey())
      const currentAddons = await getAddons(authKey)

      // Merge all saved addons with this tag
      const { addons: updatedAddons, result } = await mergeAddons(
        currentAddons,
        savedAddons,
        strategy
      )

      // Update account addons
      await updateAddons(authKey, updatedAddons)

      // Update saved addon lastUsed for all applied saved addons
      const library = { ...get().library }
      savedAddons.forEach((savedAddon) => {
        library[savedAddon.id] = { ...savedAddon, lastUsed: new Date() }
      })
      set({ library })
      await saveAddonLibrary(library)

      // Sync account state
      await get().syncAccountState(accountId, accountAuthKey)

      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to apply tag'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  applyTagToAccounts: async (tag, accountIds, strategy = 'replace-matching') => {
    return get().bulkApplyTag(tag, accountIds, strategy)
  },

  // === Bulk Operations ===

  bulkApplySavedAddons: async (savedAddonIds, accountIds, strategy = 'replace-matching') => {
    set({ loading: true, error: null })
    try {
      const savedAddons = savedAddonIds
        .map((id) => get().library[id])
        .filter(Boolean) as SavedAddon[]

      if (savedAddons.length === 0) {
        throw new Error('No valid saved addons found')
      }

      const result: BulkResult = {
        success: 0,
        failed: 0,
        errors: [],
        details: [],
      }

      for (const { id: accountId, authKey: accountAuthKey } of accountIds) {
        try {
          const authKey = await decrypt(accountAuthKey, getEncryptionKey())
          const currentAddons = await getAddons(authKey)

          const { addons: updatedAddons, result: mergeResult } = await mergeAddons(
            currentAddons,
            savedAddons,
            strategy
          )

          await updateAddons(authKey, updatedAddons)

          result.success++
          result.details.push({ accountId, result: mergeResult })

          // Sync account state
          await get().syncAccountState(accountId, accountAuthKey)
        } catch (error) {
          result.failed++
          result.errors.push({
            accountId,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      // Update saved addon lastUsed for all applied saved addons
      const library = { ...get().library }
      savedAddons.forEach((savedAddon) => {
        library[savedAddon.id] = { ...savedAddon, lastUsed: new Date() }
      })
      set({ library })
      await saveAddonLibrary(library)

      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to apply saved addons'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  bulkApplyTag: async (tag, accountIds, strategy = 'replace-matching') => {
    const savedAddons = get().getSavedAddonsByTag(tag)
    if (savedAddons.length === 0) {
      throw new Error(`No saved addons found with tag: ${tag}`)
    }

    return get().bulkApplySavedAddons(
      savedAddons.map((s) => s.id),
      accountIds,
      strategy
    )
  },

  bulkRemoveAddons: async (addonIds, accountIds) => {
    set({ loading: true, error: null })
    try {
      const result: BulkResult = {
        success: 0,
        failed: 0,
        errors: [],
        details: [],
      }

      for (const { id: accountId, authKey: accountAuthKey } of accountIds) {
        try {
          const authKey = await decrypt(accountAuthKey, getEncryptionKey())
          const currentAddons = await getAddons(authKey)

          const { addons: updatedAddons, protectedAddons } = removeAddons(currentAddons, addonIds)

          await updateAddons(authKey, updatedAddons)

          result.success++
          result.details.push({
            accountId,
            result: {
              added: [],
              updated: [],
              skipped: [],
              protected: protectedAddons.map((id) => ({
                addonId: id,
                name: currentAddons.find((a) => a.manifest.id === id)?.manifest.name || id,
              })),
            },
          })

          // Sync account state
          await get().syncAccountState(accountId, accountAuthKey)
        } catch (error) {
          result.failed++
          result.errors.push({
            accountId,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove addons'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  bulkRemoveByTag: async (tag, accountIds) => {
    const savedAddons = get().getSavedAddonsByTag(tag)
    if (savedAddons.length === 0) {
      throw new Error(`No saved addons found with tag: ${tag}`)
    }

    const addonIds = savedAddons.map((s) => s.manifest.id)
    return get().bulkRemoveAddons(addonIds, accountIds)
  },

  bulkReinstallAddons: async (addonIds, accountIds) => {
    set({ loading: true, error: null })
    try {
      const result: BulkResult = {
        success: 0,
        failed: 0,
        errors: [],
        details: [],
      }

      for (const { id: accountId, authKey: accountAuthKey } of accountIds) {
        try {
          const authKey = await decrypt(accountAuthKey, getEncryptionKey())

          // Reinstall each addon in place to preserve ordering
          const updateResults: Array<{
            addonId: string
            previousVersion?: string
            newVersion?: string
          }> = []

          for (const addonId of addonIds) {
            try {
              const reinstallResult = await reinstallAddonApi(authKey, addonId)
              if (reinstallResult.updatedAddon) {
                updateResults.push({
                  addonId,
                  previousVersion: reinstallResult.previousVersion,
                  newVersion: reinstallResult.newVersion,
                })
              }
            } catch (error) {
              // Log but continue with other addons
              console.warn(`Failed to reinstall addon ${addonId} on account ${accountId}:`, error)
            }
          }

          result.success++
          result.details.push({
            accountId,
            result: {
              added: [],
              updated: updateResults.map((r) => ({
                addonId: r.addonId,
                oldUrl: '',
                newUrl: '',
                previousVersion: r.previousVersion,
                newVersion: r.newVersion,
              })),
              skipped: [],
              protected: [],
            },
          })

          // Sync account state
          await get().syncAccountState(accountId, accountAuthKey)
        } catch (error) {
          result.failed++
          result.errors.push({
            accountId,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reinstall addons'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  // === Sync ===

  syncAccountState: async (accountId, accountAuthKey) => {
    try {
      // Get current addons from Stremio
      const authKey = await decrypt(accountAuthKey, getEncryptionKey())
      const currentAddons = await getAddons(authKey)

      // Get existing state
      const existingState = get().accountStates[accountId]
      const installedAddons: InstalledAddon[] = []

      for (const addon of currentAddons) {
        const existing = existingState?.installedAddons.find((a) => a.addonId === addon.manifest.id)

        if (existing) {
          // Update existing
          installedAddons.push({
            ...existing,
            installUrl: addon.transportUrl,
          })
        } else {
          // New addon - try to auto-link to saved addon
          const matchingSavedAddon = findSavedAddonByUrl(get().library, addon.transportUrl)

          installedAddons.push({
            savedAddonId: matchingSavedAddon?.id || null,
            addonId: addon.manifest.id,
            installUrl: addon.transportUrl,
            installedAt: new Date(),
            installedVia: matchingSavedAddon ? 'saved-addon' : 'manual',
            appliedTags: matchingSavedAddon?.tags,
          })
        }
      }

      const state: AccountAddonState = {
        accountId,
        installedAddons,
        lastSync: new Date(),
      }

      const accountStates = { ...get().accountStates, [accountId]: state }
      set({ accountStates })
      await saveAccountAddonStates(accountStates)
    } catch (error) {
      console.error('Failed to sync account state:', error)
      throw error
    }
  },

  syncAllAccountStates: async (accounts) => {
    for (const account of accounts) {
      try {
        await get().syncAccountState(account.id, account.authKey)
      } catch (error) {
        console.error(`Failed to sync account ${account.id}:`, error)
      }
    }
  },

  // === Import/Export ===

  exportLibrary: () => {
    const library = get().library
    return JSON.stringify(
      {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        savedAddons: Object.values(library),
      },
      null,
      2
    )
  },

  importLibrary: async (json, merge) => {
    set({ loading: true, error: null })
    try {
      const data = JSON.parse(json)

      // Support both old 'templates' and new 'savedAddons' format
      const savedAddons = data.savedAddons || data.templates

      if (!savedAddons || !Array.isArray(savedAddons)) {
        throw new Error('Invalid export format')
      }

      const library = merge ? { ...get().library } : {}

      for (const savedAddon of savedAddons) {
        // Generate new ID if merging to avoid conflicts
        const id = merge ? crypto.randomUUID() : savedAddon.id

        library[id] = {
          ...savedAddon,
          id,
          createdAt: new Date(savedAddon.createdAt),
          updatedAt: new Date(savedAddon.updatedAt),
          lastUsed: savedAddon.lastUsed ? new Date(savedAddon.lastUsed) : undefined,
        }
      }

      set({ library })
      await saveAddonLibrary(library)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import library'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  // === Health Checking ===

  checkAllHealth: async () => {
    set({ checkingHealth: true })
    try {
      const addons = Object.values(get().library)
      const updatedAddons = await checkAllAddonsHealth(addons)

      // Update library with health status
      const library: Record<string, SavedAddon> = {}
      updatedAddons.forEach((addon) => {
        library[addon.id] = addon
      })

      set({ library })
      await saveAddonLibrary(library)
    } catch (error) {
      console.error('Failed to check addon health:', error)
    } finally {
      set({ checkingHealth: false })
    }
  },

  clearError: () => set({ error: null }),

  reset: () => {
    set({
      library: {},
      latestVersions: {},
      accountStates: {},
      loading: false,
      error: null,
      checkingHealth: false,
    })
  },
}))
