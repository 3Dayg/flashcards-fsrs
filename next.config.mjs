/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@electric-sql/pglite', 'pg'],
  // identity.ts imports ./identity.dev.js; map that to the TypeScript sibling.
  turbopack: {
    resolveAlias: {
      './identity.dev.js': './identity.dev.ts',
    },
  },
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    }
    return config
  },
}

export default nextConfig
