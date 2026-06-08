import { getInitials } from '@/lib/utils'

const BG_COLORS = ['#FBBC05', '#EA4335', '#4285F4', '#34A853']

export default function Avatar({
  name, src, size = 40, className = '',
}: { name: string; src?: string | null; size?: number; className?: string }) {
  if (src) {
    return <img src={src} alt={name} width={size} height={size}
      className={`rounded-full object-cover flex-shrink-0 ${className}`}
      style={{ width: size, height: size }} />
  }
  const hash = name.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)
  const bg = BG_COLORS[Math.abs(hash) % BG_COLORS.length]
  return (
    <div className={`rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size, minWidth: size, background: bg,
        fontSize: size * 0.35, fontWeight: 600, color: '#fff', letterSpacing: '0.03em' }}>
      {getInitials(name)}
    </div>
  )
}
