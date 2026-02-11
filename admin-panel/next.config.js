const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Avoid workspace-root inference warnings when multiple lockfiles exist.
  outputFileTracingRoot: path.join(__dirname),
};
module.exports = nextConfig;
