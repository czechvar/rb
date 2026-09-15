import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'
import legacyRedirectDecisions from './src/lib/legacy-redirect-decisions.json'

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
    return [
      // Draft legacy Events with a live, populated category listing.
      ...Object.entries(legacyRedirectDecisions.temporaryEventCategoryRedirects).map(([from, category]) => ({
        source: `/event/${from}`,
        destination: `/trips?category=${category}`,
        permanent: false,
      })),
      // Missing Guide records return to the team index instead of a 404 detail.
      ...legacyRedirectDecisions.missingTeamMemberSlugs.map((slug) => ({
        source: `/team-member/${slug}`,
        destination: '/team',
        permanent: true,
      })),
      // Existing Guides keep their old suffix slugs; generic rule comes last.
      { source: '/team-member/:slug', destination: '/team/:slug', permanent: true },
      { source: '/team-member', destination: '/team', permanent: true },
      // Old-site /location/* redirects to /destinations/*.
      { source: '/location/:slug', destination: '/destinations/:slug', permanent: true },
      { source: '/location', destination: '/destinations', permanent: true },
      { source: '/terms', destination: '/terms-and-conditions', permanent: true },
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
