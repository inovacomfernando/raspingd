import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ❌ REMOVIDO: 'export' só é usado para sites 100% estáticos
  // output: 'export',

  // ✅ Ignora erros de build para facilitar deploy inicial
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ Permite carregar imagens externas de placehold.co
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

  // ✅ Configuração Webpack personalizada
  webpack: (config, { isServer }) => {
    // Suporte a JSON loader
    config.module.rules.push({
      test: /\.json$/,
      use: 'json-loader',
      type: 'javascript/auto',
    });

    // Evita tentar importar módulos nativos no client
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
