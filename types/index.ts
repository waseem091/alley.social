export interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
}

export interface Post {
  id: string
  author_id: string
  content: string
  created_at: string
  author?: Profile
}

export interface TempBlock {
  id: string
  blocker_id: string
  blocked_id: string
  duration_hours: number
  created_at: string
  expires_at: string
  lifted_at: string | null
  blocked_user?: Profile
  extensions?: { id: string; extended_to_id: string; extended_to?: Profile }[]
}
