import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@petzone/shared', '@petzone/ui'],
}

export default nextConfig
