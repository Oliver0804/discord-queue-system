'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreateEventData } from '@/types'
import Footer from '@/components/Footer'

export default function HomePage() {
  const [formData, setFormData] = useState<CreateEventData>({
    name: '',
    description: '',
    speakTime: 180 // 預設3分鐘
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        // 導向主持人頁面
        router.push(`/host/${result.event.hostCode}`)
      } else {
        setError(result.error || '建立活動失敗')
      }
    } catch (err) {
      setError('網路錯誤，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <div className="flex-1 p-4">
        <div className="max-w-md mx-auto pt-20">
          <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Discord 排麥系統
            </h1>
            <p className="text-gray-600">
              建立活動，讓觀眾有序排隊發言
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                活動名稱 *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                placeholder="例：今晚直播互動時間"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                活動描述
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors resize-none"
                placeholder="簡單描述這個活動的內容..."
              />
            </div>

            <div>
              <label htmlFor="speakTime" className="block text-sm font-medium text-gray-700 mb-2">
                每人發言時間（秒）*
              </label>
              <select
                id="speakTime"
                value={formData.speakTime}
                onChange={(e) => setFormData(prev => ({...prev, speakTime: parseInt(e.target.value)}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
              >
                <option value={60}>1 分鐘</option>
                <option value={120}>2 分鐘</option>
                <option value={180}>3 分鐘</option>
                <option value={240}>4 分鐘</option>
                <option value={300}>5 分鐘</option>
                <option value={600}>10 分鐘</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {isLoading ? '建立中...' : '建立活動'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              建立完成後，您將獲得主持人管理頁面和觀眾報名連結
            </p>
          </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
