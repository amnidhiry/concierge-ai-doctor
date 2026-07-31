/**
 * Production server: the built SPA plus the API, on one Node HTTP listener.
 *
 * This exists because `vite build` emits static assets only. Serving `dist/`
 * from any static host would give a working marketing site and a completely dead
 * demo — no intake, no care packet, no documentation, no LiveKit token. The API
 * needs a process.
 *
 * No framework. The four routes are plain Node handlers already (see
 * server/api.js), and a dependency-free server is one less thing to keep patched
 * on a box that will sit exposed behind a tunnel.
 *
 * Configuration is entirely environment variables — nothing is baked into the
 * image. See the Dockerfile and README.
 */

import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createApiConfig, handleApiRequest, livekitReady, startupLines } from './api.js'

const HERE = fileURLToPath(new URL('.', import.meta.url))
const DIST = resolve(process.env.STATIC_DIR || join(HERE, '..', 'dist'))
const PORT = Number(process.env.PORT || 8080)
const HOST = process.env.HOST || '0.0.0.0'

/**
 * Optional Host allowlist, comma-separated. Left permissive by default: a
 * Cloudflare quick-tunnel hostname is regenerated on every restart, so a
 * mandatory allowlist would lock the operator out of their own deployment at the
 * least convenient moment. Set ALLOWED_HOSTS when the hostname is stable.
 */
const ALLOWED_HOSTS = (process.env.ALLOWED_HOSTS || '')
  .split(',')
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
}

/**
 * Resolves a URL path to a file inside DIST, or null.
 *
 * The containment check is the security-relevant part: without it,
 * `GET /../../etc/passwd` reads outside the web root. Decoding happens before
 * normalising so percent-encoded traversal (`%2e%2e%2f`) is caught too, and the
 * `+ sep` guard stops a sibling directory whose name merely starts with the same
 * characters (`/srv/dist-backup` against a root of `/srv/dist`) from passing.
 */
export function resolveStaticPath(urlPath, root = DIST) {
  let decoded
  try {
    decoded = decodeURIComponent(urlPath)
  } catch {
    return null // malformed percent-encoding
  }
  if (decoded.includes('\0')) return null

  // Reject any `..` segment outright rather than relying on normalisation to
  // neutralise it. Containment already holds without this — Node's normalize
  // discards `..` above an absolute root — but a bare traversal path would then
  // fall through to the SPA and answer with 200, which reads as a successful
  // attack in a log or a scan even though nothing escaped. Refusing is clearer
  // and gives up nothing: no legitimate asset URL contains `..`.
  if (decoded.split(/[/\\]/).includes('..')) return null

  const candidate = resolve(join(root, normalize(decoded)))
  if (candidate !== root && !candidate.startsWith(root + sep)) return null
  return candidate
}

function sendFile(res, filePath, { immutable = false } = {}) {
  const type = MIME[extname(filePath).toLowerCase()] || 'application/octet-stream'
  res.statusCode = 200
  res.setHeader('Content-Type', type)
  // Vite fingerprints filenames under /assets, so those are safe to cache hard.
  // index.html must never be cached, or a deploy leaves clients on stale JS.
  res.setHeader(
    'Cache-Control',
    immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
  )
  createReadStream(filePath).pipe(res)
}

function notFound(res, message = 'Not found') {
  res.statusCode = 404
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.end(message)
}

const config = createApiConfig({
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL,
    maxTokens: process.env.ANTHROPIC_MAX_TOKENS,
    keySource: process.env.ANTHROPIC_API_KEY ? 'environment' : 'not set',
  },
  livekit: {
    url: process.env.LIVEKIT_URL,
    apiKey: process.env.LIVEKIT_API_KEY,
    apiSecret: process.env.LIVEKIT_API_SECRET,
    keySource: process.env.LIVEKIT_API_SECRET ? 'environment' : 'not set',
  },
})

const server = createServer(async (req, res) => {
  const pathname = (req.url || '/').split('?')[0]

  if (ALLOWED_HOSTS.length) {
    const host = (req.headers.host || '').toLowerCase().split(':')[0]
    if (!ALLOWED_HOSTS.includes(host)) {
      res.statusCode = 403
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end(`Host "${host}" is not in ALLOWED_HOSTS.`)
      return
    }
  }

  // Liveness. Reports readiness of each dependency without naming a credential.
  if (pathname === '/healthz') {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.end(
      JSON.stringify({
        ok: true,
        anthropic: Boolean(config.anthropic.apiKey),
        livekit: livekitReady(config),
        staticDir: existsSync(join(DIST, 'index.html')),
      }),
    )
    return
  }

  if (await handleApiRequest(req, res, config, pathname)) return

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405
    res.end('Method not allowed')
    return
  }

  const filePath = resolveStaticPath(pathname)
  if (!filePath) return notFound(res, 'Bad path')

  if (existsSync(filePath) && statSync(filePath).isFile()) {
    return sendFile(res, filePath, { immutable: pathname.startsWith('/assets/') })
  }

  // A missing hashed asset must 404 rather than fall through to the SPA. Returning
  // index.html for a missing .js is how you get "Unexpected token '<'" in the
  // console instead of a clear 404.
  if (extname(pathname)) return notFound(res, 'Not found')

  // Client-side route: hand back the shell so deep links and refreshes work.
  const shell = join(DIST, 'index.html')
  if (!existsSync(shell)) {
    res.statusCode = 500
    res.end('No build found. Run `npm run build` (or check STATIC_DIR).')
    return
  }
  return sendFile(res, shell)
})

// Only listen when run directly, so tests can import resolveStaticPath.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  for (const [level, message] of startupLines(config)) {
    // eslint-disable-next-line no-console
    console[level === 'warn' ? 'warn' : 'log'](`[auricle] ${message}`)
  }
  if (!existsSync(join(DIST, 'index.html'))) {
    console.warn(`[auricle] no index.html in ${DIST} — static serving will 500.`)
  }
  server.listen(PORT, HOST, () => {
    console.log(`[auricle] listening on http://${HOST}:${PORT} (serving ${DIST})`)
    if (ALLOWED_HOSTS.length) console.log(`[auricle] host allowlist: ${ALLOWED_HOSTS.join(', ')}`)
  })

  // Containers get SIGTERM on `docker stop`; without this the runtime waits out
  // the full grace period before killing the process.
  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.on(signal, () => {
      console.log(`[auricle] ${signal} — closing`)
      server.close(() => process.exit(0))
      setTimeout(() => process.exit(0), 5000).unref()
    })
  }
}

export { server, config }
