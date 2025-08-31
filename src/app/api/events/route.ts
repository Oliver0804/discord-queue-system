import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateCode } from '@/lib/utils'
import { CreateEventData } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: CreateEventData = await request.json()
    
    // 驗證必要欄位
    if (!body.name || !body.speakTime) {
      return NextResponse.json(
        { error: '活動名稱和發言時間為必填欄位' },
        { status: 400 }
      )
    }

    // 生成唯一的主持人碼和分享碼
    let hostCode, shareCode
    let isUnique = false
    
    while (!isUnique) {
      hostCode = generateCode()
      shareCode = generateCode()
      
      // 檢查碼是否已存在
      const existingEvent = await prisma.event.findFirst({
        where: {
          OR: [
            { hostCode },
            { shareCode }
          ]
        }
      })
      
      if (!existingEvent) {
        isUnique = true
      }
    }

    const event = await prisma.event.create({
      data: {
        name: body.name,
        description: body.description,
        speakTime: body.speakTime,
        hostCode: hostCode!,
        shareCode: shareCode!,
      }
    })

    return NextResponse.json({
      success: true,
      event: {
        ...event,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('建立活動時發生錯誤:', error)
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}