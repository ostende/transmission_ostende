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
      shows: {
        Row: {
          id: string
          imdb_id: string
          title: string | null
          overview: string | null
          backdrop_url: string | null
          poster_url: string | null
          logo_url: string | null
          media_type: 'tv' | 'movie' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          imdb_id: string
          title?: string | null
          overview?: string | null
          backdrop_url?: string | null
          poster_url?: string | null
          logo_url?: string | null
          media_type?: 'tv' | 'movie' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          imdb_id?: string
          title?: string | null
          overview?: string | null
          backdrop_url?: string | null
          poster_url?: string | null
          logo_url?: string | null
          media_type?: 'tv' | 'movie' | null
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
      [_ in never]: never
    }
  }
}