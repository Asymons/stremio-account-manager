import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock } from 'lucide-react'

export function MasterPasswordSetup() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const setupMasterPassword = useAuthStore((state) => state.setupMasterPassword)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      setIsSubmitting(true)
      await setupMasterPassword(password)
      // Success - store will update state and app will continue
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set up password')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#000212] p-4 relative overflow-hidden">
      {/* Linear-style radial background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% -20%, #20243d 0%, #000212 80%)',
        }}
      />

      <Card className="w-full max-w-md relative z-10 border border-white/[0.08] bg-[#080b1a]/90 backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] animate-slide-up">
        {/* Subtle top highlight line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-6 w-16 h-16 bg-[#0c1026] border border-white/[0.05] rounded-2xl flex items-center justify-center shadow-inner relative group">
            <div className="absolute inset-0 bg-blue-500/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <Lock className="w-8 h-8 text-slate-300 relative z-10" />
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight text-white">
            Set Master Password
          </CardTitle>
          <CardDescription className="text-slate-400">
            Create a password to encrypt your Stremio credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (8+ characters)"
                className="bg-slate-900/50 border-slate-800 focus:ring-primary/20"
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="bg-slate-900/50 border-slate-800 focus:ring-primary/20"
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <Alert
                variant="destructive"
                className="bg-destructive/10 border-destructive/20 text-destructive-foreground"
              >
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Alert className="bg-blue-500/5 border-blue-500/20 text-blue-400">
              <AlertDescription className="text-sm">
                <strong>Important:</strong> This password encrypts your credentials. If you lose it,
                you will lose access to all stored accounts.
              </AlertDescription>
            </Alert>

            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-slate-200 transition-colors py-6 text-base font-medium"
              disabled={isSubmitting || !password || !confirmPassword}
            >
              {isSubmitting ? 'Setting up...' : 'Set Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
