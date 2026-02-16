/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disabled to prevent socket double-connect issues
  // Enable if you need to connect to backend on different port during dev
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
      {
        source: '/socket.io/:path*',
        destination: 'http://localhost:3001/socket.io/:path*',
      },
    ];
  },
};

export default nextConfig;
