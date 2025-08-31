import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: '排隊ID為必填' },
        { status: 400 }
      )
    }

    // 先找到要刪除的排隊項目
    const queueToRemove = await prisma.queue.findUnique({
      where: { id }
    })

    if (!queueToRemove) {
      return NextResponse.json(
        { error: '排隊項目不存在' },
        { status: 404 }
      )
    }

    // 標記為已移除而不是實際刪除，保持歷史記錄
    await prisma.queue.update({
      where: { id },
      data: { status: 'removed' }
    })

    // 重新整理其他排隊項目的位置
    await prisma.queue.updateMany({
      where: {
        eventId: queueToRemove.eventId,
        position: { gt: queueToRemove.position },
        status: { not: 'removed' }
      },
      data: {
        position: { decrement: 1 }
      }
    })

    return NextResponse.json({
      success: true,
      message: '已從排隊中移除'
    })

  } catch (error) {
    console.error('移除排隊時發生錯誤:', error)
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: '排隊ID為必填' },
        { status: 400 }
      )
    }

    const updatedQueue = await prisma.queue.update({
      where: { id },
      data: {
        status: body.status,
        startedAt: body.startedAt ? new Date(body.startedAt) : undefined,
        extendedTime: body.extendedTime
      }
    })

    return NextResponse.json({
      success: true,
      queue: {
        ...updatedQueue,
        joinedAt: updatedQueue.joinedAt.toISOString(),
        startedAt: updatedQueue.startedAt?.toISOString() || null
      }
    })

  } catch (error) {
    console.error('更新排隊狀態時發生錯誤:', error)
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}