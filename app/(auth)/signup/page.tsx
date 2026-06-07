'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [realname, setRealName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  if (username.length < 3) { setError('Username must be at least 3 characters.'); return }
  setLoading(true)
  setError(null)

  const supabase = createClient()

  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email, password,
    options: { data: { username, display_name: username } },
  })

  if (signupError) { setError(signupError.message); setLoading(false); return }

  let userId: string
  if (signupData.session) {
    await supabase.auth.setSession(signupData.session)
    userId = signupData.session.user.id
  } else {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError || !signInData.session) { setError('Signup succeeded but login failed. Please sign in manually.'); setLoading(false); return }
    userId = signInData.session.user.id
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: userId, username, display_name: username })

  if (profileError) { setError(profileError.message); setLoading(false); return }

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
        <h1 className="text-xl font-semibold text-center mb-2">Create account</h1>
        <p className="text-dim text-sm text-center mb-8">Join alley.social</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#444', fontSize: 14 }}>@</span>
            <input type="text" placeholder="username" value={username} required
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
              style={{ ...inputStyle, paddingLeft: 30 }} />
          </div>
          <input type="text" placeholder="Display name" value={realname} required
            onChange={(e) => setRealName(e.target.value)} style={inputStyle} />
          <input type="email" placeholder="Email" value={email} required
            onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          <div style={{ position: 'relative' }}>
            <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} required minLength={8}
              onChange={(e) => setPassword(e.target.value)} style={{ ...inputStyle, paddingRight: 44 }} />
            <button type="button" onClick={() => setShowPassword(v => !v)}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#444', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && <p className="text-xs text-red-400 px-1">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-2xl font-semibold text-sm disabled:opacity-50 mt-1"
            style={{ background: '#fff', color: '#0a0a0a' }}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="text-center text-dim text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-white underline underline-offset-2">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
