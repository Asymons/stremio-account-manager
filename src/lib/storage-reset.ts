import localforage from 'localforage'
import { STORAGE_KEYS } from '@/types/saved-addon'

/**
 * Wipes all application data from IndexedDB, localStorage, and sessionStorage
 * Used during master password reset
 */
export async function wipeAllData(): Promise<void> {
  // Wipe IndexedDB via LocalForage (best effort)
  try {
    await localforage.removeItem(STORAGE_KEYS.ACCOUNTS)
  } catch (err) {
    console.error('Failed to clear accounts from IndexedDB:', err)
  }

  try {
    await localforage.removeItem(STORAGE_KEYS.ADDON_LIBRARY)
  } catch (err) {
    console.error('Failed to clear addon library from IndexedDB:', err)
  }

  try {
    await localforage.removeItem(STORAGE_KEYS.ACCOUNT_ADDONS)
  } catch (err) {
    console.error('Failed to clear account addons from IndexedDB:', err)
  }

  // Wipe localStorage auth data
  try {
    localStorage.removeItem('stremio-manager:user-salt')
    localStorage.removeItem('stremio-manager:password-hash')
  } catch (err) {
    console.error('Failed to clear localStorage:', err)
  }

  // Wipe sessionStorage
  try {
    sessionStorage.removeItem('stremio-manager:session-key')
  } catch (err) {
    console.error('Failed to clear sessionStorage:', err)
  }
}
