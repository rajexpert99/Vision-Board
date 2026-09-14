'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isDisposableEmail } from '@/lib/email-validator'

type AuthMode = 'signin' | 'signup' | 'forgot'

function formatAuthError(errorMsg: string, isSignIn: boolean): string {
  const msg = errorMsg.toLowerCase()

  if (msg.includes('user not found') || msg.includes('no user')) {
    return 'User not registered, please sign up'
  }

  if (msg.includes('email not confirmed')) {
    return 'Email is not confirmed yet. Please check your inbox for the confirmation link.'
  }

  if (msg.includes('user already registered') || msg.includes('already exists')) {
    return 'An account with this email already exists. Please sign in instead.'
  }

  if (msg.includes('over_email_send_rate_limit') || msg.includes('rate limit')) {
    return 'Email rate limit reached. Please wait a few moments before requesting another link.'
  }

  if (msg.includes('password should be at least')) {
    return 'Password must be at least 6 characters long.'
  }

  if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('network')) {
    return 'Network connection error. Please check your internet connection and try again.'
  }

  return errorMsg
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState<AuthMode>('signin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const cleanEmail = email.trim().toLowerCase()

    try {
      // Check for disposable / temporary email providers during signup or reset
      if (mode === 'signup' || mode === 'forgot') {
        if (isDisposableEmail(cleanEmail)) {
          setError('Temporary or disposable email addresses are not permitted. Please use a permanent email address.')
          setLoading(false)
          return
        }
      }

      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (signUpError) {
          setError(formatAuthError(signUpError.message, false))
        } else {
          setSuccess('Account created! Please check your email for a confirmation link.')
        }
      } else if (mode === 'signin') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })
        if (signInError) {
          const msg = signInError.message.toLowerCase()
          if (msg.includes('invalid login credentials') || msg.includes('invalid_grant')) {
            try {
              // Probe if user exists using shouldCreateUser: false
              const { error: probeError } = await supabase.auth.signInWithOtp({
                email: cleanEmail,
                options: { shouldCreateUser: false },
              })

              if (
                probeError &&
                (probeError.message.toLowerCase().includes('signups not allowed') ||
                 probeError.message.toLowerCase().includes('user not found') ||
                 probeError.message.toLowerCase().includes('not found') ||
                 probeError.status === 400 ||
                 probeError.status === 422)
              ) {
                setError('User not registered, please sign up')
              } else {
                setError('Wrong password')
              }
            } catch {
              setError('Wrong password')
            }
          } else if (msg.includes('user not found')) {
            setError('User not registered, please sign up')
          } else if (msg.includes('email not confirmed')) {
            setError('Email is not confirmed yet. Please check your inbox for the confirmation link.')
          } else {
            setError(formatAuthError(signInError.message, true))
          }
        } else {
          window.location.href = '/'
        }
      } else if (mode === 'forgot') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        })
        if (resetError) {
          setError(formatAuthError(resetError.message, false))
        } else {
          setSuccess('Password reset link sent! Check your email inbox to create a new password.')
        }
      }
    } catch (err: any) {
      const errMsg = err?.message || ''
      if (errMsg.toLowerCase().includes('failed to fetch') || errMsg.toLowerCase().includes('network')) {
        setError('Network connection error. Please check your internet connection and try again.')
      } else {
        setError(errMsg || 'An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleMagicLink() {
    if (!email) {
      setError('Please enter your email address first.')
      return
    }
    const cleanEmail = email.trim().toLowerCase()
    if (isDisposableEmail(cleanEmail)) {
      setError('Temporary or disposable email addresses are not permitted.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (otpError) {
        setError(formatAuthError(otpError.message, false))
      } else {
        setSuccess('Check your email for a magic sign-in link.')
      }
    } catch (err: any) {
      const errMsg = err?.message || ''
      if (errMsg.toLowerCase().includes('failed to fetch') || errMsg.toLowerCase().includes('network')) {
        setError('Network connection error. Please check your internet connection and try again.')
      } else {
        setError(errMsg || 'An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Board</h1>
        <p>
          {mode === 'forgot'
            ? 'Reset your password securely via email.'
            : 'Your personal infinite canvas for collecting ideas.'}
        </p>

        {error && <div className="login-error">{error}</div>}
        {success && <div className="login-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          {mode !== 'forgot' && (
            <div className="login-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password">Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot')
                      setError(null)
                      setSuccess(null)
                    }}
                    className="forgot-password-link"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading
              ? '...'
              : mode === 'signup'
              ? 'Create Account'
              : mode === 'forgot'
              ? 'Send Reset Link'
              : 'Sign In'}
          </button>
        </form>

        {mode !== 'forgot' && (
          <>
            <div className="login-divider">or</div>

            <button
              type="button"
              onClick={handleMagicLink}
              className="login-btn"
              disabled={loading}
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
            >
              Send Magic Link
            </button>
          </>
        )}

        <div className="login-toggle">
          {mode === 'forgot' ? (
            <button
              type="button"
              onClick={() => {
                setMode('signin')
                setError(null)
                setSuccess(null)
              }}
            >
              ← Back to Sign in
            </button>
          ) : mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin')
                  setError(null)
                  setSuccess(null)
                }}
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup')
                  setError(null)
                  setSuccess(null)
                }}
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
