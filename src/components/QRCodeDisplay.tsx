'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'

interface QRCodeDisplayProps {
  shareUrl: string
  eventName: string
}

export default function QRCodeDisplay({ shareUrl, eventName }: QRCodeDisplayProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const qrUrl = await QRCode.toDataURL(shareUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#1f2937',
            light: '#ffffff'
          }
        })
        setQrCodeUrl(qrUrl)
      } catch (err) {
        console.error('生成QR Code失敗:', err)
      }
    }

    generateQRCode()
  }, [shareUrl])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('複製失敗:', err)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">觀眾報名連結</h2>
      
      {/* QR Code */}
      <div className="flex justify-center mb-6">
        {qrCodeUrl ? (
          <img 
            src={qrCodeUrl} 
            alt="QR Code" 
            className="border-2 border-gray-200 rounded-lg"
          />
        ) : (
          <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* 分享連結 */}
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">分享連結：</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 text-sm bg-white text-gray-900 border border-gray-300 rounded px-3 py-2 font-mono"
            />
            <button
              onClick={copyToClipboard}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                copied 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {copied ? '已複製' : '複製'}
            </button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            觀眾掃描 QR Code 或點擊連結即可報名排隊
          </p>
        </div>

        {/* 統計資訊 */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">使用說明</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 將QR Code或連結分享給觀眾</li>
            <li>• 觀眾輸入Discord ID後自動排隊</li>
            <li>• 您可以拖曳調整排隊順序</li>
            <li>• 時間到需手動點擊「下一位發言」</li>
            <li>• 已完成發言者可拖回進行第二輪</li>
          </ul>
        </div>
      </div>
    </div>
  )
}