import path from 'node:path';
import { fileURLToPath } from 'node:url';
// eslint-disable-next-line import/no-unresolved -- Provided by vitest
import { defineConfig } from 'vitest/config';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export default defineConfig({
    test: {
        environment: 'jsdom',
        reporters: ['default'],
        coverage: {
            reporter: ['text', 'lcov'],
            provider: 'v8',
        },
    },
    resolve: {
        alias: {
            '@domain': path.resolve(__dirname, 'src/domain'),
            '@store': path.resolve(__dirname, 'src/store'),
            '@persistence': path.resolve(__dirname, 'src/persistence'),
            '@ui': path.resolve(__dirname, 'src/ui'),
        },
    },
});
