import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock } from 'lucide-react'
import { ForgotPasswordFlow } from './ForgotPasswordFlow'

export function UnlockDialog() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  const unlock = useAuthStore((state) => state.unlock)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!password) {
      setError('Please enter your password')
      return
    }

    try {
      setIsSubmitting(true)
      const success = await unlock(password)

      if (!success) {
        setError('Incorrect password')
        setPassword('')
        setIsSubmitting(false)
      }
      // If success, isLocked becomes false and dialog disappears
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock')
      setIsSubmitting(false)
    }
  }

  // Show forgot password flow if requested
  if (showForgotPassword) {
    return (
      <ForgotPasswordFlow
        onCancel={() => setShowForgotPassword(false)}
        onComplete={() => {
          setShowForgotPassword(false)
          // Reset will unlock automatically
        }}
      />
    )
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
            Unlock Stremio Account Manager
          </CardTitle>
          <CardDescription className="text-slate-400">
            Enter your master password to access your accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Master Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your master password"
                className="bg-slate-900/50 border-slate-800 focus:ring-primary/20"
                disabled={isSubmitting}
                autoFocus
              />
              <div className="flex justify-end">
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground -mt-1 px-0"
                  onClick={() => setShowForgotPassword(true)}
                  type="button"
                >
                  Forgot Password?
                </Button>
              </div>
            </div>

            {error && (
              <Alert
                variant="destructive"
                className="bg-destructive/10 border-destructive/20 text-destructive-foreground"
              >
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-slate-200 transition-colors py-6 text-base font-medium"
              disabled={isSubmitting || !password}
            >
              {isSubmitting ? 'Unlocking...' : 'Unlock'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
