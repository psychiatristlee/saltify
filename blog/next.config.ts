import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Repo root has its own package-lock.json (root Playwright tooling), which makes
  // Next infer the monorepo root as the workspace root and misplace the standalone
  // output — breaking the Firebase App Hosting adapter. Pin the tracing root to blog/.
  outputFileTracingRoot: path.join(__dirname),
  async redirects() {
    return [
      // The old Japanese menu PDF listed a long-discontinued menu and could not
      // be displayed on phones. Links and QR codes pointing at it still exist.
      { source: '/Salt_Menu_JP_Full.pdf', destination: '/menu/jp', permanent: true },
      // hreflang uses "ja"; accept it alongside the historical /menu/jp and /ja.
      { source: '/menu/ja', destination: '/menu/jp', permanent: true },
      { source: '/jp', destination: '/ja', permanent: true },
    ];
  },
};

export default nextConfig;
