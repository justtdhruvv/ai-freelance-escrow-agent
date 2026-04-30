import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Proxy all Express backend routes through Next.js.
  // Browser only ever talks to Next.js (same origin — no CORS, one public URL).
  // BACKEND_URL is a server-side runtime env var, never exposed to the browser.
  async rewrites() {
    const backend = process.env.BACKEND_URL || "http://localhost:3000";
    return [
      { source: "/auth/:path*",        destination: `${backend}/auth/:path*` },
      { source: "/projects/:path*",    destination: `${backend}/projects/:path*` },
      { source: "/payments/:path*",    destination: `${backend}/payments/:path*` },
      { source: "/wallet/:path*",      destination: `${backend}/wallet/:path*` },
      { source: "/sops/:path*",        destination: `${backend}/sops/:path*` },
      { source: "/submissions/:path*", destination: `${backend}/submissions/:path*` },
      { source: "/disputes/:path*",    destination: `${backend}/disputes/:path*` },
      { source: "/users/:path*",       destination: `${backend}/users/:path*` },
      { source: "/clients/:path*",     destination: `${backend}/clients/:path*` },
      { source: "/ai/:path*",          destination: `${backend}/ai/:path*` },
      { source: "/health",             destination: `${backend}/health` },
    ];
  },
};

export default nextConfig;
