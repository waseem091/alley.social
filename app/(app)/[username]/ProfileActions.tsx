'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import CountdownTimer from '@/components/ui/CountdownTimer'
import { TempBlock } from '@/types'

interface Props {
  profileId: string
  username: string
  isFollowing: boolean
  activeBlock: TempBlock | null
  onFollowChange: (following: boolean) => void
}

export default function ProfileActions({ profileId, username, isFollowing, activeBlock, onFollowChange }: Props) {
  const [following, setFollowing] = useState(isFollowing)
  const [loading, setLoading] = useState(false)

  async function toggleFollow() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const newFollowing = !following
    setFollowing(newFollowing)
    onFollowChange(newFollowing)

    let error
    if (following) {
      ;({ error } = await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profileId))
    } else {
      ;({ error } = await supabase.from('follows').insert({ follower_id: user.id, following_id: profileId }))
    }
    if (error) {
      console.error('follow error', error)
      setFollowing(following)
      onFollowChange(following)
    }
    setLoading(false)
  }

  if (activeBlock) {
    return (
      <div className="flex flex-col items-end gap-1 px-4 py-3 rounded-2xl"
        style={{ background: '#111', border: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#4ade80' }} />
          <span className="text-white text-xs font-medium">In alley</span>
        </div>
        <CountdownTimer expiresAt={activeBlock.expires_at} size="sm" />
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <button onClick={toggleFollow} disabled={loading}
        className="px-4 py-2 rounded-full text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
        style={{ background: following ? 'transparent' : '#fff',
          color: following ? '#fff' : '#0a0a0a',
          border: following ? '1px solid #333' : 'none' }}>
        {loading ? '…' : following ? 'Following' : 'Follow'}
      </button>
      <Link href={`/block/${username}`}
        className="px-4 py-2 rounded-full text-sm font-medium active:scale-95"
        style={{ background: 'transparent', color: '#555', border: '1px solid #222' }}>
        Step away
      </Link>
    </div>
  )
}
