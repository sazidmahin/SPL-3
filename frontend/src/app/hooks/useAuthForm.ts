import { useState } from 'react'
import type { FormEvent } from 'react'
import { authenticate } from '../../domains/auth/api'
import type { AuthMode, AuthSession } from '../../domains/auth/types'
import { errorMessage } from '../support/errors'

type UseAuthFormOptions = {
  onAuthenticated: (session: AuthSession) => Promise<void>
  setError: (message: string | null) => void
}

export function useAuthForm({ onAuthenticated, setError }: UseAuthFormOptions) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const payload: Record<string, string> =
      mode === 'register' ? { email, password, full_name: fullName } : { email, password }

    try {
      const nextSession = await authenticate(mode, payload)
      setPassword('')
      await onAuthenticated(nextSession)
    } catch (caught) {
      setError(errorMessage(caught, 'Authentication failed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    mode,
    email,
    password,
    fullName,
    isSubmitting,
    setMode,
    setEmail,
    setPassword,
    setFullName,
    submitAuth,
    clearPassword: () => setPassword(''),
  }
}
