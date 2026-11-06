import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { ThemeToggle } from '../../components/theme/theme-toggle'
import { useState } from 'react'

export function SignInPage() {
  const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  const isClerkConfigured = clerkPublishableKey && !clerkPublishableKey.startsWith('pk_test_placeholder')
  
  // Always call useAuth() - it handles missing provider internally
  const { isSignedIn: clerkIsSignedIn } = useAuth()
  const isSignedIn = isClerkConfigured ? clerkIsSignedIn : false

  const navigate = useNavigate()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')

  if (isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
              <ShieldCheck className="h-6 w-6" strokeWidth={2} />
            </div>
            <h2 className="text-xl font-bold text-ink mb-2">Authenticated</h2>
            <p className="text-ink-muted mb-6">You are signed in to your Proofline workspace.</p>
            <Button onClick={() => navigate('/overview')} className="w-full">
              Enter Dashboard &rarr;
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-canvas to-surface-muted flex flex-col items-center justify-center p-4">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      {/* Brand Header */}
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-white shadow-md">
          <ShieldCheck className="h-7 w-7" strokeWidth={2.2} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Proofline Security</h1>
        <p className="text-sm text-ink-muted">Developer-first SOC 2 compliance & readiness</p>
      </div>

      {/* Clerk Auth Card */}
      <div className="w-full max-w-md flex flex-col items-center">
        {isClerkConfigured ? (
          mode === 'sign-in' ? (
            <div className="w-full flex flex-col items-center">
              <SignIn 
                routing="hash"
                afterSignInUrl="/overview"
                signUpUrl="#sign-up"
              />
              <button 
                onClick={() => setMode('sign-up')} 
                className="mt-4 text-xs text-ink-muted hover:text-accent transition-colors"
              >
                Don't have an account? <span className="font-semibold underline">Sign up</span>
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              <SignUp 
                routing="hash"
                afterSignUpUrl="/overview"
                signInUrl="#sign-in"
              />
              <button 
                onClick={() => setMode('sign-in')} 
                className="mt-4 text-xs text-ink-muted hover:text-accent transition-colors"
              >
                Already have an account? <span className="font-semibold underline">Sign in</span>
              </button>
            </div>
          )
        ) : (
          <Card className="w-full">
            <CardContent className="pt-6 text-center space-y-4">
              <p className="text-sm text-ink-muted">Clerk keys not configured. Click below to enter local dev mode.</p>
              <Button onClick={() => navigate('/overview')} className="w-full">
                Enter Local Demo Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/')} 
          className="mt-6 text-ink-faint hover:text-ink text-xs"
        >
          &larr; Back to Landing Page
        </Button>
      </div>
    </div>
  )
}