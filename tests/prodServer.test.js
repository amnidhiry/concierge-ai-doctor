import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { resolve, sep } from 'node:path'

import { resolveStaticPath } from '../server/prod.js'
import { API_ROUTES, createApiConfig, livekitReady, anthropicReady, startupLines } from '../server/api.js'

const ROOT = resolve('/srv/app/dist')

describe('resolveStaticPath — web-root containment', () => {
  // The security property is CONTAINMENT, not rejection. Node's path.normalize
  // discards `..` segments that would climb above an absolute root, so traversal
  // is neutralised into a path inside the web root, which then 404s because the
  // file does not exist. Asserting `null` would test an implementation detail;
  // asserting containment tests the thing that actually protects the host.
  const contained = (result) =>
    result === null || result === ROOT || result.startsWith(ROOT + sep)

  it('resolves an ordinary asset inside the root', () => {
    assert.equal(
      resolveStaticPath('/assets/index-abc.js', ROOT),
      ROOT + sep + 'assets' + sep + 'index-abc.js',
    )
  })

  it('resolves the root itself', () => {
    assert.equal(resolveStaticPath('/', ROOT), ROOT)
  })

  it('contains plain dot-dot traversal', () => {
    assert.ok(contained(resolveStaticPath('/../../etc/passwd', ROOT)))
  })

  it('contains traversal buried mid-path', () => {
    assert.ok(contained(resolveStaticPath('/assets/../../../etc/passwd', ROOT)))
  })

  it('contains percent-encoded traversal', () => {
    // Decoding must happen before the containment check, or %2e%2e%2f slips past.
    assert.ok(contained(resolveStaticPath('/%2e%2e%2f%2e%2e%2fetc/passwd', ROOT)))
  })

  it('contains a sibling directory sharing the root prefix', () => {
    // The `root + sep` guard is what stops /srv/app/dist-backup passing a naive
    // startsWith(root) check.
    assert.ok(contained(resolveStaticPath('/../dist-backup/secret', ROOT)))
  })

  it('rejects a dot-dot segment outright, so traversal cannot answer 200', () => {
    // Containment alone left `/../../etc/passwd` falling through to the SPA and
    // returning 200 with index.html. Safe, but it reads as a successful attack.
    assert.equal(resolveStaticPath('/../../etc/passwd', ROOT), null)
    assert.equal(resolveStaticPath('/assets/../../secret', ROOT), null)
    assert.equal(resolveStaticPath('/%2e%2e%2fetc', ROOT), null)
  })

  it('does not reject a filename that merely contains dots', () => {
    assert.ok(resolveStaticPath('/assets/index.abc.def.js', ROOT))
    assert.ok(resolveStaticPath('/..well-known/x', ROOT))
  })

  it('rejects a NUL byte outright', () => {
    assert.equal(resolveStaticPath('/index.html\0.js', ROOT), null)
  })

  it('rejects malformed percent-encoding rather than throwing', () => {
    assert.equal(resolveStaticPath('/%ZZ', ROOT), null)
  })

  it('holds containment across a spread of hostile inputs', () => {
    const hostile = [
      '/../../etc/passwd',
      '/assets/../../../etc/passwd',
      '/%2e%2e%2f%2e%2e%2fetc/passwd',
      '/%2E%2E/%2E%2E/etc',
      '/....//....//etc/passwd',
      '/..%2f..%2fetc/passwd',
      '/./../../root/.ssh/id_rsa',
      '//../../etc/passwd',
      '/a/b/c/../../../../../../etc/passwd',
      '/\\..\\..\\etc',
      '/%252e%252e%252fetc',
      ...Array.from({ length: 20 }, (_, i) => '/' + '../'.repeat(i + 1) + 'etc/passwd'),
    ]
    for (const path of hostile) {
      assert.ok(contained(resolveStaticPath(path, ROOT)), `escaped the root: ${path}`)
    }
  })

  it('never returns a path outside the root at any traversal depth', () => {
    for (let depth = 1; depth <= 40; depth += 1) {
      const result = resolveStaticPath('/' + '../'.repeat(depth) + 'etc/passwd', ROOT)
      assert.ok(contained(result), `depth ${depth} escaped`)
    }
  })
})

describe('API route table', () => {
  it('exposes exactly the five expected routes', () => {
    assert.deepEqual(
      [...API_ROUTES.keys()].sort(),
      [
        '/api/care-packet',
        '/api/intake',
        '/api/intake/reset',
        '/api/livekit-token',
        '/api/visit-documentation',
      ],
    )
  })

  it('matches exactly, so /api/intake does not swallow /api/intake/reset', () => {
    assert.notEqual(API_ROUTES.get('/api/intake'), API_ROUTES.get('/api/intake/reset'))
  })
})

describe('createApiConfig', () => {
  it('never invents a credential', () => {
    const c = createApiConfig({})
    assert.equal(c.anthropic.apiKey, '')
    assert.equal(c.livekit.apiSecret, '')
    assert.equal(anthropicReady(c), false)
    assert.equal(livekitReady(c), false)
  })

  it('requires all three LiveKit values before reporting ready', () => {
    const partial = createApiConfig({ livekit: { url: 'wss://x', apiKey: 'k' } })
    assert.equal(livekitReady(partial), false)
    const full = createApiConfig({ livekit: { url: 'wss://x', apiKey: 'k', apiSecret: 's' } })
    assert.equal(livekitReady(full), true)
  })

  it('applies defaults without overriding an explicit model', () => {
    assert.equal(createApiConfig({}).anthropic.model, 'claude-sonnet-4-6')
    assert.equal(
      createApiConfig({ anthropic: { model: 'claude-opus-5' } }).anthropic.model,
      'claude-opus-5',
    )
  })

  it('startup lines name the credential source but never a value', () => {
    const c = createApiConfig({
      anthropic: { apiKey: 'sk-ant-SECRETVALUE', keySource: 'environment' },
      livekit: { url: 'wss://x', apiKey: 'APIkey', apiSecret: 'SECRETVALUE', keySource: 'environment' },
    })
    const text = startupLines(c).map(([, m]) => m).join('\n')
    assert.ok(text.includes('environment'))
    assert.ok(!text.includes('sk-ant-SECRETVALUE'))
    assert.ok(!text.includes('SECRETVALUE'))
    assert.ok(!text.includes('APIkey'))
  })
})
