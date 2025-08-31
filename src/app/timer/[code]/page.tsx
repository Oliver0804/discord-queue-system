'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Event, Queue } from '@/types'

export default function TimerPage() {
  const { code } = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [currentQueue, setCurrentQueue] = useState<Queue | null>(null)
  const [remainingTime, setRemainingTime] = useState<number>(0)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const response = await fetch(`/api/events/${code}`)
        const result = await response.json()

        if (result.success) {
          setEvent(result.event)
          
          // 找到正在發言的人
          const speaking = result.event.queues?.find((q: Queue) => q.status === 'speaking')
          setCurrentQueue(speaking || null)
        }
      } catch (error) {
        console.error('獲取活動資料失敗:', error)
      }
    }

    if (code) {
      fetchEventData()
      // 每2秒更新一次資料
      const interval = setInterval(fetchEventData, 2000)
      return () => clearInterval(interval)
    }
  }, [code])

  // 計時器邏輯
  useEffect(() => {
    if (!currentQueue || !event || !currentQueue.startedAt) {
      setRemainingTime(0)
      setIsActive(false)
      return
    }

    const updateTimer = () => {
      // 修復時區問題：確保時間被解析為 UTC
      const startTimeStr = currentQueue.startedAt!.endsWith('Z') ? currentQueue.startedAt! : currentQueue.startedAt! + 'Z'
      const startTime = new Date(startTimeStr).getTime()
      const now = Date.now()
      const elapsed = Math.floor((now - startTime) / 1000)
      const totalTime = event.speakTime + (currentQueue.extendedTime || 0)
      const remaining = Math.max(0, totalTime - elapsed)
      
      console.log('Timer 頁面計時器:', {
        startedAt: currentQueue.startedAt,
        fixedStartedAt: startTimeStr,
        startTime,
        now,
        elapsed,
        totalTime,
        remaining
      })
      
      setRemainingTime(remaining)
      setIsActive(remaining > 0)
    }

    // 立即更新一次
    updateTimer()

    // 每秒更新
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [currentQueue, event])

  const formatSevenSegmentTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getDisplayColor = (): string => {
    if (remainingTime <= 0) return '#ff0000' // 紅色 - 時間到
    if (remainingTime <= 60) return '#ff8800' // 橘色 - 最後一分鐘
    return '#00ff00' // 綠色 - 正常
  }

  const getStatusText = (): string => {
    if (!currentQueue) return '等待發言者...'
    if (remainingTime <= 0) return '時間到!'
    if (remainingTime <= 60) return `剩餘 ${remainingTime} 秒`
    return '發言中'
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="text-center">
        {/* 純計時器顯示 */}
        <div 
          className="seven-segment-display-ultra"
          style={{ color: getDisplayColor() }}
        >
          {formatSevenSegmentTime(remainingTime).split('').map((char, index) => (
            <span 
              key={index} 
              className={char === ':' ? 'seven-segment-separator-ultra' : 'seven-segment-digit-ultra'}
            >
              {char}
            </span>
          ))}
        </div>
        
        {/* 延長時間顯示 */}
        {currentQueue && currentQueue.extendedTime > 0 && (
          <div 
            className="mt-4 text-2xl font-mono"
            style={{ color: '#ff8800' }}
          >
            (+{formatSevenSegmentTime(currentQueue.extendedTime)})
          </div>
        )}
      </div>
    </div>
  )
}