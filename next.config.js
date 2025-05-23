const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: false,
  buildExcludes: [/app-build-manifest.json$/],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [],
  },
  experimental: {
    turbo: {
      rules: {
        // Configure Turbopack rules here if needed
      },
    },
  },
}

module.exports = withPWA(nextConfig) 