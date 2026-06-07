'use client'

import { useState, useEffect } from 'react'
import { getTimeRemaining, pad } from '@/lib/utils'

export default function CountdownTimer({
  expiresAt, onExpire, size = 'md',
}: { expiresAt: string; onExpire?: () => void; size?: 'sm' | 'md' | 'lg' }) {
  const [time, setTime] = useState(getTimeRemaining(expiresAt))

  useEffect(() => {
    if (time.expired) { onExpire?.(); return }
    const id = setInterval(() => {
      const t = getTimeRemaining(expiresAt)
      setTime(t)
      if (t.expired) { clearInterval(id); onExpire?.() }
    }, 1000)
    return () => clearInterval(id)
  }, [expiresAt, onExpire, time.expired])

  const fs = { sm: 13, md: 18, lg: 28 }[size]

  if (time.expired) return <span className="font-mono text-muted" style={{ fontSize: fs }}>Expired</span>

  if (time.days > 0) return (
    <span className="font-mono text-white tabular-nums" style={{ fontSize: fs, letterSpacing: '0.02em' }}>
      {time.days}d {pad(time.hours)}h {pad(time.minutes)}m
    </span>
  )

  if (time.hours > 0) return (
    <span className="font-mono text-white tabular-nums" style={{ fontSize: fs, letterSpacing: '0.02em' }}>
      {pad(time.hours)}h {pad(time.minutes)}m {pad(time.seconds)}s
    </span>
  )

  return (
    <span className="font-mono tabular-nums" style={{ fontSize: fs, color: '#f59e0b', letterSpacing: '0.02em' }}>
      {pad(time.minutes)}m {pad(time.seconds)}s
    </span>
  )
}
