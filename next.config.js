/* const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: false,
  buildExcludes: [/app-build-manifest.json$/],
}) */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // experimental: {
  //   turbo: {
  //     rules: {
  //       // Configure Turbopack rules here if needed
  //     },
  //   },
  // },
}

module.exports = nextConfig // Directly export nextConfig, bypassing withPWA for now 