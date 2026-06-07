import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F7F3EE', color: '#1a1a1a' }}>
      <header className="flex items-center justify-between px-6 pt-8 pb-4">
        <span className="font-display font-medium" style={{ letterSpacing: '-0.03em' }}>a<em>ll</em>ey</span>
        <Link href="/login" className="text-sm font-medium px-4 py-2 rounded-full border border-current">
          Sign in
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display font-medium leading-none mb-8 select-none"
          style={{ fontSize: 'clamp(72px,20vw,160px)', letterSpacing: '-0.03em' }}>
          a<em>ll</em>ey
        </h1>
        <p className="font-normal mb-4" style={{ fontSize: 'clamp(18px,4vw,28px)', letterSpacing: '-0.01em' }}>
          Step away. Come back.
        </p>
        <p className="text-base max-w-sm mx-auto mb-12 leading-relaxed" style={{ color: '#666' }}>
          A temporary block that lifts itself. No permanent decisions.
          No awkward unblocking. Just a timed pause — locked in until it expires.
        </p>
        <Link href="/signup"
          className="inline-block px-8 py-4 text-base font-semibold rounded-full transition-opacity hover:opacity-80"
          style={{ background: '#1a1a1a', color: '#F7F3EE' }}>
          Get started
        </Link>
      </main>

      <section className="px-6 pb-16 flex flex-col gap-3 max-w-xs mx-auto w-full">
        {[
          { icon: '⏱', text: 'Timer locks in. No early exit.' },
          { icon: '👻', text: 'They see a deactivated account.' },
          { icon: '↩', text: 'Lifts automatically when it expires.' },
        ].map((item) => (
          <div key={item.text} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: '#EDE8E2' }}>
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm font-medium" style={{ color: '#444' }}>{item.text}</span>
          </div>
        ))}
      </section>
    </div>
  )
}
