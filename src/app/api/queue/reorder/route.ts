import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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

    // 在事務中更新所有排隊項目的位置
    const updatedQueues = await prisma.$transaction(async (tx) => {
      const updates = []
      
      for (const item of body.queueItems) {
        const update = tx.queue.update({
          where: { id: item.id },
          data: { position: item.position }
        })
        updates.push(update)
      }
      
      return Promise.all(updates)
    })

    // 取得更新後的完整排隊列表
    const queues = await prisma.queue.findMany({
      where: {
        eventId: body.eventId,
        status: {
          not: 'removed'
        }
      },
      orderBy: {
        position: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      queues: queues.map(queue => ({
        ...queue,
        joinedAt: queue.joinedAt.toISOString(),
        startedAt: queue.startedAt?.toISOString() || null
      }))
    })

  } catch (error) {
    console.error('重新排序時發生錯誤:', error)
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}