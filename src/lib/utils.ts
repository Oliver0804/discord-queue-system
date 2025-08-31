import { v4 as uuidv4 } from 'uuid'

export function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function generateUUID(): string {
  return uuidv4()
}

export function formatTimeWithTimezone(dateString: string): string {
  // 確保時間字串有 Z 後綴以正確解析為 UTC
  const isoString = dateString.endsWith('Z') ? dateString : dateString + 'Z'
  return new Date(isoString).toLocaleTimeString('zh-TW', { timeZone: 'Asia/Taipei' })
}