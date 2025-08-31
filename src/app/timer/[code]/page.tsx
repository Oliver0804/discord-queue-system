'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Event, Queue } from '@/types'

export default function TimerPage() {
  const { code } = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [currentQueue, setCurrentQueue] = useState<Queue | null>(null)
  const [nextQueue, setNextQueue] = useState<Queue | null>(null)
  const [remainingTime, setRemainingTime] = useState<number>(0)
  const [, setIsActive] = useState(false)

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
          
          // 找到下一個等待中的人
          const waitingQueues = result.event.queues?.filter((q: Queue) => q.status === 'waiting')
            .sort((a: Queue, b: Queue) => a.position - b.position)
          const next = waitingQueues && waitingQueues.length > 0 ? waitingQueues[0] : null
          setNextQueue(next)
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
      const startedAt = currentQueue.startedAt!
      const startTimeStr = typeof startedAt === 'string' 
        ? (startedAt.endsWith('Z') ? startedAt : startedAt + 'Z')
        : (startedAt instanceof Date ? startedAt.toISOString() : new Date().toISOString())
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


  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="text-center space-y-8">
        {/* 原有的七段顯示器框框，內部添加發言人名稱和延長時間 */}
        <div 
          className="seven-segment-display-ultra"
          style={{ color: getDisplayColor() }}
        >
          {/* 上方發言者資訊：正在發言（左）+ 下一位發言者（右） */}
          <div className="flex justify-between items-start mb-4">
            {/* 正在發言（左側） */}
            {currentQueue && (
              <div className="text-left">
                <div className="text-xl font-bold mb-1 text-green-400">正在發言</div>
                <div 
                  className="text-3xl font-bold"
                  style={{ color: getDisplayColor() }}
                >
                  {currentQueue.discordId}
                </div>
              </div>
            )}
            
            {/* 下一位（右側） */}
            {nextQueue && (
              <div className="text-right">
                <div className="text-xl font-bold mb-1 text-yellow-400">下一位</div>
                <div className="text-3xl font-bold text-yellow-300">
                  {nextQueue.discordId}
                </div>
                <div className="text-sm opacity-75 text-yellow-300">#{nextQueue.position}</div>
              </div>
            )}
          </div>
          
          {/* 主要時間顯示 */}
          <div className="mb-4">
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
              className="text-2xl font-mono"
              style={{ color: '#ff8800' }}
            >
              (+{formatSevenSegmentTime(currentQueue.extendedTime)})
            </div>
          )}
        </div>
        
        {/* 沒有發言者時的顯示 */}
        {!currentQueue && !nextQueue && (
          <div className="text-center">
            <div className="seven-segment-display-ultra text-gray-500">
              <div className="text-2xl mb-4">等待發言者...</div>
              <div>
                {formatSevenSegmentTime(0).split('').map((char, index) => (
                  <span 
                    key={index} 
                    className={char === ':' ? 'seven-segment-separator-ultra' : 'seven-segment-digit-ultra'}
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}