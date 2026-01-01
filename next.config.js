/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ESLint'i build sırasında ignore et (sadece production build için)
  eslint: {
    // Warning: Bu production'da ESLint kontrolünü devre dışı bırakır
    // Geliştirme sırasında hala ESLint çalışacak
    ignoreDuringBuilds: true,
  },
  // TypeScript hatalarını da ignore et (opsiyonel)
  typescript: {
    // ignoreBuildErrors: true, // Gerekirse açın
  },
  webpack: (config, { isServer }) => {
    // Fix for webpack chunk loading issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig

