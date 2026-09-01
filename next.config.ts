import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
      {
        pathname: '/**',
      },
    ],
  },
  async headers() {
    // See src/app/robots.ts: beta.rockbusters.net is a production deployment of
    // devel, so only an explicit flag can distinguish it from the live site.
    // Until SITE_INDEXABLE is set, every deployment is duplicate content
    // competing with rockbusters.net and must stay out of the index.
    if (process.env.SITE_INDEXABLE === 'true') return []

    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },
  async redirects() {
    // Old-site /team-member/* slugs that don't map 1:1 to the new clean slugs.
    // Source of truth: the live-site inventory in
    // docs/superpowers/specs/2026-06-11-team-pages-design.md.
    const teamMemberMap: Record<string, string> = {
      'daila-ojeda-pro-climber': 'daila-ojeda',
      'adam-ondra-pro-climber': 'adam-ondra',
      'patxi-usobiaga-pro-climber': 'patxi-usobiaga',
      'pablo-scorza-fyziotherapist-biomechanica-funcional': 'pablo-scorza',
    }
    return [
      ...Object.entries(teamMemberMap).map(([from, to]) => ({
        source: `/team-member/${from}`,
        destination: `/team/${to}`,
        permanent: true,
      })),
      // Generic rule MUST come after the explicit map.
      { source: '/team-member/:slug', destination: '/team/:slug', permanent: true },
      { source: '/team-member', destination: '/team', permanent: true },
      // Old-site /location/* redirects to /destinations/*.
      { source: '/location/:slug', destination: '/destinations/:slug', permanent: true },
      { source: '/location', destination: '/destinations', permanent: true },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
