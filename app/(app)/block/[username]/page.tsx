'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/ui/Avatar'
import CountdownTimer from '@/components/ui/CountdownTimer'
import { formatDurationLabel, formatLiftDate, formatLiftDateShort } from '@/lib/utils'
import { Profile } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'duration' | 'mutuals' | 'confirm' | 'success'

const PRESETS = [
  { label: '2h', desc: '2 hours', hours: 2 },
  { label: '6h', desc: '6 hours', hours: 6 },
  { label: '12h', desc: '12 hours', hours: 12 },
  { label: '24h', desc: '1 day', hours: 24 },
  { label: '3d', desc: '3 days', hours: 72 },
  { label: '7d', desc: '1 week', hours: 168 },
  { label: '2wk', desc: '2 weeks', hours: 336 },
  { label: '30d', desc: '30 days', hours: 720 },
]

// ─── Step 1: Duration picker ───────────────────────────────────────────────────

function DurationPicker({ targetUsername, onSelect }: { targetUsername: string; onSelect: (h: number) => void }) {
  const [selected, setSelected] = useState<number | null>(null)
  return (
    <div className="flex flex-col flex-1 animate-slide-up">
      <div className="px-6 pt-10 pb-8">
        <p className="text-dim text-sm mb-2">Stepping away from @{targetUsername}</p>
        <h2 className="text-3xl font-semibold leading-tight" style={{ letterSpacing: '-0.02em' }}>
          How long do<br />you need?
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-2.5 px-6 flex-1">
        {PRESETS.map((p) => {
          const sel = selected === p.hours
          return (
            <button key={p.hours} onClick={() => setSelected(p.hours)}
              className="flex flex-col justify-end p-4 rounded-2xl min-h-[88px] transition-all active:scale-95"
              style={{ background: sel ? '#fff' : '#111', border: `1px solid ${sel ? '#fff' : '#222'}` }}>
              <span className="text-2xl font-semibold leading-none mb-1"
                style={{ color: sel ? '#0a0a0a' : '#fff', letterSpacing: '-0.02em' }}>{p.label}</span>
              <span className="text-xs" style={{ color: sel ? '#666' : '#555' }}>{p.desc}</span>
            </button>
          )
        })}
      </div>
      <div className="px-6 pb-8 pt-6">
        <button onClick={() => selected && onSelect(selected)} disabled={!selected}
          className="w-full py-4 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-30"
          style={{ background: selected ? '#fff' : '#222', color: selected ? '#0a0a0a' : '#555' }}>
          {selected ? 'Continue' : 'Select a duration'}
        </button>
      </div>
    </div>
  )
}

// ─── Step 2: Mutual circle ─────────────────────────────────────────────────────

function MutualCircle({ mutuals, targetUsername, onConfirm, onSkip }:
  { mutuals: Profile[]; targetUsername: string; onConfirm: (ids: string[]) => void; onSkip: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  return (
    <div className="flex flex-col flex-1 animate-slide-right">
      <div className="px-6 pt-10 pb-8">
        <p className="text-dim text-sm mb-2">Optional</p>
        <h2 className="text-3xl font-semibold leading-tight" style={{ letterSpacing: '-0.02em' }}>
          Step away from<br />their circle too?
        </h2>
        <p className="text-dim text-sm mt-3 leading-relaxed">
          These mutual connections will also see your account as unavailable.
        </p>
      </div>
      <div className="flex-1 px-6 overflow-y-auto flex flex-col gap-2">
        {mutuals.length === 0 ? (
          <p className="text-dim text-sm text-center pt-8">No mutual connections to include.</p>
        ) : mutuals.map((person) => {
          const sel = selected.has(person.id)
          return (
            <button key={person.id} onClick={() => toggle(person.id)}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.99]"
              style={{ background: '#111', border: `1px solid ${sel ? '#333' : '#1a1a1a'}` }}>
              <Avatar name={person.display_name ?? person.username} src={person.avatar_url} size={40} />
              <div className="flex-1 text-left">
                <p className="text-white text-sm font-medium">{person.display_name ?? person.username}</p>
                <p className="text-dim text-xs">@{person.username}</p>
              </div>
              <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{ borderColor: sel ? '#fff' : '#333', background: sel ? '#fff' : 'transparent' }}>
                {sel && <div className="w-2 h-2 rounded-full" style={{ background: '#0a0a0a' }} />}
              </div>
            </button>
          )
        })}
      </div>
      <div className="px-6 pb-8 pt-6 flex flex-col gap-2.5">
        {selected.size > 0 && (
          <button onClick={() => onConfirm(Array.from(selected))}
            className="w-full py-4 rounded-2xl font-semibold text-sm"
            style={{ background: '#fff', color: '#0a0a0a' }}>
            Include {selected.size} {selected.size === 1 ? 'person' : 'people'}
          </button>
        )}
        <button onClick={onSkip}
          className="w-full py-4 rounded-2xl font-semibold text-sm"
          style={{ background: selected.size > 0 ? 'transparent' : '#fff',
            color: selected.size > 0 ? '#555' : '#0a0a0a',
            border: selected.size > 0 ? '1px solid #222' : 'none' }}>
          {selected.size > 0 ? 'Skip, just them' : 'Continue'}
        </button>
      </div>
    </div>
  )
}

