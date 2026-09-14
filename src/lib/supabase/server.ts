import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const fallbackUrl = 'https://placeholder-project.supabase.co'
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.placeholder'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || fallbackUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || fallbackKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll is called from a Server Component where cookies
            // cannot be set. This can safely be ignored if middleware
            // is refreshing user sessions.
          }
        },
      },
    }
  )
}
