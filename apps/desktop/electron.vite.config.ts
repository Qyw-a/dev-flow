import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const workspacePackages = ['@branch-manager/git-core', '@branch-manager/shared']

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: workspacePackages })],
    build: {
      lib: {
        entry: 'src/main/index.ts',
        formats: ['cjs'],
        fileName: () => '[name].js'
      },
      outDir: 'out/main'
    },
    resolve: {
      alias: {
        '@main': path.resolve(__dirname, 'src/main'),
        '@branch-manager/git-core': path.resolve(__dirname, '../../packages/git-core/src/index.ts'),
        '@branch-manager/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin({ exclude: workspacePackages })],
    build: {
      lib: {
        entry: 'src/preload/index.ts',
        formats: ['cjs'],
        fileName: () => '[name].js'
      },
      outDir: 'out/preload'
    },
    resolve: {
      alias: {
        '@branch-manager/git-core': path.resolve(__dirname, '../../packages/git-core/src/index.ts'),
        '@branch-manager/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts')
      }
    }
  },
  renderer: {
    root: '.',
    build: {
      outDir: 'out/renderer',
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, 'index.html')
        }
      }
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@renderer': path.resolve(__dirname, 'src/renderer'),
        '@branch-manager/git-core': path.resolve(__dirname, '../../packages/git-core/src/index.ts'),
        '@branch-manager/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts')
      }
    }
  }
})
