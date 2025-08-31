import { NextRequest, NextResponse } from 'next/server'
import { EventService } from '@/lib/db'

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
    const result = await EventService.findByCodeWithAuth(code)

    if (!result.event) {
      return NextResponse.json(
        { error: '找不到該活動' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      event: result.event,
      isHost: result.isHost
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
    const event = await EventService.findByCode(code)

    if (!event || event.hostCode !== code) {
      return NextResponse.json(
        { error: '無權限或活動不存在' },
        { status: 404 }
      )
    }

    const updatedEvent = await EventService.update(event.id, {
      status: body.status,
      name: body.name,
      description: body.description,
      speakTime: body.speakTime
    })

    return NextResponse.json({
      success: true,
      event: updatedEvent
    })

  } catch (error) {
    console.error('更新活動時發生錯誤:', error)
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}