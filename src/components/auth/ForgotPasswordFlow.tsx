import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Lock } from 'lucide-react'

interface ForgotPasswordFlowProps {
  onCancel: () => void
  onComplete: () => void
}

export function ForgotPasswordFlow({ onCancel, onComplete }: ForgotPasswordFlowProps) {
  const [step, setStep] = useState<'warning' | 'reset-password'>('warning')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetMasterPassword = useAuthStore((state) => state.resetMasterPassword)

  const handleReset = async (e: React.FormEvent) => {
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
      await resetMasterPassword(password)
      // Success - app will unlock automatically
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
      setIsSubmitting(false)
    }
  }

  // Step 1: Warning Dialog
  if (step === 'warning') {
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
              <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full opacity-100 transition-opacity" />
              <AlertTriangle className="w-8 h-8 text-red-400 relative z-10" />
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight text-white">
              Reset Master Password
            </CardTitle>
            <CardDescription className="text-slate-400">
              This will permanently delete all your data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert
              variant="destructive"
              className="bg-destructive/10 border-destructive/20 text-destructive-foreground"
            >
              <AlertDescription className="text-sm">
                <strong>Warning:</strong> This action cannot be undone. The following data will be
                permanently deleted:
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-sm text-slate-300 bg-slate-900/50 border border-slate-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>All saved Stremio accounts and credentials</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>Your entire addon library</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>All account-addon configurations</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>Your current master password</span>
              </div>
            </div>

            <Alert className="bg-blue-500/5 border-blue-500/20 text-blue-400">
              <AlertDescription className="text-sm">
                After resetting, you will set a new master password and start with an empty account
                manager.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="destructive"
                className="w-full py-6 text-base font-medium"
                onClick={() => setStep('reset-password')}
              >
                Yes, Reset Data
              </Button>
              <Button
                variant="outline"
                className="w-full py-6 text-base font-medium bg-transparent border-slate-700 hover:bg-slate-800"
                onClick={onCancel}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 2: Password Reset Form
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
            Set New Master Password
          </CardTitle>
          <CardDescription className="text-slate-400">
            Create a new password to secure your account manager
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
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
              <Label htmlFor="confirm-new-password">Confirm New Password</Label>
              <Input
                id="confirm-new-password"
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

            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                className="w-full bg-white text-black hover:bg-slate-200 transition-colors py-6 text-base font-medium"
                disabled={isSubmitting || !password || !confirmPassword}
              >
                {isSubmitting ? 'Resetting...' : 'Set New Password'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full py-6 text-base font-medium bg-transparent border-slate-700 hover:bg-slate-800"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
