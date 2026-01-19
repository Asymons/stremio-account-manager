import { useCallback, useState } from 'react'

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

// Simple toast state management - in a real app you'd use a more robust solution
let toastListeners: ((toasts: Toast[]) => void)[] = []
let toasts: Toast[] = []

const notifyListeners = () => {
  toastListeners.forEach((listener) => listener([...toasts]))
}

export function useToast() {
  const [, setLocalToasts] = useState<Toast[]>([])

  // Subscribe to global toast state
  useState(() => {
    const listener = (newToasts: Toast[]) => setLocalToasts(newToasts)
    toastListeners.push(listener)
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener)
    }
  })

  const toast = useCallback(({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID()
    const newToast: Toast = { id, title, description, variant }
    
    toasts = [...toasts, newToast]
    notifyListeners()

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id)
      notifyListeners()
    }, 5000)

    // Also log to console for debugging since we don't have a toast UI yet
    const prefix = variant === 'destructive' ? '❌' : '✅'
    console.log(`${prefix} ${title}${description ? `: ${description}` : ''}`)

    return id
  }, [])

  const dismiss = useCallback((toastId: string) => {
    toasts = toasts.filter((t) => t.id !== toastId)
    notifyListeners()
  }, [])

  return {
    toast,
    dismiss,
    toasts,
  }
}
