import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAccounts } from '@/hooks/useAccounts'
import { decrypt } from '@/lib/encryption'
import { useUIStore } from '@/store/uiStore'
import { useEffect, useState } from 'react'

export function AccountForm() {
  const isOpen = useUIStore((state) => state.isAddAccountDialogOpen)
  const closeDialog = useUIStore((state) => state.closeAddAccountDialog)
  const editingAccount = useUIStore((state) => state.editingAccount)
  const { addAccountByAuthKey, addAccountByCredentials, updateAccount, loading } = useAccounts()

  const [mode, setMode] = useState<'authKey' | 'credentials'>('authKey')
  const [authKey, setAuthKey] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (editingAccount) {
      if (editingAccount.email) {
        setMode('credentials')
        setEmail(editingAccount.email)
        // We can't decrypt the password to show it, but we can set a placeholder or just leave it blank
        // For simplicity in update, we leave it blank. If they enter content, we update it.
        setPassword('')
      } else {
        setMode('authKey')
        // Same for authKey, it's safer not to show decrypted key if possible, 
        // or decrypt it if we want to show it.
        try {
          setAuthKey(decrypt(editingAccount.authKey))
        } catch {
          setAuthKey('')
        }
      }
    } else {
      // Reset defaults for add mode
      setMode('authKey')
      setAuthKey('')
      setEmail('')
      setPassword('')
      setError('')
    }
  }, [editingAccount, isOpen])

  const handleClose = () => {
    closeDialog()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      if (editingAccount) {
        // Update mode
        await updateAccount(editingAccount.id, {
          name: name.trim(),
          // Only pass auth details if they are provided/changed
          authKey: mode === 'authKey' && authKey !== decrypt(editingAccount.authKey) ? authKey.trim() : undefined,
          email: mode === 'credentials' && email !== editingAccount.email ? email.trim() : undefined,
          password: mode === 'credentials' && password ? password : undefined
        })
      } else {
        // Add mode
        if (mode === 'authKey') {
          if (!authKey.trim()) {
            setError('Auth key is required')
            return
          }
          await addAccountByAuthKey(authKey.trim(), name.trim() || 'My Account')
        } else {
          if (!email.trim() || !password.trim()) {
            setError('Email and password are required')
            return
          }
          await addAccountByCredentials(email.trim(), password, name.trim() || email.trim())
        }
      }
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${editingAccount ? 'update' : 'add'} account`)
    }
  }

  const isEditing = !!editingAccount

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Account' : 'Add Stremio Account'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update account details. Leave credentials blank to keep them unchanged.'
              : 'Add an account using either your auth key or email and password'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 border-b pb-2">
            <Button
              type="button"
              variant={mode === 'authKey' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('authKey')}
            >
              Auth Key
            </Button>
            <Button
              type="button"
              variant={mode === 'credentials' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('credentials')}
            >
              Email & Password
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Account Name (optional)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Account"
            />
          </div>

          {mode === 'authKey' ? (
            <div className="space-y-2">
              <Label htmlFor="authKey">Auth Key</Label>
              <Input
                id="authKey"
                type="password"
                value={authKey}
                onChange={(e) => setAuthKey(e.target.value)}
                placeholder={isEditing ? "Leave blank to keep unchanged" : "Enter your Stremio auth key"}
                required={!isEditing}
              />
              <p className="text-xs text-muted-foreground">
                Find your auth key in Stremio settings
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEditing ? "Leave blank to keep unchanged" : "Enter your password"}
                  required={!isEditing}
                />
              </div>
            </>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Account' : 'Add Account')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
