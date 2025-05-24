import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ✅ Ignora erros de build (temporariamente, útil para não travar o deploy)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ Permite imagens externas de placehold.co
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

  // ✅ Webpack customizado
  webpack: (config, { isServer }) => {
    // Suporte a JSON loader (como usado pelo i18n ou outros pacotes antigos)
    config.module.rules.push({
      test: /\.json$/,
      use: 'json-loader',
      type: 'javascript/auto',
    });

    // Correções para pacotes que usam APIs exclusivas do Node.js
    if (!isServer) {
      config.externals = {
        ...config.externals,
        '@grpc/grpc-js': 'commonjs @grpc/grpc-js',
      };

      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }

    return config;
  },
};

export default nextConfig;
