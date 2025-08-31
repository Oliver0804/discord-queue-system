import { NextRequest, NextResponse } from 'next/server'
import { QueueService } from '@/lib/db'
import { JoinQueueData } from '@/types'
import { supabase } from '@/lib/supabase'

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
    // body.eventId 是真正的 event ID，不是分享碼
    const { data: event, error } = await supabase
      .from('Event')
      .select('*')
      .eq('id', body.eventId)
      .single()

    if (error || !event) {
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
    const existingQueue = await QueueService.checkUserInQueue(event.id, body.discordId)

    if (existingQueue) {
      return NextResponse.json(
        { error: '您已經在排隊中了' },
        { status: 400 }
      )
    }

    // 取得下一個位置
    const newPosition = await QueueService.getNextPosition(event.id)

    const queue = await QueueService.create({
      eventId: event.id,
      discordId: body.discordId,
      position: newPosition
    })

    return NextResponse.json({
      success: true,
      queue
    })

  } catch (error) {
    console.error('加入排隊時發生錯誤:', error)
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}