// ─── Step 3: Confirmation ──────────────────────────────────────────────────────

function BlockConfirmation({ target, durationHours, mutualCount, onConfirm, loading }:
  { target: Profile; durationHours: number; mutualCount: number; onConfirm: () => void; loading: boolean }) {
  const expiresAt = new Date(Date.now() + durationHours * 3_600_000).toISOString()
  return (
    <div className="flex flex-col flex-1 animate-slide-right">
      <div className="flex-1 px-6 pt-10 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <Avatar name={target.display_name ?? target.username} src={target.avatar_url} size={44} />
          <div>
            <p className="text-white font-medium text-sm">{target.display_name ?? target.username}</p>
            <p className="text-dim text-sm">@{target.username}</p>
          </div>
        </div>
        <h2 className="text-3xl font-semibold leading-tight mb-4" style={{ letterSpacing: '-0.02em' }}>
          Stepping into<br />the alley.
        </h2>
        <p className="text-dim text-base leading-relaxed mb-6">
          @{target.username} won't see your account for{' '}
          <span className="text-white font-medium">{formatDurationLabel(durationHours)}</span>.
          {mutualCount > 0 && <> {mutualCount} mutual {mutualCount === 1 ? 'connection' : 'connections'} included.</>}
        </p>
        <div className="px-5 py-4 rounded-2xl mb-6" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
          <p className="text-dim text-xs mb-1 uppercase tracking-widest">Lifts automatically</p>
          <p className="text-white font-medium text-sm">{formatLiftDate(expiresAt)}</p>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-muted text-sm">—</span>
          <p className="text-muted text-sm leading-relaxed">
            This cannot be cancelled early. You chose this duration at your most deliberate. The block holds.
          </p>
        </div>
      </div>
      <div className="px-6 pb-8 pt-6">
        <button onClick={onConfirm} disabled={loading}
          className="w-full py-4 rounded-2xl font-semibold text-base transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background: '#fff', color: '#0a0a0a' }}>
          {loading ? 'Stepping in…' : 'Step in'}
        </button>
      </div>
    </div>
  )
}

// ─── Step 4: Success ───────────────────────────────────────────────────────────

