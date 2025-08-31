import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { JoinQueueData } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: JoinQueueData = await request.json()
    
    if (!body.eventId || !body.discordId) {
      return NextResponse.json(
        { error: '活動ID和Discord ID為必填欄位' },
        { status: 400 }
      )
    }

    // 驗證活動是否存在且可加入
    const event = await prisma.event.findUnique({
      where: { id: body.eventId },
      include: {
        queues: {
          where: {
            status: {
              not: 'removed'
            }
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: '活動不存在' },
        { status: 404 }
      )
    }

    if (event.status === 'finished') {
      return NextResponse.json(
        { error: '活動已結束' },
        { status: 400 }
      )
    }

    // 檢查是否已經在排隊中
    const existingQueue = await prisma.queue.findFirst({
      where: {
        eventId: body.eventId,
        discordId: body.discordId,
        status: {
          in: ['waiting', 'speaking']
        }
      }
    })

    if (existingQueue) {
      return NextResponse.json(
        { error: '您已經在排隊中了' },
        { status: 400 }
      )
    }

    // 取得目前最大的position
    const lastQueue = await prisma.queue.findFirst({
      where: {
        eventId: body.eventId,
        status: {
          not: 'removed'
        }
      },
      orderBy: {
        position: 'desc'
      }
    })

    const newPosition = lastQueue ? lastQueue.position + 1 : 1

    const queue = await prisma.queue.create({
      data: {
        eventId: body.eventId,
        discordId: body.discordId,
        position: newPosition
      }
    })

    return NextResponse.json({
      success: true,
      queue: {
        ...queue,
        joinedAt: queue.joinedAt.toISOString(),
        startedAt: queue.startedAt?.toISOString() || null
      }
    })

  } catch (error) {
    console.error('加入排隊時發生錯誤:', error)
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}