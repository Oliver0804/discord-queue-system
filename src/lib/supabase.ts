import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      Event: {
        Row: {
          id: string
          name: string
          description: string | null
          speakTime: number
          hostCode: string
          shareCode: string
          status: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          speakTime: number
          hostCode: string
          shareCode: string
          status?: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          speakTime?: number
          hostCode?: string
          shareCode?: string
          status?: string
          createdAt?: string
          updatedAt?: string
        }
      }
      Queue: {
        Row: {
          id: string
          eventId: string
          discordId: string
          position: number
          status: string
          joinedAt: string
          startedAt: string | null
          extendedTime: number
        }
        Insert: {
          id?: string
          eventId: string
          discordId: string
          position: number
          status?: string
          joinedAt?: string
          startedAt?: string | null
          extendedTime?: number
        }
        Update: {
          id?: string
          eventId?: string
          discordId?: string
          position?: number
          status?: string
          joinedAt?: string
          startedAt?: string | null
          extendedTime?: number
        }
      }
    }
  }
}