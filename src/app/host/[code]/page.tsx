'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Event, Queue, TimerData } from '@/types'
import { formatTime } from '@/lib/utils'
import QRCodeDisplay from '@/components/QRCodeDisplay'
import QueueManager from '@/components/QueueManager'
import Timer from '@/components/Timer'
import Footer from '@/components/Footer'

export default function HostPage() {
  const { code } = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [queues, setQueues] = useState<Queue[]>([])
  const [currentQueue, setCurrentQueue] = useState<Queue | null>(null)
  const [timerData, setTimerData] = useState<TimerData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchEventData = useCallback(async () => {
    try {
      const response = await fetch(`/api/events/${code}`)
      const result = await response.json()

      if (result.success) {
        if (!result.isHost) {
          setError('您沒有權限訪問此頁面')
          return
        }
        
        setEvent(result.event)
        setQueues(result.event.queues || [])
        
        // 找到正在發言的人
        const speaking = result.event.queues?.find((q: Queue) => q.status === 'speaking')
        setCurrentQueue(speaking || null)
      } else {
        setError(result.error || '載入失敗')
      }
    } catch {
      setError('網路錯誤')
    } finally {
      setIsLoading(false)
    }
  }, [code])

  const startSpeaking = async (queueId: string) => {
    try {
      const startTime = new Date().toISOString()
      const response = await fetch(`/api/queue/${queueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'speaking',
          startedAt: startTime
        })
      })

      if (response.ok) {
        // 立即更新本地狀態以確保計時器能正常啟動
        const targetQueue = queues.find(q => q.id === queueId)
        if (targetQueue) {
          const updatedQueue = {
            ...targetQueue,
            status: 'speaking' as const,
            startedAt: new Date(startTime)
          }
          setCurrentQueue(updatedQueue)
        }
        
        // 然後重新獲取完整資料
        await fetchEventData()
      }
    } catch (err) {
      console.error('開始發言失敗:', err)
    }
  }

  const nextSpeaker = async () => {
    if (!event) return

    try {
      // 將當前發言者標記為完成
      if (currentQueue) {
        await fetch(`/api/queue/${currentQueue.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' })
        })
      }

      // 找到下一個等待中的人（排除剛被標記為completed的currentQueue）
      const waitingQueues = queues
        .filter(q => q.status === 'waiting' && q.id !== currentQueue?.id)
        .sort((a, b) => a.position - b.position)
      const nextInQueue = waitingQueues[0]
      
      if (nextInQueue) {
        // 立即更新狀態
        const startTime = new Date().toISOString()
        const updatedQueue = {
          ...nextInQueue,
          status: 'speaking' as const,
          startedAt: new Date(startTime)
        }
        setCurrentQueue(updatedQueue)
        
        // 發送API請求
        try {
          await fetch(`/api/queue/${nextInQueue.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'speaking',
              startedAt: startTime
            })
          })
          // 重新獲取完整資料
          await fetchEventData()
        } catch (err) {
          console.error('更新發言狀態失敗:', err)
        }
      } else {
        setCurrentQueue(null)
        setTimerData(null)
        // 重新獲取資料
        await fetchEventData()
      }
    } catch (err) {
      console.error('切換下一位失敗:', err)
    }
  }

  const extendTime = async (additionalTime: number) => {
    if (!currentQueue) return

    try {
      const response = await fetch(`/api/queue/${currentQueue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extendedTime: currentQueue.extendedTime + additionalTime
        })
      })

      if (response.ok) {
        setCurrentQueue(prev => prev ? {
          ...prev,
          extendedTime: prev.extendedTime + additionalTime
        } : null)
      }
    } catch (err) {
      console.error('延長時間失敗:', err)
    }
  }

  const removeFromQueue = async (queueId: string) => {
    try {
      const response = await fetch(`/api/queue/${queueId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchEventData()
      }
    } catch (err) {
      console.error('移除排隊失敗:', err)
    }
  }

  const updateEventStatus = async (status: Event['status']) => {
    if (!event) return

    try {
      const response = await fetch(`/api/events/${code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        setEvent(prev => prev ? { ...prev, status } : null)
      }
    } catch (err) {
      console.error('更新活動狀態失敗:', err)
    }
  }

  useEffect(() => {
    if (code) {
      fetchEventData()
    }
  }, [code, fetchEventData])

  // 計時器邏輯
  useEffect(() => {
    if (!currentQueue || !event) return

    const totalTime = event.speakTime + currentQueue.extendedTime
    const startTime = new Date(currentQueue.startedAt!).getTime()
    
    const timer = setInterval(() => {
      const now = Date.now()
      const elapsed = Math.floor((now - startTime) / 1000)
      const remaining = Math.max(0, totalTime - elapsed)

      setTimerData({
        eventId: event.id,
        currentQueueId: currentQueue.id,
        remainingTime: remaining,
        isActive: remaining > 0
      })

      // 時間到時停止計時器，但不自動切換下一位
      if (remaining === 0) {
        setTimerData(prev => prev ? { ...prev, isActive: false } : null)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [currentQueue, event]) // eslint-disable-line react-hooks/exhaustive-deps

  // 定期更新排隊資料
  useEffect(() => {
    if (!event) return

    const interval = setInterval(fetchEventData, 5000) // 每5秒更新一次
    return () => clearInterval(interval)
  }, [event?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">錯誤</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!event) return null

  const shareUrl = `${window.location.origin}/join/${event.shareCode}`

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 頁面標題 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {event.name}
              </h1>
              {event.description && (
                <p className="text-gray-600 mb-4">{event.description}</p>
              )}
              <div className="flex items-center gap-4">
                <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  每人 {formatTime(event.speakTime || 0)}
                </span>
                <span className={`text-sm px-3 py-1 rounded-full ${
                  event.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                  event.status === 'active' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {event.status === 'preparing' ? '準備中' :
                   event.status === 'active' ? '進行中' : '已結束'}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {event.status === 'preparing' && (
                <button
                  onClick={() => updateEventStatus('active')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  開始活動
                </button>
              )}
              {event.status === 'active' && (
                <button
                  onClick={() => updateEventStatus('finished')}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  結束活動
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側：QR Code 和分享 */}
          <div className="lg:col-span-1">
            <QRCodeDisplay 
              shareUrl={shareUrl} 
              eventName={event.name}
            />
          </div>

          {/* 中間：排隊管理 */}
          <div className="lg:col-span-1">
            <QueueManager
              queues={queues}
              onStartSpeaking={startSpeaking}
              onRemove={removeFromQueue}
              onReorder={(newQueues) => setQueues(newQueues)}
              eventStatus={event.status}
            />
          </div>

          {/* 右側：計時器和控制 */}
          <div className="lg:col-span-1">
            <Timer
              currentQueue={currentQueue}
              timerData={timerData}
              speakTime={event.speakTime}
              onExtend={extendTime}
              onNext={nextSpeaker}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}