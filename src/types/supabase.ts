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
      user_profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          role: 'user' | 'agent' | 'admin' | 'superadmin'
          status: 'active' | 'inactive' | 'suspended'
          avatar_url: string | null
          company: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          phone?: string | null
          role?: 'user' | 'agent' | 'admin' | 'superadmin'
          status?: 'active' | 'inactive' | 'suspended'
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          role?: 'user' | 'agent' | 'admin' | 'superadmin'
          status?: 'active' | 'inactive' | 'suspended'
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'user' | 'agent' | 'admin' | 'superadmin'
      user_status: 'active' | 'inactive' | 'suspended'
    }
  }
}