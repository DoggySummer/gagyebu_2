/**
 * DB 스키마 타입. 클라이언트와 서버가 함께 쓴다.
 *
 * 원래는 Supabase CLI가 생성한다.
 *   npx supabase login
 *   npx supabase gen types typescript --project-id <project-ref> > frontend/shared/database.types.ts
 *
 * CLI 인증이 아직 안 돼 있어 현재 파일은 손으로 작성했고, 실제 DB의 컬럼 구성과
 * 대조해 맞춘 상태다. 위 명령을 돌릴 수 있게 되면 통째로 교체하고, 그 뒤로는
 * 직접 수정하지 않는다.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      daily_entries: {
        Row: {
          id: string
          user_id: string
          entry_date: string
          mood_score: number | null
          gratitude: string | null
          note_markdown: string | null
          is_favorite: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          entry_date: string
          mood_score?: number | null
          gratitude?: string | null
          note_markdown?: string | null
          is_favorite?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          entry_date?: string
          mood_score?: number | null
          gratitude?: string | null
          note_markdown?: string | null
          is_favorite?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      monthly_reviews: {
        Row: {
          id: string
          user_id: string
          month: string
          note_markdown: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month: string
          note_markdown?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month?: string
          note_markdown?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      inbody_records: {
        Row: {
          id: string
          user_id: string
          measured_at: string
          weight: number
          skeletal_muscle_mass: number | null
          body_fat_mass: number | null
          body_fat_percentage: number | null
          waist_hip_ratio: number | null
          visceral_fat_level: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          measured_at: string
          weight: number
          skeletal_muscle_mass?: number | null
          body_fat_mass?: number | null
          body_fat_percentage?: number | null
          waist_hip_ratio?: number | null
          visceral_fat_level?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          measured_at?: string
          weight?: number
          skeletal_muscle_mass?: number | null
          body_fat_mass?: number | null
          body_fat_percentage?: number | null
          waist_hip_ratio?: number | null
          visceral_fat_level?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      work_screens: {
        Row: {
          id: string
          user_id: string
          title: string
          summary: string | null
          unknown_terms: string | null
          edge_cases: string | null
          deadline: string | null
          /** generated column. coalesce(deadline, 'infinity') — 커서 페이지네이션 전용, 화면에 노출하지 않는다 */
          sort_key: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          summary?: string | null
          unknown_terms?: string | null
          edge_cases?: string | null
          deadline?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          summary?: string | null
          unknown_terms?: string | null
          edge_cases?: string | null
          deadline?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      work_flows: {
        Row: {
          id: string
          user_id: string
          screen_id: string
          sort_order: number
          description: string
          is_done: boolean
          done_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          screen_id: string
          sort_order: number
          description: string
          is_done?: boolean
          done_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          screen_id?: string
          sort_order?: number
          description?: string
          is_done?: boolean
          done_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          entry_date: string
          amount: number
          category: string
          memo: string
          payment_method: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          entry_date: string
          amount: number
          category: string
          memo: string
          payment_method?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          entry_date?: string
          amount?: number
          category?: string
          memo?: string
          payment_method?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          institution: string | null
          category: string
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          institution?: string | null
          category: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          institution?: string | null
          category?: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      net_worth_snapshots: {
        Row: {
          id: string
          user_id: string
          month: string
          asset_total: number
          liability_total: number
          net_worth: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month: string
          asset_total?: number
          liability_total?: number
          net_worth?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month?: string
          asset_total?: number
          liability_total?: number
          net_worth?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      monthly_settings: {
        Row: {
          id: string
          user_id: string
          month: string
          income: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month: string
          income?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month?: string
          income?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      fixed_expenses: {
        Row: {
          id: string
          user_id: string
          month: string
          category: string
          amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month: string
          category: string
          amount?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month?: string
          category?: string
          amount?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type PublicTables = Database['public']['Tables']

export type Tables<T extends keyof PublicTables> = PublicTables[T]['Row']
export type TablesInsert<T extends keyof PublicTables> = PublicTables[T]['Insert']
export type TablesUpdate<T extends keyof PublicTables> = PublicTables[T]['Update']
