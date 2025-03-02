import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3002,
    host: true,
    open: true,
    allowedHosts: [
      'thewarhammers.com' // Add this to allow the host
    ]
  },
  // Makes sure public directory assets can be loaded
  publicDir: 'public',
  // Enable asset loading
  assetsInclude: ['**/*.mp3'],
  // Base path for all assets
  base: '/',
  // Optimizations for production build
  optimizeDeps: {
    include: ['phaser']
  }
});
