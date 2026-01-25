import { create } from 'zustand'
import {
  deriveKey,
  hashPassword,
  generateSalt,
  loadSalt,
  saveSalt,
  loadPasswordHash,
  savePasswordHash,
  isPasswordSetup,
  saveSessionKey,
  loadSessionKey,
  clearSessionKey,
} from '@/lib/crypto'
import { wipeAllData } from '@/lib/storage-reset'

interface AuthStore {
  isLocked: boolean
  encryptionKey: CryptoKey | null

  initialize: () => Promise<void>
  setupMasterPassword: (password: string) => Promise<void>
  unlock: (password: string) => Promise<boolean>
  lock: () => void
  resetMasterPassword: (password: string) => Promise<void>
  isPasswordSet: () => boolean
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  isLocked: true,
  encryptionKey: null,

  /**
   * Initialize auth state on app startup
   * Tries to load session key, otherwise determines if password is set
   */
  initialize: async () => {
    const passwordSet = isPasswordSetup()

    if (!passwordSet) {
      // No password set yet - not locked
      set({ isLocked: false })
      return
    }

    // Try to load existing session key
    const sessionKey = await loadSessionKey()

    if (sessionKey) {
      // Session key found - user is unlocked
      set({
        encryptionKey: sessionKey,
        isLocked: false,
      })
    } else {
      // No session key - user needs to unlock
      set({ isLocked: true })
    }
  },

  /**
   * Set up master password for the first time
   * Generates salt, hashes password, stores both, and derives encryption key
   */
  setupMasterPassword: async (password: string) => {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters')
    }

    // Generate and save salt
    const salt = generateSalt()
    saveSalt(salt)

    // Hash and save password
    const hash = await hashPassword(password, salt)
    savePasswordHash(hash)

    // Derive encryption key
    const key = await deriveKey(password, salt)

    // Save to session storage
    await saveSessionKey(key)

    // Update state - user is now unlocked
    set({
      encryptionKey: key,
      isLocked: false,
    })
  },

  /**
   * Unlock the app with master password
   * Verifies password by comparing hashes, then derives encryption key
   */
  unlock: async (password: string) => {
    const salt = loadSalt()
    const storedHash = loadPasswordHash()

    if (!salt || !storedHash) {
      throw new Error('Master password not set up')
    }

    // Hash provided password
    const hash = await hashPassword(password, salt)

    // Compare hashes
    if (hash !== storedHash) {
      return false // Wrong password
    }

    // Derive encryption key
    const key = await deriveKey(password, salt)

    // Save to session storage
    await saveSessionKey(key)

    // Update state
    set({
      encryptionKey: key,
      isLocked: false,
    })

    return true
  },

  /**
   * Lock the app
   * Clears encryption key from memory and session storage
   */
  lock: () => {
    clearSessionKey()
    set({
      encryptionKey: null,
      isLocked: true,
    })
  },

  /**
   * Reset master password and wipe all data
   * This is a destructive operation - all accounts and addons will be lost
   */
  resetMasterPassword: async (password: string) => {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters')
    }

    // Wipe all data first
    await wipeAllData()

    // Set up new password using existing function
    await get().setupMasterPassword(password)
  },

  /**
   * Check if master password is set up
   */
  isPasswordSet: () => {
    return isPasswordSetup()
  },
}))
