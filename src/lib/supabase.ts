import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
)

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== 'https://placeholder.supabase.co' && 
    supabaseAnonKey !== 'placeholder-key')
}

// Types for our database
export interface Lead {
  id: string
  first_name: string
  website_url: string
  email: string
  created_at: string
  updated_at: string
  status: 'new' | 'pending' | 'analyzed' | 'contacted' | 'closed'
  analysis_sent: boolean
  analysis_content?: string
  analysis_sent_at?: string
}

export interface LeadInsert {
  first_name: string
  website_url: string
  email: string
}

// RPC function parameters
export interface NotifyNewLeadParams {
  first_name: string
  email: string  
  website_url: string
}