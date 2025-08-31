'use client'

import { useState, useEffect } from 'react'
import { Queue } from '@/types'
import { formatTime } from '@/lib/utils'

interface SevenSegmentTimerProps {
  currentQueue: Queue | null
  speakTime: number
  isVisible: boolean
  onClose: () => void
}

export default function SevenSegmentTimer({ 
  currentQueue, 
  speakTime, 
  isVisible, 
  onClose 
}: SevenSegmentTimerProps) {
  const [remainingTime, setRemainingTime] = useState<number>(0)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (!currentQueue || !currentQueue.startedAt) {
      setRemainingTime(0)
      return
    }

    const updateTimer = () => {
      const startTime = new Date(currentQueue.startedAt!).getTime()
      const now = Date.now()
      const elapsed = Math.floor((now - startTime) / 1000)
      const totalTime = speakTime + (currentQueue.extendedTime || 0)
      const remaining = Math.max(0, totalTime - elapsed)
      
      setRemainingTime(remaining)
    }

    // 立即更新一次
    updateTimer()

    // 每秒更新
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [currentQueue, speakTime])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 300)
  }

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

  if (!isVisible || !currentQueue) return null

  return (
    <div className={`timer-popup ${isClosing ? 'closing' : ''}`}>
      <div 
        className="seven-segment-display"
        style={{ color: getDisplayColor() }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-normal text-gray-300">
            {currentQueue.discordId}
          </span>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-xl font-bold w-6 h-6 flex items-center justify-center"
          >
            ×
          </button>
        </div>
        <div className="text-center">
          {formatSevenSegmentTime(remainingTime).split('').map((char, index) => (
            <span 
              key={index} 
              className={char === ':' ? 'seven-segment-separator' : 'seven-segment-digit'}
            >
              {char}
            </span>
          ))}
        </div>
        <div className="text-xs text-gray-400 text-center mt-2">
          {remainingTime <= 0 ? '時間到!' : remainingTime <= 60 ? `剩餘 ${remainingTime} 秒` : '發言中'}
        </div>
      </div>
    </div>
  )
}