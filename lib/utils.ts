import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDurationLabel(hours: number): string {
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'}`
  const days = hours / 24
  if (days === 7) return '1 week'
  if (days === 14) return '2 weeks'
  if (days < 7) return `${days} day${days === 1 ? '' : 's'}`
  return `${days} days`
}

export function formatLiftDate(expiresAt: string): string {
  return format(new Date(expiresAt), "MMM d, yyyy 'at' h:mm a")
}

export function formatLiftDateShort(expiresAt: string): string {
  return format(new Date(expiresAt), 'MMM d')
}

export function formatRelativeTime(createdAt: string): string {
  return formatDistanceToNow(new Date(createdAt), { addSuffix: true })
}

export function getTimeRemaining(expiresAt: string) {
  const total = new Date(expiresAt).getTime() - Date.now()
  if (total <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / 1000 / 60) % 60),
    seconds: Math.floor((total / 1000) % 60),
    expired: false,
  }
}

export function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}
