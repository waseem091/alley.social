import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/nav/BottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const username = user.user_metadata?.username ?? user.id

  return (
    <div className="min-h-screen bg-bg" style={{ paddingBottom: '60px' }}>
      {children}
      <BottomNav username={username} />
    </div>
  )
}