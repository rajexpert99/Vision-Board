import { createBrowserClient } from '@supabase/ssr'

const fallbackUrl = 'https://placeholder-project.supabase.co'
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.placeholder'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || fallbackUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || fallbackKey
  )
}
