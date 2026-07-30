import { existsSync, readFileSync } from 'node:fs'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { anthropicProxy } from './server/anthropicProxy.js'

export default defineConfig(({ mode }) => {
  // Third arg '' loads every var, not just VITE_-prefixed ones. ANTHROPIC_API_KEY
  // is deliberately unprefixed so Vite will not inline it into the client
  // bundle — it is only ever read here, in Node.
  //
  // Note: loadEnv also merges matching process.env entries, so an
  // ANTHROPIC_API_KEY exported in your shell is picked up even with no .env
  // file present. That's convenient but easy to be surprised by — if two keys
  // exist you may not be billing the org you think you are. The proxy logs
  // which source won at startup; `.env` takes precedence.
  const env = loadEnv(mode, process.cwd(), '')
  const keySource = existsSync('.env') && readFileSync('.env', 'utf8').includes('ANTHROPIC_API_KEY=')
    ? '.env'
    : process.env.ANTHROPIC_API_KEY
      ? 'shell environment'
      : null

  return {
    plugins: [
      react(),
      anthropicProxy({
        apiKey: env.ANTHROPIC_API_KEY,
        model: env.ANTHROPIC_MODEL,
        maxTokens: env.ANTHROPIC_MAX_TOKENS,
        keySource,
      }),
    ],
    server: { port: 5173 },
  }
})
