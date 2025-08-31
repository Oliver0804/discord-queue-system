export interface Event {
  id: string
  name: string
  description: string | null
  speakTime: number
  hostCode: string
  shareCode: string
  status: 'preparing' | 'active' | 'finished'
  createdAt: Date
  updatedAt: Date
  queues?: Queue[]
}

export interface Queue {
  id: string
  eventId: string
  discordId: string
  position: number
  status: 'waiting' | 'speaking' | 'completed' | 'removed'
  joinedAt: Date | string
  startedAt: Date | string | null
  extendedTime: number
  event?: Event
}

export interface CreateEventData {
  name: string
  description?: string
  speakTime: number
}

export interface JoinQueueData {
  eventId: string
  discordId: string
}

export interface ReorderQueueData {
  eventId: string
  queueItems: { id: string; position: number }[]
}

export interface TimerData {
  eventId: string
  currentQueueId: string | null
  remainingTime: number
  isActive: boolean
}

export interface SocketEvents {
  // 客戶端發送事件
  'join-event': (eventId: string) => void
  'leave-event': (eventId: string) => void
  'start-speaking': (queueId: string) => void
  'extend-time': (queueId: string, additionalTime: number) => void
  'next-speaker': (eventId: string) => void
  
  // 伺服器發送事件
  'queue-updated': (queues: Queue[]) => void
  'timer-updated': (timerData: TimerData) => void
  'speaker-changed': (currentQueue: Queue | null) => void
  'event-status-changed': (status: Event['status']) => void
}