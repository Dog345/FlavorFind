/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'img.sndimg.com' },
      { protocol: 'https', hostname: 'api.flavorfind.co.ke' },
    ],
  },
}

module.exports = nextConfig
