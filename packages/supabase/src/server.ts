import { createServerClient as _createServerClient, type CookieOptions } from '@supabase/ssr'
import type { Database } from './types'

type CookiePair = { name: string; value: string }
type CookieToSet = { name: string; value: string; options: CookieOptions }

export function createServerClient(
  getAllCookies: () => CookiePair[],
  setAllCookies?: (cookies: CookieToSet[]) => void
) {
  return _createServerClient<Database>(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        getAll: () => getAllCookies(),
        setAll: setAllCookies,
      },
    }
  )
}
