import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? process.env['SUPABASE_URL'] ?? ''
const supabaseAnonKey =
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? process.env['SUPABASE_ANON_KEY'] ?? ''

export const createBrowserClient = () =>
  createClient<Database>(supabaseUrl, supabaseAnonKey)

let _browserClient: ReturnType<typeof createBrowserClient> | null = null
export const getBrowserClient = () => {
  if (!_browserClient) _browserClient = createBrowserClient()
  return _browserClient
}
