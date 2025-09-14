import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'node:path';

const r = (p: string) => path.resolve(__dirname, p);

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
  },
  resolve: { alias: [] },
});
