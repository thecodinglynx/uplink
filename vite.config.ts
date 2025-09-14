import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Recreate __dirname for ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const slash = (p: string) => p.replace(/\\/g, '/');
const srcRoot = slash(path.resolve(__dirname, 'src'));

const r = (p: string) => path.resolve(__dirname, p);

export default defineConfig({
  plugins: [react()],
  build: { sourcemap: true },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
});
