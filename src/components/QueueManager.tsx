'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Queue, Event } from '@/types'
import { formatTimeWithTimezone } from '@/lib/utils'

interface QueueManagerProps {
  queues: Queue[]
  onStartSpeaking: (queueId: string) => void
  onRemove: (queueId: string) => void
  onCompleteSpeaking: (queueId: string) => void
  onReorder: (newQueues: Queue[]) => void
  eventStatus: Event['status']
}

export default function QueueManager({ 
  queues, 
  onStartSpeaking, 
  onRemove, 
  onCompleteSpeaking,
  onReorder,
  eventStatus 
}: QueueManagerProps) {
  const [, setDraggedId] = useState<string | null>(null)

  const waitingQueues = queues.filter(q => q.status === 'waiting').sort((a, b) => a.position - b.position)
  const speakingQueue = queues.find(q => q.status === 'speaking')
  const completedQueues = queues.filter(q => q.status === 'completed').sort((a, b) => a.position - b.position)

  const handleDragEnd = async (result: { source: any; destination: any; draggableId: string }) => {
    setDraggedId(null)
    
    if (!result.destination) return

    const sourceDroppableId = result.source.droppableId
    const destinationDroppableId = result.destination.droppableId

    // 處理拖曳邏輯
    let updatedWaitingQueues = [...waitingQueues]
    const updatedCompletedQueues = [...completedQueues]
    let itemToMove: Queue

    // 從來源移除項目
    if (sourceDroppableId === 'waiting-queue') {
      [itemToMove] = updatedWaitingQueues.splice(result.source.index, 1)
    } else if (sourceDroppableId === 'completed-queue') {
      [itemToMove] = updatedCompletedQueues.splice(result.source.index, 1)
    } else {
      return
    }

    // 將項目添加到目標位置
    if (destinationDroppableId === 'waiting-queue') {
      // 重新設定狀態和位置
      itemToMove = {
        ...itemToMove,
        status: 'waiting' as const,
        startedAt: null,
        extendedTime: 0
      }
      updatedWaitingQueues.splice(result.destination.index, 0, itemToMove)
      
      // 重新計算等待隊列的位置
      updatedWaitingQueues = updatedWaitingQueues.map((item, index) => ({
        ...item,
        position: index + 1
      }))
    } else if (destinationDroppableId === 'completed-queue') {
      // 如果從等待隊列拖到已完成（雖然不常見，但支援）
      itemToMove = {
        ...itemToMove,
        status: 'completed' as const
      }
      updatedCompletedQueues.splice(result.destination.index, 0, itemToMove)
    }

    // 更新本地狀態
    const allQueues = [
      ...updatedWaitingQueues,
      ...(speakingQueue ? [speakingQueue] : []),
      ...updatedCompletedQueues
    ]
    onReorder(allQueues)

    // 發送到後端更新
    try {
      const updatePromises = []
      
      // 更新狀態變更的項目
      updatePromises.push(
        fetch(`/api/queue/${itemToMove.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: itemToMove.status,
            startedAt: itemToMove.startedAt,
            extendedTime: itemToMove.extendedTime
          })
        })
      )

      // 如果有等待隊列項目需要重新排序
      if (updatedWaitingQueues.length > 0) {
        updatePromises.push(
          fetch('/api/queue/reorder', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventId: updatedWaitingQueues[0].eventId,
              queueItems: updatedWaitingQueues.map(q => ({ id: q.id, position: q.position }))
            })
          })
        )
      }

      const responses = await Promise.all(updatePromises)
      
      // 檢查是否有錯誤
      for (const response of responses) {
        if (!response.ok) {
          const errorData = await response.text()
          console.error('更新失敗:', response.status, errorData)
        }
      }
    } catch (err) {
      console.error('拖曳更新失敗:', err)
    }
  }

  const handleDragStart = (result: { draggableId: string }) => {
    setDraggedId(result.draggableId)
  }

  const QueueItem = ({ queue, index, isDragging }: { queue: Queue; index?: number; isDragging?: boolean }) => {
    // 檢查是否有人正在發言
    const isSomeoneSeaking = speakingQueue !== undefined
    
    return (
      <div className={`bg-white border rounded-lg p-4 ${
        isDragging ? 'shadow-lg rotate-2 scale-105' : 'shadow-sm hover:shadow-md'
      } transition-all duration-200`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              {index !== undefined && (
                <span className="bg-blue-100 text-blue-800 text-sm font-bold px-2 py-1 rounded">
                  #{index + 1}
                </span>
              )}
              <div>
                <p className="font-medium text-gray-800">{queue.discordId}</p>
                <p className="text-sm text-gray-500">
                  加入時間：{formatTimeWithTimezone(queue.joinedAt)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {queue.status === 'waiting' && eventStatus === 'active' && (
              <button
                onClick={() => onStartSpeaking(queue.id)}
                disabled={isSomeoneSeaking}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  isSomeoneSeaking 
                    ? 'bg-gray-400 cursor-not-allowed text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                title={isSomeoneSeaking ? '有人正在發言中，請稍後' : '開始發言'}
              >
                開始發言
              </button>
            )}
            
            <button
              onClick={() => onRemove(queue.id)}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium"
            >
              移除
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">排隊管理</h2>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          等待中：{waitingQueues.length}
        </span>
      </div>

      {/* 目前發言中 */}
      {speakingQueue && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-green-700 mb-2 flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            目前發言中
          </h3>
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-800">{speakingQueue.discordId}</p>
                <p className="text-sm text-green-600">
                  開始時間：{speakingQueue.startedAt ? formatTimeWithTimezone(speakingQueue.startedAt) : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onCompleteSpeaking(speakingQueue.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium"
                >
                  結束發言
                </button>
                <button
                  onClick={() => onRemove(speakingQueue.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium"
                >
                  移除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        {/* 等待隊列 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">等待隊列</h3>
          
          <Droppable droppableId="waiting-queue">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`space-y-3 min-h-[100px] ${
                  snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg p-2' : ''
                } ${waitingQueues.length === 0 ? 'border-2 border-dashed border-gray-300' : ''}`}
              >
                {waitingQueues.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-lg">還沒有人排隊</p>
                    <p className="text-sm">分享連結讓觀眾加入吧！</p>
                    <p className="text-xs mt-2 text-gray-400">可將已完成的項目拖到這裡重新排隊</p>
                  </div>
                ) : (
                  waitingQueues.map((queue, index) => (
                    <Draggable key={queue.id} draggableId={queue.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="cursor-move"
                        >
                          <QueueItem 
                            queue={queue} 
                            index={index}
                            isDragging={snapshot.isDragging}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* 已完成列表 */}
        {completedQueues.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
              已完成發言
              <span className="text-sm text-gray-500 ml-2 font-normal">（可拖回等待列表進行第二輪）</span>
            </h3>
            <Droppable droppableId="completed-queue">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`space-y-2 max-h-60 overflow-y-auto min-h-[50px] ${
                    snapshot.isDraggingOver ? 'bg-green-50 rounded-lg p-2' : ''
                  }`}
                >
                  {completedQueues.map((queue, index) => (
                    <Draggable key={queue.id} draggableId={queue.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`cursor-move bg-gray-50 border rounded-lg p-3 ${
                            snapshot.isDragging ? 'opacity-100 shadow-lg' : 'opacity-75 hover:opacity-100'
                          } transition-all duration-200`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-700">{queue.discordId}</p>
                              <p className="text-sm text-gray-500">已完成發言</p>
                            </div>
                            <span className="text-green-600 text-sm">✓</span>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        )}
      </DragDropContext>

      {/* 操作提示 */}
      {waitingQueues.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 提示：拖曳排隊項目可以調整順序，點擊「開始發言」讓下一位開始發言
          </p>
        </div>
      )}
    </div>
  )
}