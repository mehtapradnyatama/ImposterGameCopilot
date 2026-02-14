export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          avatar_url: string | null
          total_points: number
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          total_points?: number
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          total_points?: number
          created_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          code: string
          host_id: string
          topic: string
          min_players: number
          max_players: number
          round_timer: number
          status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED'
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          host_id: string
          topic: string
          min_players?: number
          max_players?: number
          round_timer?: number
          status?: 'WAITING' | 'IN_PROGRESS' | 'FINISHED'
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          host_id?: string
          topic?: string
          min_players?: number
          max_players?: number
          round_timer?: number
          status?: 'WAITING' | 'IN_PROGRESS' | 'FINISHED'
          created_at?: string
        }
      }
      room_participants: {
        Row: {
          id: string
          room_id: string
          user_id: string
          is_imposter: boolean
          points: number
          joined_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          is_imposter?: boolean
          points?: number
          joined_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          is_imposter?: boolean
          points?: number
          joined_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          room_id: string
          user_id: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          message?: string
          created_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          room_id: string
          voter_id: string
          voted_for_id: string
          round_number: number
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          voter_id: string
          voted_for_id: string
          round_number?: number
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          voter_id?: string
          voted_for_id?: string
          round_number?: number
          created_at?: string
        }
      }
      game_rounds: {
        Row: {
          id: string
          room_id: string
          round_number: number
          word: string
          imposter_id: string
          status: 'DISCUSSION' | 'VOTING' | 'FINISHED'
          started_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          room_id: string
          round_number: number
          word: string
          imposter_id: string
          status?: 'DISCUSSION' | 'VOTING' | 'FINISHED'
          started_at?: string
          ended_at?: string | null
        }
        Update: {
          id?: string
          room_id?: string
          round_number?: number
          word?: string
          imposter_id?: string
          status?: 'DISCUSSION' | 'VOTING' | 'FINISHED'
          started_at?: string
          ended_at?: string | null
        }
      }
    }
  }
}

export type User = Database['public']['Tables']['users']['Row']
export type Room = Database['public']['Tables']['rooms']['Row']
export type RoomParticipant = Database['public']['Tables']['room_participants']['Row']
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']
export type GameRound = Database['public']['Tables']['game_rounds']['Row']
