'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/ui/Avatar'
import { formatRelativeTime } from '@/lib/utils'
import { Post, Profile } from '@/types'

function PostCard({ post }: { post: Post }) {
  const author = post.author
  if (!author) return null
  return (
    <article className="px-4 py-4 flex gap-3" style={{ borderBottom: '1px solid #1a1a1a' }}>
      <Link href={`/${author.username}`} className="flex-shrink-0">
        <Avatar name={author.display_name ?? author.username} src={author.avatar_url} size={38} />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <Link href={`/${author.username}`} className="text-white text-sm font-semibold hover:opacity-80">
            {author.display_name ?? author.username}
          </Link>
          <span className="text-muted text-xs">@{author.username}</span>
          <span className="text-muted text-xs ml-auto">{formatRelativeTime(post.created_at)}</span>
        </div>
        <p className="text-white text-sm leading-relaxed break-words">{post.content}</p>
      </div>
    </article>
  )
}

function PostComposer({ profile, onPost }: { profile: Profile; onPost: (c: string) => Promise<void> }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!content.trim() || loading) return
    setLoading(true)
    await onPost(content.trim())
    setContent('')
    setLoading(false)
  }

  return (
    <div className="px-4 py-3 flex gap-3" style={{ borderBottom: '1px solid #1a1a1a' }}>
      <Avatar name={profile.display_name ?? profile.username} src={profile.avatar_url} size={38} className="mt-0.5" />
      <div className="flex-1">
        <textarea value={content} onChange={(e) => setContent(e.target.value)}
          placeholder="What's happening?" maxLength={280} rows={3}
          className="w-full bg-transparent text-white text-sm placeholder-muted resize-none outline-none leading-relaxed" />
        <div className="flex justify-end mt-2">
          <button onClick={submit} disabled={!content.trim() || loading}
            className="px-4 py-1.5 rounded-full text-xs font-semibold disabled:opacity-30"
            style={{ background: '#fff', color: '#0a0a0a' }}>
            {loading ? '…' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setSearchOpen(false)
      return
    }
    const supabase = createClient()
    supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .ilike('username', `%${searchQuery.trim()}%`)
      .limit(5)
      .then(({ data }) => {
        setSearchResults((data as Profile[]) ?? [])
        setSearchOpen(true)
      })
  }, [searchQuery])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: myProfile }, { data: feedPosts }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('feed_posts').select('*').order('created_at', { ascending: false }).limit(50),
      ])

      setProfile(myProfile)
      setPosts(feedPosts ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handlePost(content: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('posts').insert({ content, author_id: user.id })
      .select('*, author:profiles!author_id(*)').single()
    if (data) setPosts((prev) => [data, ...prev])
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="sticky top-0 z-10 px-5 py-4 flex items-center"
        style={{ background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1a1a1a' }}>
        <span className="text-xl font-display font-medium" style={{ letterSpacing: '-0.03em' }}>a<em>ll</em>ey</span>
      </div>

      <div ref={searchRef} className="relative px-4 py-3" style={{ borderBottom: '1px solid #1a1a1a' }}>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search people…"
          className="w-full text-white text-sm placeholder-[#555] outline-none px-4 py-2.5 rounded-full"
          style={{ background: '#111', border: '1px solid #222' }}
        />
        {searchOpen && searchResults.length > 0 && (
          <div className="absolute left-4 right-4 z-50 rounded-2xl overflow-hidden"
            style={{ top: 'calc(100% - 4px)', background: '#111', border: '1px solid #222' }}>
            {searchResults.map((p) => (
              <button key={p.id} onClick={() => { setSearchOpen(false); setSearchQuery(''); router.push(`/${p.username}`) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
                style={{ borderBottom: '1px solid #1a1a1a' }}>
                <Avatar name={p.display_name ?? p.username} src={p.avatar_url} size={36} />
                <div>
                  <p className="text-white text-sm font-medium">{p.display_name ?? p.username}</p>
                  <p className="text-dim text-xs">@{p.username}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {profile && <PostComposer profile={profile} onPost={handlePost} />}

      {loading ? (
        <div className="flex flex-col">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="px-4 py-4 flex gap-3" style={{ borderBottom: '1px solid #1a1a1a', opacity: 1 - i * 0.2 }}>
              <div className="w-[38px] h-[38px] rounded-full animate-pulse" style={{ background: '#161616' }} />
              <div className="flex-1 flex flex-col gap-2 pt-1">
                <div className="h-3 w-24 rounded-full animate-pulse" style={{ background: '#161616' }} />
                <div className="h-3 w-full rounded-full animate-pulse" style={{ background: '#161616' }} />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-24 text-center px-8">
          <p className="text-white font-semibold mb-2">Nothing here yet</p>
          <p className="text-dim text-sm">Follow people to see their posts.</p>
        </div>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  )
}
