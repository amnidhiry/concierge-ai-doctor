import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { anthropicProxy } from './server/anthropicProxy.js'

export default defineConfig(({ mode }) => {
  // Third arg '' loads every var, not just VITE_-prefixed ones. ANTHROPIC_API_KEY
  // is deliberately unprefixed so Vite will not inline it into the client
  // bundle — it is only ever read here, in Node.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      anthropicProxy({
        apiKey: env.ANTHROPIC_API_KEY,
        model: env.ANTHROPIC_MODEL,
        maxTokens: env.ANTHROPIC_MAX_TOKENS,
      }),
    ],
    server: { port: 5173 },
  }
})
