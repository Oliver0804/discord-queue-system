'use client'

import { useState, useEffect } from 'react'
import { Queue, TimerData } from '@/types'
import { formatTime } from '@/lib/utils'

interface TimerProps {
  currentQueue: Queue | null
  timerData: TimerData | null
  speakTime: number
  onExtend: (additionalTime: number) => void
  onNext: () => void
}

export default function Timer({ currentQueue, timerData, speakTime, onExtend, onNext }: TimerProps) {
  const [hasPlayedOneMinuteWarning, setHasPlayedOneMinuteWarning] = useState(false)
  const [hasPlayedTimeUpSound, setHasPlayedTimeUpSound] = useState(false)

  // 重置音效播放狀態
  useEffect(() => {
    if (currentQueue) {
      setHasPlayedOneMinuteWarning(false)
      setHasPlayedTimeUpSound(false)
    }
  }, [currentQueue?.id])

  // 音效播放邏輯
  useEffect(() => {
    if (!timerData || !timerData.isActive) return

    const remainingTime = timerData.remainingTime

    // 1分鐘警告音
    if (remainingTime === 60 && !hasPlayedOneMinuteWarning) {
      playSound('warning')
      setHasPlayedOneMinuteWarning(true)
    }

    // 時間到提示音
    if (remainingTime === 0 && !hasPlayedTimeUpSound) {
      playSound('timeup')
      setHasPlayedTimeUpSound(true)
    }
  }, [timerData?.remainingTime, hasPlayedOneMinuteWarning, hasPlayedTimeUpSound])

  const playSound = (type: 'warning' | 'timeup') => {
    try {
      // 使用 Web Audio API 生成簡單的提示音
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const context = new AudioContextClass()
      
      if (type === 'warning') {
        // 1分鐘警告：兩聲短音
        for (let i = 0; i < 2; i++) {
          setTimeout(() => {
            const oscillator = context.createOscillator()
            const gainNode = context.createGain()
            oscillator.connect(gainNode)
            gainNode.connect(context.destination)
            
            oscillator.frequency.value = 800
            gainNode.gain.setValueAtTime(0.3, context.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2)
            
            oscillator.start(context.currentTime)
            oscillator.stop(context.currentTime + 0.2)
          }, i * 300)
        }
      } else if (type === 'timeup') {
        // 時間到：三聲長音
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            const oscillator = context.createOscillator()
            const gainNode = context.createGain()
            oscillator.connect(gainNode)
            gainNode.connect(context.destination)
            
            oscillator.frequency.value = 1000
            gainNode.gain.setValueAtTime(0.3, context.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5)
            
            oscillator.start(context.currentTime)
            oscillator.stop(context.currentTime + 0.5)
          }, i * 600)
        }
      }
    } catch (err) {
      console.error('播放音效失敗:', err)
    }
  }

  const getTimerColor = () => {
    if (!timerData || !timerData.isActive) return 'text-gray-400'
    
    const remaining = timerData.remainingTime
    const total = speakTime + (currentQueue?.extendedTime || 0)
    const percentage = (remaining / total) * 100

    if (percentage <= 10) return 'text-red-500'
    if (percentage <= 25) return 'text-orange-500'
    return 'text-green-500'
  }

  const getProgressPercentage = () => {
    if (!timerData || !currentQueue) return 0
    
    const total = speakTime + currentQueue.extendedTime
    const elapsed = total - timerData.remainingTime
    return Math.min((elapsed / total) * 100, 100)
  }

  return (
    <div className="space-y-4">
      {/* 計時器顯示 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">發言計時</h2>
        
        {currentQueue ? (
          <div className="text-center">
            <div className="mb-4">
              <p className="text-lg font-medium text-gray-700 mb-2">目前發言者</p>
              <p className="text-2xl font-bold text-blue-600">{currentQueue.discordId}</p>
            </div>

            {/* 倒數計時顯示 */}
            <div className="mb-6">
              <div className={`text-6xl font-mono font-bold ${getTimerColor()}`}>
                {timerData ? formatTime(timerData.remainingTime) : '--:--'}
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    getProgressPercentage() <= 90 ? 'bg-green-500' :
                    getProgressPercentage() <= 97 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>

            {/* 時間資訊 */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-700 font-medium">原始時間</p>
                <p className="font-bold text-blue-900 text-lg">{formatTime(speakTime)}</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-orange-700 font-medium">
                  {currentQueue.extendedTime > 0 ? '已延長時間' : '延長時間'}
                </p>
                <p className={`font-bold text-lg ${
                  currentQueue.extendedTime > 0 ? 'text-orange-900' : 'text-gray-600'
                }`}>
                  +{formatTime(currentQueue.extendedTime)}
                </p>
              </div>
            </div>

            {/* 控制按鈕 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => onExtend(30)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg"
              >
                延長 30秒
              </button>
              <button
                onClick={() => onExtend(60)}
                className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg"
              >
                延長 1分鐘
              </button>
            </div>

            <button
              onClick={onNext}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg"
            >
              下一位發言
            </button>

            {/* 狀態提示 */}
            {timerData && (
              <div className="mt-4">
                {timerData.remainingTime <= 60 && timerData.remainingTime > 0 && (
                  <div className="bg-orange-100 border border-orange-300 text-orange-800 px-4 py-2 rounded-lg">
                    ⚠️ 剩餘時間不到1分鐘！
                  </div>
                )}
                {timerData.remainingTime === 0 && (
                  <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded-lg">
                    🔔 時間到！請切換下一位
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl font-mono font-bold text-gray-300 mb-4">--:--</div>
            <p className="text-gray-500">沒有人在發言</p>
            <p className="text-sm text-gray-400 mt-2">
              點擊排隊列表中的「開始發言」來開始計時
            </p>
          </div>
        )}
      </div>

      {/* 音效說明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">音效提醒</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 剩餘1分鐘：播放兩聲短音</li>
          <li>• 時間結束：播放三聲長音（需手動切換下一位）</li>
          <li>• 可延長發言時間30秒或1分鐘</li>
        </ul>
      </div>
    </div>
  )
}