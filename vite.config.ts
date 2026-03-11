/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/permissions'],
      outDir: 'dist',
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/permissions/main.ts'),
      name: 'CexPermissions',
      formats: ['es', 'umd'],
      fileName: (format) => `index.${format === 'es' ? 'es' : 'umd'}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    outDir: 'dist',
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    exclude: ['**/node_modules/**', '**/dist/**', '**/src/permissions/examples/**'],
    coverage: {
      provider: "v8",
      reporter: ['clover', 'lcov', 'text', 'json', 'html'],
      all: true,
      include: ['src'],
      exclude: [
        'src/permissions/examples/**',
        'src/permissions/main.ts',
        'src/permissions/context/**',
        'src/permissions/core/types.ts',
        'src/permissions/hierarchical/hierarchical.ts',
        'src/permissions/hierarchical/useHierarchicalPermissions.ts',
      ],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
    restoreMocks: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
