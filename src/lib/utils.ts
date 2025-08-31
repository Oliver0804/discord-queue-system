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

export function formatTimeWithTimezone(dateInput: string | Date): string {
  // 處理不同的輸入類型
  let date: Date
  if (typeof dateInput === 'string') {
    // 確保時間字串有 Z 後綴以正確解析為 UTC
    const isoString = dateInput.endsWith('Z') ? dateInput : dateInput + 'Z'
    date = new Date(isoString)
  } else {
    date = dateInput
  }
  return date.toLocaleTimeString('zh-TW', { timeZone: 'Asia/Taipei' })
}