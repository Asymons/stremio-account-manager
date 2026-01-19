import { AccountForm } from '@/components/accounts/AccountForm'
import { AddonInstaller } from '@/components/addons/AddonInstaller'
import { ExportDialog } from '@/components/ExportDialog'
import { ImportDialog } from '@/components/ImportDialog'
import { Layout } from '@/components/layout/Layout'
import { AppRoutes } from '@/routes'
import { useAccountStore } from '@/store/accountStore'
import { useAddonStore } from '@/store/addonStore'
import { useEffect, useState } from 'react'

function App() {
  const initializeAccounts = useAccountStore((state) => state.initialize)
  const initializeAddons = useAddonStore((state) => state.initialize)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    Promise.all([initializeAccounts(), initializeAddons()]).finally(() =>
      setIsInitialized(true)
    )
  }, [initializeAccounts, initializeAddons])

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

  return (
    <Layout>
      <AppRoutes />

      <AccountForm />
      <AddonInstaller />
      <ExportDialog />
      <ImportDialog />
    </Layout>
  )
}

export default App

