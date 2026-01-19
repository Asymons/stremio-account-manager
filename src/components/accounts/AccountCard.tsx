import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAccounts } from '@/hooks/useAccounts'
import { useUIStore } from '@/store/uiStore'
import { StremioAccount } from '@/types/account'
import { MoreVertical, Pencil, RefreshCw, Trash } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface AccountCardProps {
  account: StremioAccount
  isSelected?: boolean
  onToggleSelect?: (accountId: string) => void
}

export function AccountCard({
  account,
  isSelected = false,
  onToggleSelect,
}: AccountCardProps) {
  const navigate = useNavigate()
  const { removeAccount, syncAccount, loading } = useAccounts()
  const openAddAccountDialog = useUIStore((state) => state.openAddAccountDialog)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    try {
      await removeAccount(account.id)
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Failed to remove account:', error)
    }
  }

  const handleSync = async () => {
    try {
      await syncAccount(account.id)
    } catch (error) {
      // Error is already stored in the store
      console.error('Sync failed:', error)
    }
  }

  const handleEdit = () => {
    openAddAccountDialog(account)
  }

  const statusColor = account.status === 'active' ? 'bg-green-500' : 'bg-red-500'
  const lastSyncText = new Date(account.lastSync).toLocaleString()

  return (
    <Card
      className={`hover:shadow-lg transition-shadow ${isSelected ? 'ring-2 ring-primary' : ''
        }`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {onToggleSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(account.id)}
                className="h-4 w-4"
              />
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold truncate tracking-tight">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor}`} />
                <span className="truncate flex-1">{account.name}</span>
              </CardTitle>
              {account.email && account.email !== account.name && (
                <p className="text-sm text-muted-foreground mt-1 truncate">{account.email}</p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSync} disabled={loading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Sync
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">Addons:</span>
            <span className="font-medium">{account.addons.length}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">Last Sync:</span>
            <span className="text-sm">{lastSyncText}</span>
          </div>
          {account.status === 'error' && (
            <div className="text-sm text-destructive">
              Sync failed - check credentials
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/account/${account.id}`)}
          className="w-full"
        >
          View Addons
        </Button>
      </CardFooter>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Remove Account?"
        description={`Are you sure you want to remove "${account.name}"?`}
        confirmText="Remove"
        isDestructive={true}
        isLoading={loading}
        onConfirm={handleConfirmDelete}
      />
    </Card>
  )
}

