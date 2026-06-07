'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await createClient().auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/home')
    router.refresh()
  }

  const inputStyle = {
    background: '#111', border: '1px solid #222', borderRadius: 12,
    padding: '14px 16px', fontSize: 14, color: '#fff', width: '100%', outline: 'none',
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-in">
        <Link href="/" className="block text-center mb-12">
          <span className="text-2xl font-display font-medium" style={{ letterSpacing: '-0.03em' }}>a<em>ll</em>ey</span>
        </Link>
        <h1 className="text-xl font-semibold text-center mb-2">Welcome back</h1>
        <p className="text-dim text-sm text-center mb-8">Sign in to your account</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input type="email" placeholder="Email" value={email} required
            onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          <input type="password" placeholder="Password" value={password} required
            onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
          {error && <p className="text-xs text-red-400 px-1">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-2xl font-semibold text-sm disabled:opacity-50 mt-1"
            style={{ background: '#fff', color: '#0a0a0a' }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="text-center text-dim text-sm mt-6">
          No account?{' '}
          <Link href="/signup" className="text-white underline underline-offset-2">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
