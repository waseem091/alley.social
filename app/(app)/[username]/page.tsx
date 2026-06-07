'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/ui/Avatar'
import ProfileActions from './ProfileActions'
import { formatRelativeTime } from '@/lib/utils'
import { Profile, Post, TempBlock } from '@/types'

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isMe, setIsMe] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [activeBlock, setActiveBlock] = useState<TempBlock | null>(null)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('username', username).single()
      if (!profileData) { setLoading(false); return }

      setProfile(profileData)
      setIsMe(profileData.id === user.id)

      const now = new Date().toISOString()
      const [followRow, followersCount, followingCountData, blockRow, postsData] = await Promise.all([
        supabase.from('follows').select('follower_id')
          .eq('follower_id', user.id).eq('following_id', profileData.id).single(),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profileData.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profileData.id),
        supabase.from('temp_blocks').select('*').eq('blocker_id', user.id)
          .eq('blocked_id', profileData.id).gt('expires_at', now).is('lifted_at', null).single(),
        supabase.from('posts').select('*, author:profiles!author_id(*)')
          .eq('author_id', profileData.id).order('created_at', { ascending: false }).limit(20),
      ])

      setIsFollowing(!!followRow.data)
      setFollowerCount(followersCount.count ?? 0)
      setFollowingCount(followingCountData.count ?? 0)
      setActiveBlock(blockRow.data ?? null)
      if (!blockRow.data || profileData.id === user.id) setPosts(postsData.data ?? [])
      setLoading(false)
    }
    load()
  }, [username])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-16 h-16 rounded-full animate-pulse" style={{ background: '#111' }} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-dim text-sm">User not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="px-5 pt-12 pb-5">
        <div className="flex items-start justify-between mb-5">
          <Avatar name={profile.display_name ?? profile.username} src={profile.avatar_url} size={64} />
          {isMe ? (
            <button
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signOut()
                router.push('/login')
              }}
              className="text-sm px-4 py-1.5 rounded-full border transition-opacity active:opacity-50"
              style={{ borderColor: '#333', color: '#888' }}
            >
              Log out
            </button>
          ) : (
            <ProfileActions
              profileId={profile.id}
              username={profile.username}
              isFollowing={isFollowing}
              activeBlock={activeBlock}
              onFollowChange={setIsFollowing}
            />
          )}
        </div>
        <h1 className="text-white font-semibold text-lg" style={{ letterSpacing: '-0.01em' }}>
          {profile.display_name ?? profile.username}
        </h1>
        <p className="text-dim text-sm">@{profile.username}</p>
        {profile.bio && <p className="text-white text-sm mt-3 leading-relaxed">{profile.bio}</p>}
        <div className="flex gap-5 mt-4">
          <div>
            <span className="text-white text-sm font-semibold">{followerCount}</span>
            <span className="text-dim text-sm ml-1.5">followers</span>
          </div>
          <div>
            <span className="text-white text-sm font-semibold">{followingCount}</span>
            <span className="text-dim text-sm ml-1.5">following</span>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #1a1a1a' }}>
        {activeBlock && !isMe ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-muted text-sm">Posts hidden while block is active.</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-muted text-sm">No posts yet.</p>
          </div>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="px-4 py-4 flex gap-3" style={{ borderBottom: '1px solid #1a1a1a' }}>
              <Avatar name={profile.display_name ?? profile.username} src={profile.avatar_url} size={38} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-white text-sm font-semibold">{profile.display_name ?? profile.username}</span>
                  <span className="text-muted text-xs">@{profile.username}</span>
                  <span className="text-muted text-xs ml-auto">{formatRelativeTime(post.created_at)}</span>
                </div>
                <p className="text-white text-sm leading-relaxed break-words">{post.content}</p>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
