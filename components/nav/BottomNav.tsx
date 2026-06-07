'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Clock, User } from 'lucide-react'

const NAV = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/blocks', label: 'Alleys', icon: Clock },
  { href: '/__profile__', label: 'Profile', icon: User },
]

export default function BottomNav({ username }: { username: string }) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 flex border-t"
      style={{ background: '#0a0a0a', borderColor: '#1a1a1a',
        paddingBottom: 'env(safe-area-inset-bottom)', height: '60px' }}>
      {NAV.map(({ href, label, icon: Icon }) => {
        const to = href === '/__profile__' ? `/${username}` : href
        const active = href === '/__profile__' ? pathname === `/${username}` : pathname === href
        return (
          <Link key={href} href={to}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-opacity active:opacity-50">
            <Icon size={22} strokeWidth={active ? 2.5 : 1.75}
              style={{ color: active ? '#fff' : '#444' }} />
            <span className="text-[10px] tracking-wide" style={{ color: active ? '#fff' : '#444' }}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
