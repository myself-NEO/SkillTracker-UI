import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Tests of the content build and the framework-free libraries (tools/tests), run in Node.
// The Angular components' tests run separately, through `ng test` (angular.json).
const root = path.resolve(import.meta.dirname, '..');

export default defineConfig({
  root,
  resolve: {
    alias: {
      '@lib': path.join(root, 'src/lib'),
      '@content': path.join(root, 'content'),
    },
  },
  test: {
    include: ['tools/tests/**/*.test.ts'],
    environment: 'node',
  },
});
