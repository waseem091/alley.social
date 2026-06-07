import { getInitials } from '@/lib/utils'

const BG_COLORS = ['#2d2d2d','#1f2937','#1e3a5f','#1a2e1a','#3b1f1f','#2d1f3b','#1f2d2d','#3b2d1f']

export default function Avatar({
  name, src, size = 40, className = '',
}: { name: string; src?: string | null; size?: number; className?: string }) {
  if (src) {
    return <img src={src} alt={name} width={size} height={size}
      className={`rounded-full object-cover flex-shrink-0 ${className}`}
      style={{ width: size, height: size }} />
  }
  const bg = BG_COLORS[name.charCodeAt(0) % BG_COLORS.length]
  return (
    <div className={`rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size, minWidth: size, background: bg,
        fontSize: size * 0.35, fontWeight: 600, color: '#888', letterSpacing: '0.03em' }}>
      {getInitials(name)}
    </div>
  )
}