function BlockSuccess({ expiresAt, durationHours, targetUsername }:
  { expiresAt: string; durationHours: number; targetUsername: string }) {
  const router = useRouter()
  return (
    <div className="flex flex-col flex-1 animate-fade-in">
      <div className="flex-1 px-6 pt-10 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-10">
            <div className="w-2 h-2 rounded-full animate-pulse-slow" style={{ background: '#4ade80' }} />
            <span className="text-dim text-sm font-medium">Active</span>
          </div>
          <h2 className="text-3xl font-semibold leading-tight mb-3" style={{ letterSpacing: '-0.02em' }}>
            You're in<br />the alley.
          </h2>
          <p className="text-dim text-sm mb-10">@{targetUsername} sees your account as unavailable.</p>
          <div className="px-5 py-6 rounded-2xl" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
            <p className="text-muted text-xs mb-3 uppercase tracking-widest">Time remaining</p>
            <CountdownTimer expiresAt={expiresAt} size="lg" />
            <p className="text-dim text-xs mt-3">
              Lifts {formatLiftDateShort(expiresAt)} · {formatDurationLabel(durationHours)} total
            </p>
          </div>
        </div>
        <p className="text-muted text-xs text-center leading-relaxed pb-2">
          No action needed when it expires. The block lifts automatically.
        </p>
      </div>
      <div className="px-6 pb-8 pt-4">
        <button onClick={() => router.push('/home')}
          className="w-full py-4 rounded-2xl font-semibold text-sm"
          style={{ background: '#111', color: '#fff', border: '1px solid #222' }}>
          Go home
        </button>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

const STEP_ORDER: Step[] = ['duration', 'mutuals', 'confirm', 'success']

export default function BlockPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>('duration')
  const [target, setTarget] = useState<Profile | null>(null)
  const [mutuals, setMutuals] = useState<Profile[]>([])
  const [durationHours, setDurationHours] = useState<number>(0)
  const [mutualIds, setMutualIds] = useState<string[]>([])
  const [blockResult, setBlockResult] = useState<{ expiresAt: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: targetUser } = await supabase.from('profiles').select('*').eq('username', username).single()
      if (!targetUser) { router.push('/home'); return }
      setTarget(targetUser)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: myFollows }, { data: targetFollowers }] = await Promise.all([
        supabase.from('follows').select('following_id').eq('follower_id', user.id),
        supabase.from('follows').select('follower_id').eq('following_id', targetUser.id),
      ])

      const mySet = new Set(myFollows?.map((f) => f.following_id) ?? [])
      const theirSet = new Set(targetFollowers?.map((f) => f.follower_id) ?? [])
      const mutualIdList = [...mySet].filter((id) => theirSet.has(id) && id !== user.id && id !== targetUser.id)

      if (mutualIdList.length > 0) {
        const { data: mutualProfiles } = await supabase.from('profiles').select('*').in('id', mutualIdList).limit(20)
        setMutuals(mutualProfiles ?? [])
      }

      setLoading(false)
    }
    load()
  }, [username])

  async function handleSubmit() {
    if (!target) return
    setSubmitting(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const expiresAt = new Date(Date.now() + durationHours * 3_600_000).toISOString()

    const { data: block, error: blockError } = await supabase
      .from('temp_blocks')
      .insert({ blocker_id: user.id, blocked_id: target.id, duration_hours: durationHours, expires_at: expiresAt })
      .select().single()

    if (blockError || !block) {
      setError(blockError?.message ?? 'Failed to create block.')
      setSubmitting(false)
      return
    }

    if (mutualIds.length > 0) {
      await supabase.from('block_extensions').insert(
        mutualIds.map((id) => ({ primary_block_id: block.id, extended_to_id: id, expires_at: expiresAt }))
      )
    }

    setBlockResult({ expiresAt })
    setStep('success')
    setSubmitting(false)
  }

  function goBack() {
    const idx = STEP_ORDER.indexOf(step)
    if (idx > 0 && step !== 'success') setStep(STEP_ORDER[idx - 1])
    else router.back()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Avatar name={username} size={48} />
      </div>
    )
  }

  if (!target) return null

  return (
    <div className="min-h-screen bg-bg flex flex-col max-w-md mx-auto">
      {step !== 'success' && (
        <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0"
          style={{ borderBottom: '1px solid #1a1a1a' }}>
          <button onClick={goBack} className="p-2 -ml-2 rounded-xl text-dim active:text-white">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-1.5">
            {(['duration', 'mutuals', 'confirm'] as Step[]).map((s) => (
              <div key={s} className="h-1 rounded-full transition-all" style={{
                width: step === s ? 20 : 6,
                background: step === s ? '#fff'
                  : STEP_ORDER.indexOf(s) < STEP_ORDER.indexOf(step) ? '#444' : '#222',
              }} />
            ))}
          </div>
          <div className="w-10" />
        </div>
      )}

      {error && (
        <div className="mx-6 mt-4 px-4 py-3 rounded-xl" style={{ background: '#1a0000', border: '1px solid #3a0000' }}>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {step === 'duration' && (
        <DurationPicker targetUsername={target.username} onSelect={(h) => {
          setDurationHours(h)
          setStep(mutuals.length > 0 ? 'mutuals' : 'confirm')
        }} />
      )}

      {step === 'mutuals' && (
        <MutualCircle mutuals={mutuals} targetUsername={target.username}
          onConfirm={(ids) => { setMutualIds(ids); setStep('confirm') }}
          onSkip={() => { setMutualIds([]); setStep('confirm') }} />
      )}

      {step === 'confirm' && (
        <BlockConfirmation target={target} durationHours={durationHours}
          mutualCount={mutualIds.length} onConfirm={handleSubmit} loading={submitting} />
      )}

      {step === 'success' && blockResult && (
        <BlockSuccess expiresAt={blockResult.expiresAt}
          durationHours={durationHours} targetUsername={target.username} />
      )}
    </div>
  )
}
