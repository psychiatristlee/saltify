import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Repo root has its own package-lock.json (root Playwright tooling), which makes
  // Next infer the monorepo root as the workspace root and misplace the standalone
  // output — breaking the Firebase App Hosting adapter. Pin the tracing root to blog/.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
