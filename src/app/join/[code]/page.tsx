'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Event, Queue } from '@/types'
import { formatTime } from '@/lib/utils'
import Footer from '@/components/Footer'

export default function JoinPage() {
  const { code } = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [queues, setQueues] = useState<Queue[]>([])
  const [discordId, setDiscordId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [userQueue, setUserQueue] = useState<Queue | null>(null)

  const fetchEventData = async () => {
    try {
      const response = await fetch(`/api/events/${code}`)
      const result = await response.json()

      if (result.success) {
        setEvent(result.event)
        setQueues(result.event.queues || [])
      } else {
        setError(result.error || '載入失敗')
      }
    } catch (err) {
      setError('網路錯誤')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!discordId.trim()) {
      setError('請輸入 Discord ID')
      return
    }

    if (!event) return

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/queue/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          discordId: discordId.trim()
        })
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(true)
        setUserQueue(result.queue)
        await fetchEventData() // 重新載入資料
      } else {
        setError(result.error || '報名失敗')
      }
    } catch (err) {
      setError('網路錯誤，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (code) {
      fetchEventData()
    }
  }, [code])

  // 定期更新排隊狀態
  useEffect(() => {
    if (!event) return

    const interval = setInterval(fetchEventData, 5000) // 每5秒更新一次
    return () => clearInterval(interval)
  }, [event?.id])

  // 檢查用戶是否已在排隊中
  useEffect(() => {
    if (discordId && queues.length > 0) {
      const existing = queues.find(q => 
        q.discordId === discordId.trim() && 
        ['waiting', 'speaking'].includes(q.status)
      )
      if (existing) {
        setUserQueue(existing)
        setSuccess(true)
      }
    }
  }, [discordId, queues])

  const waitingQueues = queues.filter(q => q.status === 'waiting').sort((a, b) => a.position - b.position)
  const speakingQueue = queues.find(q => q.status === 'speaking')
  const userPosition = userQueue ? waitingQueues.findIndex(q => q.id === userQueue.id) + 1 : 0
  const estimatedWaitTime = userPosition > 0 ? (userPosition - 1) * (event?.speakTime || 0) : 0

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error && !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">錯誤</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!event) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex flex-col">
      <div className="flex-1 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* 活動資訊 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {event.name}
            </h1>
            {event.description && (
              <p className="text-gray-600 mb-4">{event.description}</p>
            )}
            
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                每人 {formatTime(event.speakTime || 0)}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                event.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                event.status === 'active' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {event.status === 'preparing' ? '準備中' :
                 event.status === 'active' ? '進行中' : '已結束'}
              </span>
            </div>

            {event.status === 'finished' && (
              <div className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-3 rounded-lg mb-4">
                活動已結束，無法再報名
              </div>
            )}
          </div>
        </div>

        {/* 報名表單或狀態 */}
        {!success && event.status !== 'finished' ? (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">報名排隊</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="discordId" className="block text-sm font-medium text-gray-700 mb-2">
                  Discord ID *
                </label>
                <input
                  type="text"
                  id="discordId"
                  required
                  value={discordId}
                  onChange={(e) => setDiscordId(e.target.value)}
                  placeholder="例：username#1234 或 @username"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                />
                <p className="text-sm text-gray-500 mt-1">
                  請輸入您的 Discord 用戶名，主持人會依此呼叫您
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {isSubmitting ? '報名中...' : '加入排隊'}
              </button>
            </form>
          </div>
        ) : success && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✓</span>
              </div>
              
              <h2 className="text-2xl font-bold text-green-700 mb-2">報名成功！</h2>
              <p className="text-gray-600 mb-6">您已成功加入排隊，請耐心等待</p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-green-600 font-medium">您的位置</p>
                    <p className="text-2xl font-bold text-green-700">
                      {userQueue?.status === 'speaking' ? '發言中' : 
                       userPosition > 0 ? `第 ${userPosition} 位` : '排隊中'}
                    </p>
                  </div>
                  <div>
                    <p className="text-green-600 font-medium">預計等待</p>
                    <p className="text-2xl font-bold text-green-700">
                      {userQueue?.status === 'speaking' ? '00:00' : formatTime(estimatedWaitTime)}
                    </p>
                  </div>
                </div>
              </div>

              {userQueue?.status === 'speaking' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-blue-800 font-medium">🎤 輪到您發言了！</p>
                  <p className="text-sm text-blue-600 mt-1">請準備好您要說的內容</p>
                </div>
              )}

              <p className="text-sm text-gray-500">
                此頁面會自動更新排隊狀態，請保持頁面開啟
              </p>
            </div>
          </div>
        )}

        {/* 目前排隊狀況 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">目前排隊狀況</h2>
          
          {/* 正在發言 */}
          {speakingQueue && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-green-700 mb-2 flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                正在發言
              </h3>
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
                <p className="font-medium text-green-800">{speakingQueue.discordId}</p>
              </div>
            </div>
          )}

          {/* 等待隊列 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              等待隊列 ({waitingQueues.length}人)
            </h3>
            
            {waitingQueues.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p>目前沒有人在排隊</p>
                {!success && event.status !== 'finished' && (
                  <p className="text-sm mt-1">您可以第一個報名！</p>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {waitingQueues.map((queue, index) => (
                  <div 
                    key={queue.id} 
                    className={`border rounded-lg p-3 ${
                      userQueue?.id === queue.id 
                        ? 'bg-purple-50 border-purple-300' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="bg-blue-100 text-blue-800 text-sm font-bold px-2 py-1 rounded">
                          #{index + 1}
                        </span>
                        <p className="font-medium text-gray-700">
                          {queue.discordId}
                          {userQueue?.id === queue.id && (
                            <span className="text-purple-600 ml-2">(您)</span>
                          )}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500">
                        預計 {formatTime(index * (event.speakTime || 0))} 後
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 注意事項 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">注意事項</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 請在輪到您時準備好要說的內容</li>
            <li>• 每人發言時間為 {formatTime(event.speakTime || 0)}</li>
            <li>• 主持人可能會延長或縮短發言時間</li>
            <li>• 請保持此頁面開啟以接收最新狀態</li>
          </ul>
        </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}