'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/ui/Avatar'
import CountdownTimer from '@/components/ui/CountdownTimer'
import { formatLiftDateShort } from '@/lib/utils'
import { TempBlock } from '@/types'

function ActiveBlockCard({ block, onExpire }: { block: TempBlock; onExpire: (id: string) => void }) {
  const user = block.blocked_user
  if (!user) return null
  return (
    <div className="px-4 py-4 rounded-2xl flex items-center gap-3"
      style={{ background: '#111', border: '1px solid #1a1a1a' }}>
      <div className="relative">
        <Avatar name={user.display_name ?? user.username} src={user.avatar_url} size={44} />
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
          style={{ background: '#4ade80', borderColor: '#111' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{user.display_name ?? user.username}</p>
        <p className="text-dim text-xs">@{user.username}</p>
        {block.extensions && block.extensions.length > 0 && (
          <p className="text-muted text-xs mt-0.5">
            +{block.extensions.length} mutual{block.extensions.length > 1 ? 's' : ''}
          </p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <CountdownTimer expiresAt={block.expires_at} size="sm" onExpire={() => onExpire(block.id)} />
        <p className="text-muted text-[10px] mt-1">lifts {formatLiftDateShort(block.expires_at)}</p>
      </div>
    </div>
  )
}

export default function BlocksPage() {
  const [blocks, setBlocks] = useState<TempBlock[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('temp_blocks')
        .select('*, blocked_user:profiles!blocked_id(*), extensions:block_extensions(*)')
        .eq('blocker_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .is('lifted_at', null)
        .order('created_at', { ascending: false })
      setBlocks(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-bg">
      <div className="px-6 pt-12 pb-6">
        <h1 className="text-2xl font-semibold" style={{ letterSpacing: '-0.02em' }}>Your alleys</h1>
        <p className="text-dim text-sm mt-1">
          {blocks.length > 0 ? `${blocks.length} active ${blocks.length === 1 ? 'block' : 'blocks'}` : 'No active blocks'}
        </p>
      </div>

      <div className="px-4 flex flex-col gap-2.5">
        {loading ? (
          <>
            <div className="h-[76px] rounded-2xl animate-pulse" style={{ background: '#111' }} />
            <div className="h-[76px] rounded-2xl animate-pulse" style={{ background: '#111', opacity: 0.6 }} />
          </>
        ) : blocks.length === 0 ? (
          <div className="flex flex-col items-center pt-24 text-center">
            <p className="text-white font-semibold mb-2">Clear path</p>
            <p className="text-dim text-sm max-w-[240px]">You're fully connected. No active breaks right now.</p>
          </div>
        ) : (
          blocks.map((block) => (
            <ActiveBlockCard key={block.id} block={block}
              onExpire={(id) => setBlocks((prev) => prev.filter((b) => b.id !== id))} />
          ))
        )}
      </div>

      {!loading && blocks.length > 0 && (
        <p className="text-center text-muted text-xs mt-10 px-8">Blocks lift automatically. No action needed.</p>
      )}
    </div>
  )
}
