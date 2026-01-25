import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAccounts } from '@/hooks/useAccounts'
import { useUIStore } from '@/store/uiStore'
import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { AccountCard } from './AccountCard'
import { BulkActionsDialog } from './BulkActionsDialog'

export function AccountList() {
  const openAddAccountDialog = useUIStore((state) => state.openAddAccountDialog)
  const { accounts, error, clearError, syncAllAccounts, loading } = useAccounts()
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)

  const toggleAccountSelection = (accountId: string) => {
    setSelectedAccountIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(accountId)) {
        newSet.delete(accountId)
      } else {
        newSet.add(accountId)
      }
      return newSet
    })
  }

  const selectAll = () => {
    setSelectedAccountIds(new Set(accounts.map((a) => a.id)))
  }

  const clearSelection = () => {
    setSelectedAccountIds(new Set())
  }

  const selectedAccounts = accounts.filter((a) => selectedAccountIds.has(a.id))

  if (accounts.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-muted-foreground mb-2">No accounts yet</h2>
        <p className="text-muted-foreground mb-4">Click "Add Account" to get started</p>
        <Button onClick={() => openAddAccountDialog()}>Add Account</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md flex items-center justify-between">
          <span>{error}</span>
          <button onClick={clearError} className="text-destructive hover:text-destructive/80">
            ✕
          </button>
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-card border rounded-md p-3 gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <span className="text-sm font-medium whitespace-nowrap text-foreground">
            {selectedAccountIds.size} of {accounts.length} selected
          </span>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={selectAll} className="flex-1 sm:flex-none">
              Select All
            </Button>
            {selectedAccountIds.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                className="flex-1 sm:flex-none"
              >
                Clear Selection
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {selectedAccountIds.size > 0 && (
            <Button
              size="sm"
              onClick={() => setShowBulkActions(true)}
              className="flex-1 sm:flex-none"
            >
              Bulk Actions
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={syncAllAccounts}
            disabled={loading || accounts.length === 0}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sync All
          </Button>
          <Button size="sm" onClick={() => openAddAccountDialog()} className="flex-1 sm:flex-none">
            Add Account
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            isSelected={selectedAccountIds.has(account.id)}
            onToggleSelect={toggleAccountSelection}
          />
        ))}
      </div>

      {/* Bulk Actions Dialog */}
      <Dialog open={showBulkActions} onOpenChange={setShowBulkActions}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Actions</DialogTitle>
          </DialogHeader>
          <BulkActionsDialog
            selectedAccounts={selectedAccounts}
            onClose={() => {
              setShowBulkActions(false)
              clearSelection()
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
