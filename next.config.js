/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  buildExcludes: [/middleware-manifest\.json$/],
})

const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'fatura-mais.pt', 'www.fatura-mais.pt'],
    },
  },
}

module.exports = withPWA(nextConfig)
