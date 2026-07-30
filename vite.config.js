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
    server: {
      port: 5173,
      /**
       * Hosts permitted in the Host header. Vite rejects anything else to block
       * DNS-rebinding attacks against the dev server.
       *
       * Entries are hostnames, not URLs — no scheme and no path, since Vite
       * compares against the Host header, which carries neither.
       *
       * A leading dot means "that domain and all subdomains", which is what makes
       * this survive a tunnel restart: quick-tunnel hostnames are regenerated
       * every time `cloudflared` starts, so a single pinned hostname stops
       * matching the moment the tunnel comes back and the dev server starts
       * refusing requests for no visible reason.
       *
       * Worth understanding before widening this further: a tunnel is how the
       * demo gets a secure context on a second physical device, which
       * `getUserMedia` requires for the voice call. It also exposes this dev
       * server — which holds the API keys — to anyone with the URL, so bring the
       * tunnel up for a demo and take it down afterwards.
       */
      allowedHosts: ['.trycloudflare.com'],
    },
  }
})
