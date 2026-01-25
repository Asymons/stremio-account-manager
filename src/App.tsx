import { AccountForm } from '@/components/accounts/AccountForm'
import { AddonInstaller } from '@/components/addons/AddonInstaller'
import { MasterPasswordSetup } from '@/components/auth/MasterPasswordSetup'
import { UnlockDialog } from '@/components/auth/UnlockDialog'
import { ExportDialog } from '@/components/ExportDialog'
import { ImportDialog } from '@/components/ImportDialog'
import { Layout } from '@/components/layout/Layout'
import { Toaster } from '@/components/ui/toaster'
import { AppRoutes } from '@/routes'
import { useAccountStore } from '@/store/accountStore'
import { useAddonStore } from '@/store/addonStore'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useEffect, useState } from 'react'

function App() {
  const initializeAccounts = useAccountStore((state) => state.initialize)
  const initializeAddons = useAddonStore((state) => state.initialize)
  const initializeAuth = useAuthStore((state) => state.initialize)
  const initializeUI = useUIStore((state) => state.initialize)
  const isLocked = useAuthStore((state) => state.isLocked)
  const isPasswordSet = useAuthStore((state) => state.isPasswordSet())
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    initializeUI()
    initializeAuth()
    Promise.all([initializeAccounts(), initializeAddons()]).finally(() => setIsInitialized(true))
  }, [initializeAccounts, initializeAddons, initializeAuth, initializeUI])

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Initializing Stremio Account Manager</p>
        </div>
      </div>
    )
  }

  if (!isPasswordSet) {
    return <MasterPasswordSetup />
  }

  if (isLocked) {
    return <UnlockDialog />
  }

  return (
    <Layout>
      <AppRoutes />

      <AccountForm />
      <AddonInstaller />
      <ExportDialog />
      <ImportDialog />
      <Toaster />
    </Layout>
  )
}

export default App
