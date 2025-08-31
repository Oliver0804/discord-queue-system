import { NextRequest, NextResponse } from 'next/server'
import { QueueService } from '@/lib/db'
import { ReorderQueueData } from '@/types'

export async function PUT(request: NextRequest) {
  try {
    const body: ReorderQueueData = await request.json()
    
    if (!body.eventId || !body.queueItems || !Array.isArray(body.queueItems)) {
      return NextResponse.json(
        { error: '無效的請求資料' },
        { status: 400 }
      )
    }

    // 批量更新所有排隊項目的位置
    const queues = await QueueService.reorderBatch(body.eventId, body.queueItems)

    return NextResponse.json({
      success: true,
      queues
    })

  } catch (error) {
    console.error('重新排序時發生錯誤:', error)
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}