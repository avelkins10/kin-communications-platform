import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',
    
    // Global test setup
    setupFiles: ['./tests/setup.ts'],
    
    // Test file patterns
    include: [
      'tests/**/*.{test,spec}.{js,ts,tsx}',
      'src/**/*.{test,spec}.{js,ts,tsx}'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'tests/e2e/**/*',
      'tests/playwright/**/*'
    ],
    
    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/**/*.{js,ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/*.stories.{js,ts,tsx}',
        '!src/**/*.test.{js,ts,tsx}',
        '!src/**/*.spec.{js,ts,tsx}'
      ],
      exclude: [
        'node_modules',
        'dist',
        '.next',
        'coverage',
        'tests',
        '**/*.config.{js,ts}',
        '**/*.setup.{js,ts}',
        'src/app/layout.tsx',
        'src/app/page.tsx',
        'src/app/globals.css'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // Global variables
    globals: true,
    
    // Mock configuration
    mockReset: true,
    restoreMocks: true,
    
    // Reporter configuration
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/index.html'
    },
    
    // Pool configuration for parallel testing
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false
      }
    },
    
    // Retry configuration
    retry: 2,
    
    // Watch mode configuration
    watch: false,
    
    // Environment variables for testing
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/kin_communications_test',
      NEXTAUTH_SECRET: 'test-secret-key-for-vitest',
      NEXTAUTH_URL: 'http://localhost:3000',
      TWILIO_ACCOUNT_SID: 'test-account-sid',
      TWILIO_AUTH_TOKEN: 'test-auth-token',
      TWILIO_PHONE_NUMBER: '+15551234567',
      TWILIO_WEBHOOK_URL: 'https://test.ngrok.io',
      QUICKBASE_REALM: 'test-realm',
      QUICKBASE_USER_TOKEN: 'test-user-token',
      QUICKBASE_APP_ID: 'test-app-id',
      SOCKET_IO_CORS_ORIGIN: 'http://localhost:3000'
    }
  },
  
  // Resolve configuration to match Next.js
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/lib': resolve(__dirname, './src/lib'),
      '@/types': resolve(__dirname, './src/types'),
      '@/app': resolve(__dirname, './src/app'),
      '@/pages': resolve(__dirname, './src/pages')
    }
  },
  
  // Define configuration for different test types
  define: {
    'process.env.NODE_ENV': '"test"'
  },
  
  // Esbuild configuration for faster builds
  esbuild: {
    target: 'node18'
  }
})
