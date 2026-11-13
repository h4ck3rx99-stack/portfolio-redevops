import path from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig = {
    // The repo also holds the four tool apps, each with its own lockfile.
    turbopack: { root: path.resolve('.') },
};
export default nextConfig;
