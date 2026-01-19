import { StremioAccount } from '@/types/account'
import { create } from 'zustand'

interface UIStore {
  isAddAccountDialogOpen: boolean
  isAddAddonDialogOpen: boolean
  isExportDialogOpen: boolean
  isImportDialogOpen: boolean

  openAddAccountDialog: (account?: StremioAccount) => void
  closeAddAccountDialog: () => void
  openAddAddonDialog: () => void
  closeAddAddonDialog: () => void
  openExportDialog: () => void
  closeExportDialog: () => void
  openImportDialog: () => void
  closeImportDialog: () => void
  editingAccount: StremioAccount | null
}

export const useUIStore = create<UIStore>((set) => ({
  isAddAccountDialogOpen: false,
  isAddAddonDialogOpen: false,
  isExportDialogOpen: false,
  isImportDialogOpen: false,

  editingAccount: null,

  openAddAccountDialog: (account) => set({ isAddAccountDialogOpen: true, editingAccount: account || null }),
  closeAddAccountDialog: () => set({ isAddAccountDialogOpen: false, editingAccount: null }),
  openAddAddonDialog: () => set({ isAddAddonDialogOpen: true }),
  closeAddAddonDialog: () => set({ isAddAddonDialogOpen: false }),
  openExportDialog: () => set({ isExportDialogOpen: true }),
  closeExportDialog: () => set({ isExportDialogOpen: false }),
  openImportDialog: () => set({ isImportDialogOpen: true }),
  closeImportDialog: () => set({ isImportDialogOpen: false }),
}))

