import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    
    if (!code) {
      return NextResponse.json(
        { error: '活動代碼為必填' },
        { status: 400 }
      )
    }

    // 根據分享碼或主持人碼查找活動
    const event = await prisma.event.findFirst({
      where: {
        OR: [
          { shareCode: code },
          { hostCode: code }
        ]
      },
      include: {
        queues: {
          where: {
            status: {
              not: 'removed'
            }
          },
          orderBy: {
            position: 'asc'
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: '找不到該活動' },
        { status: 404 }
      )
    }

    // 判斷是主持人還是觀眾
    const isHost = event.hostCode === code

    return NextResponse.json({
      success: true,
      event: {
        ...event,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
        queues: event.queues.map(queue => ({
          ...queue,
          joinedAt: queue.joinedAt.toISOString(),
          startedAt: queue.startedAt?.toISOString() || null
        }))
      },
      isHost
    })

  } catch (error) {
    console.error('取得活動資訊時發生錯誤:', error)
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const body = await request.json()
    
    // 只有主持人碼可以更新活動
    const event = await prisma.event.findFirst({
      where: { hostCode: code }
    })

    if (!event) {
      return NextResponse.json(
        { error: '無權限或活動不存在' },
        { status: 404 }
      )
    }

    const updatedEvent = await prisma.event.update({
      where: { id: event.id },
      data: {
        status: body.status,
        name: body.name,
        description: body.description,
        speakTime: body.speakTime
      }
    })

    return NextResponse.json({
      success: true,
      event: {
        ...updatedEvent,
        createdAt: updatedEvent.createdAt.toISOString(),
        updatedAt: updatedEvent.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('更新活動時發生錯誤:', error)
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}