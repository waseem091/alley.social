'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/ui/Avatar'
import ProfileActions from './ProfileActions'
import { formatRelativeTime } from '@/lib/utils'
import { Profile, Post, TempBlock } from '@/types'

type ModalUser = Profile & { followedByMe: boolean }

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
  const [modal, setModal] = useState<'followers' | 'following' | null>(null)
  const [modalUsers, setModalUsers] = useState<ModalUser[]>([])
  const [modalLoading, setModalLoading] = useState(false)

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

  async function openModal(type: 'followers' | 'following') {
    if (!profile) return
    setModal(type)
    setModalUsers([])
    setModalLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setModalLoading(false); return }

    const idCol = type === 'followers' ? 'follower_id' : 'following_id'
    const filterCol = type === 'followers' ? 'following_id' : 'follower_id'
    const { data: rows } = await supabase.from('follows').select(idCol).eq(filterCol, profile.id)
    const ids = (rows ?? []).map((r: Record<string, string>) => r[idCol])

    if (ids.length === 0) { setModalLoading(false); return }

    const [{ data: profiles }, { data: myFollows }] = await Promise.all([
      supabase.from('profiles').select('*').in('id', ids),
      supabase.from('follows').select('following_id').eq('follower_id', user.id).in('following_id', ids),
    ])
    const followedSet = new Set((myFollows ?? []).map((r: { following_id: string }) => r.following_id))
    setModalUsers((profiles ?? []).map((p: Profile) => ({ ...p, followedByMe: followedSet.has(p.id) })))
    setModalLoading(false)
  }

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
              onFollowChange={(following) => {
                setIsFollowing(following)
                setFollowerCount(c => following ? c + 1 : c - 1)
              }}
            />
          )}
        </div>
        <h1 className="text-white font-semibold text-lg" style={{ letterSpacing: '-0.01em' }}>
          {profile.display_name ?? profile.username}
        </h1>
        <p className="text-dim text-sm">@{profile.username}</p>
        {profile.bio && <p className="text-white text-sm mt-3 leading-relaxed">{profile.bio}</p>}
        <div className="flex gap-5 mt-4">
          <button onClick={() => openModal('followers')} className="text-left">
            <span className="text-white text-sm font-semibold">{followerCount}</span>
            <span className="text-dim text-sm ml-1.5">followers</span>
          </button>
          <button onClick={() => openModal('following')} className="text-left">
            <span className="text-white text-sm font-semibold">{followingCount}</span>
            <span className="text-dim text-sm ml-1.5">following</span>
          </button>
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

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setModal(null)}>
          <div className="w-full max-w-md rounded-t-3xl overflow-hidden"
            style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', maxHeight: '70vh' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1a1a1a' }}>
              <span className="text-white text-sm font-semibold capitalize">{modal}</span>
              <button onClick={() => setModal(null)} className="text-dim text-sm">Done</button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 57px)' }}>
              {modalLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 rounded-full animate-pulse" style={{ background: '#222' }} />
                </div>
              ) : modalUsers.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-dim text-sm">Nobody here yet.</p>
                </div>
              ) : modalUsers.map((u) => (
                <button key={u.id} onClick={() => { setModal(null); router.push(`/${u.username}`) }}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left"
                  style={{ borderBottom: '1px solid #111' }}>
                  <Avatar name={u.display_name ?? u.username} src={u.avatar_url} size={38} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{u.display_name ?? u.username}</p>
                    <p className="text-dim text-xs">@{u.username}</p>
                  </div>
                  {u.followedByMe && (
                    <span className="text-xs px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{ border: '1px solid #333', color: '#888' }}>Following</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
