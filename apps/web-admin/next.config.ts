import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@petzone/shared', '@petzone/supabase', '@petzone/validators', '@petzone/ui'],
}

export default nextConfig
