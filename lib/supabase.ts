import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'

export const createClient = () => {
  return createBrowserSupabaseClient()
}
