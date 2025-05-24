
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // This is to ensure JSON files can be imported correctly for i18n
    config.module.rules.push({
      test: /\.json$/,
      use: 'json-loader',
      type: 'javascript/auto'
    });

    return config;
  },
};

export default nextConfig;
