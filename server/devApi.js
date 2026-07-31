/**
 * Vite plugin that mounts the API on the dev and preview servers.
 *
 * Deliberately thin. Every handler, guard, and default lives in server/api.js,
 * which knows nothing about Vite — so `npm run dev` and the production container
 * execute the same code. When these were one file, `npm run build` produced a
 * bundle with no API at all; keeping the plugin to plumbing is what stops that
 * recurring.
 */

import { createApiConfig, handleApiRequest, startupLines } from './api.js'

/**
 * @param {{
 *   anthropic?: { apiKey?: string, model?: string, maxTokens?: number, keySource?: string },
 *   livekit?: { url?: string, apiKey?: string, apiSecret?: string, keySource?: string },
 * }} env
 */
export function devApi(env = {}) {
  const config = createApiConfig(env)

  const attach = (server) => {
    server.middlewares.use((req, res, next) => {
      // Strip the query string before matching — API_ROUTES is an exact-path map.
      const pathname = (req.url || '').split('?')[0]
      handleApiRequest(req, res, config, pathname).then((handled) => {
        if (!handled) next()
      })
    })
  }

  return {
    name: 'auricle-dev-api',
    configureServer(server) {
      for (const [level, message] of startupLines(config)) {
        server.config.logger[level](`[auricle] ${message}`)
      }
      attach(server)
    },
    configurePreviewServer: attach,
  }
}
