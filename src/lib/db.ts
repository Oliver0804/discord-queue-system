import { supabase } from './supabase'

// 事件相關操作
export class EventService {
  static async findByCode(code: string) {
    const { data, error } = await supabase
      .from('Event')
      .select(`
        *,
        queues:Queue(*)
      `)
      .or(`hostCode.eq.${code},shareCode.eq.${code}`)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    
    if (data && data.queues) {
      // 過濾非移除的排隊記錄並排序
      data.queues = data.queues
        .filter((q: any) => q.status !== 'removed')
        .sort((a: any, b: any) => a.position - b.position)
    }
    
    return data
  }

  static async findByCodeWithAuth(code: string) {
    const event = await this.findByCode(code)
    if (!event) return { event: null, isHost: false }
    
    return {
      event,
      isHost: event.hostCode === code
    }
  }

  static async create(data: any) {
    const { data: result, error } = await supabase
      .from('Event')
      .insert([{
        id: crypto.randomUUID(),
        name: data.name,
        description: data.description,
        speakTime: data.speakTime,
        hostCode: data.hostCode,
        shareCode: data.shareCode,
        status: data.status || 'preparing',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    return result
  }

  static async update(id: string, updates: any) {
    const { data: result, error } = await supabase
      .from('Event')
      .update({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return result
  }

  static async checkCodeExists(hostCode: string, shareCode: string) {
    const { data, error } = await supabase
      .from('Event')
      .select('id')
      .or(`hostCode.eq.${hostCode},shareCode.eq.${shareCode}`)
      .limit(1)
    
    if (error) throw error
    return data && data.length > 0
  }
}

// 排隊相關操作
export class QueueService {
  static async create(data: any) {
    const { data: result, error } = await supabase
      .from('Queue')
      .insert([{
        id: crypto.randomUUID(),
        eventId: data.eventId,
        discordId: data.discordId,
        position: data.position,
        status: data.status || 'waiting',
        joinedAt: new Date().toISOString(),
        startedAt: data.startedAt || null,
        extendedTime: data.extendedTime || 0
      }])
      .select()
      .single()
    
    if (error) throw error
    return result
  }

  static async update(id: string, updates: any) {
    const { data: result, error } = await supabase
      .from('Queue')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return result
  }

  static async delete(id: string) {
    const { error } = await supabase
      .from('Queue')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  static async findByEvent(eventId: string) {
    const { data, error } = await supabase
      .from('Queue')
      .select('*')
      .eq('eventId', eventId)
      .neq('status', 'removed')
      .order('position', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  static async getNextPosition(eventId: string) {
    const { data, error } = await supabase
      .from('Queue')
      .select('position')
      .eq('eventId', eventId)
      .neq('status', 'removed')
      .order('position', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return (data?.position || 0) + 1
  }

  static async reorder(eventId: string, queues: any[]) {
    // 批量更新位置
    const updates = queues.map((queue, index) => ({
      id: queue.id,
      position: index + 1
    }))

    for (const update of updates) {
      await this.update(update.id, { position: update.position })
    }
  }

  static async checkUserInQueue(eventId: string, discordId: string) {
    const { data, error } = await supabase
      .from('Queue')
      .select('*')
      .eq('eventId', eventId)
      .eq('discordId', discordId)
      .in('status', ['waiting', 'speaking'])
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  static async findById(id: string) {
    const { data, error } = await supabase
      .from('Queue')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  static async markAsRemoved(id: string) {
    const { data: result, error } = await supabase
      .from('Queue')
      .update({ status: 'removed' })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return result
  }

  static async adjustPositionsAfterRemoval(eventId: string, removedPosition: number) {
    // 取得所有需要調整的排隊記錄
    const { data: queues, error } = await supabase
      .from('Queue')
      .select('*')
      .eq('eventId', eventId)
      .gt('position', removedPosition)
      .neq('status', 'removed')
    
    if (error) throw error
    
    // 批量更新位置
    for (const queue of queues || []) {
      await this.update(queue.id, { position: queue.position - 1 })
    }
  }

  static async reorderBatch(eventId: string, queueItems: any[]) {
    // 為了避免唯一鍵衝突，分兩步執行：
    // 1. 先將所有位置設為很大的數字（臨時位置），避免與現有位置衝突
    const tempBase = 1000000 // 使用100萬作為基準
    for (let i = 0; i < queueItems.length; i++) {
      const item = queueItems[i]
      await this.update(item.id, { position: tempBase + i })
    }
    
    // 2. 再設定正確的位置
    for (const item of queueItems) {
      await this.update(item.id, { position: item.position })
    }
    
    // 回傳更新後的列表
    return await this.findByEvent(eventId)
  }
}