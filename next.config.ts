import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  // your existing config options here
};


const withPWA = require('next-pwa')({
  dest: 'public'
})

module.exports = withPWA({
  // next.js config
})

