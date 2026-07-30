import { existsSync, readFileSync } from 'node:fs'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { devApi } from './server/devApi.js'

/**
 * Reports where a credential actually came from.
 *
 * Vite's `loadEnv(mode, cwd, '')` merges `.env` values *and* matching
 * `process.env` entries, so a shell-exported key is used even with no `.env`
 * file. That's convenient and easy to be surprised by — with two keys around you
 * can bill an org you didn't intend to — so the dev server names the winner at
 * startup.
 *
 * Must compare resolved values rather than just looking for the key name: a
 * `.env` line like `ANTHROPIC_API_KEY=` (present but empty) is a real case here,
 * and a substring check on the file would wrongly credit `.env` while the shell
 * is doing the work.
 */
function credentialSource(name, resolvedValue, envFileText) {
  if (!resolvedValue) return 'not set'
  const match = envFileText?.match(new RegExp(`^\\s*${name}\\s*=\\s*(.*)$`, 'm'))
  const fromFile = match?.[1]?.trim().replace(/^["']|["']$/g, '')
  if (fromFile) return '.env'
  if (process.env[name]) return 'shell environment'
  return 'unknown source'
}

export default defineConfig(({ mode }) => {
  // Third arg '' loads every var, not just VITE_-prefixed ones. None of these
  // are VITE_-prefixed, so Vite will not inline them into the client bundle —
  // they are only ever read here, in Node.
  const env = loadEnv(mode, process.cwd(), '')
  const envFileText = existsSync('.env') ? readFileSync('.env', 'utf8') : null

  return {
    plugins: [
      react(),
      devApi({
        anthropic: {
          apiKey: env.ANTHROPIC_API_KEY,
          model: env.ANTHROPIC_MODEL,
          maxTokens: env.ANTHROPIC_MAX_TOKENS,
          keySource: credentialSource('ANTHROPIC_API_KEY', env.ANTHROPIC_API_KEY, envFileText),
        },
        livekit: {
          url: env.LIVEKIT_URL,
          apiKey: env.LIVEKIT_API_KEY,
          apiSecret: env.LIVEKIT_API_SECRET,
          keySource: credentialSource('LIVEKIT_API_SECRET', env.LIVEKIT_API_SECRET, envFileText),
        },
      }),
    ],
    server: { port: 5173 },
  }
})
