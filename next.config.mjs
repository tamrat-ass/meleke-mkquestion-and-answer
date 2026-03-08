/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  // Force rebuild - cache bust timestamp
  onDemandEntries: {
    maxInactiveAge: 1000,
    pagesBufferLength: 5,
  },
}

export default nextConfig
