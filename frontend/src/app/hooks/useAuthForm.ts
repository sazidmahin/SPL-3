import { useState } from 'react'
import type { FormEvent } from 'react'
import { login, register, verifyEmail } from '../../domains/auth/api'
import type { AuthMode, AuthSession } from '../../domains/auth/types'
import { errorMessage } from '../support/errors'

type UseAuthFormOptions = {
  onAuthenticated: (session: AuthSession) => Promise<void>
  onRegistered: (verificationCode: string | null) => void
  setError: (message: string | null) => void
}

export function useAuthForm({ onAuthenticated, onRegistered, setError }: UseAuthFormOptions) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (mode === 'register') {
        const result = await register({ email, password, full_name: fullName })
        setPassword('')
        setVerificationCode(result.verification_code ?? '')
        onRegistered(result.verification_code)
        return
      }

      const nextSession = await login({ email, password })
      setPassword('')
      await onAuthenticated(nextSession)
    } catch (caught) {
      setError(errorMessage(caught, 'Authentication failed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function submitVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const nextSession = await verifyEmail({ email, code: verificationCode })
      setPassword('')
      setVerificationCode('')
      await onAuthenticated(nextSession)
    } catch (caught) {
      setError(errorMessage(caught, 'Verification failed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    mode,
    email,
    password,
    fullName,
    verificationCode,
    isSubmitting,
    setMode,
    setEmail,
    setPassword,
    setFullName,
    setVerificationCode,
    submitAuth,
    submitVerification,
    clearPassword: () => setPassword(''),
  }
}
