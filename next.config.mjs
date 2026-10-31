import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // A lockfile exists in a parent directory; keep tracing scoped to this project.
  outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)),
  // Required by WalletConnect / AppKit (optional deps that should not be bundled).
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    // Optional x402 peers of @coinbase/cdp-sdk (via the Base Account connector).
    // Lugia doesn't use x402 payments, so resolve them to empty modules.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@x402/core': false,
      '@x402/evm': false,
      '@x402/extensions': false,
      '@x402/svm': false,
      // React Native-only import inside @metamask/sdk.
      '@react-native-async-storage/async-storage': false,
    };
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
