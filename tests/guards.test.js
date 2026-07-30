/**
 * Intake abuse- and cost-guard tests.
 *
 * The intake endpoint is a chat loop reachable by anyone who can load the page, and
 * every turn is a billable request. These guards are the only thing between that
 * and an open tab spending real money, so each limit gets a test that actually
 * trips it rather than a test that asserts the constant exists.
 *
 * Guard state is module-level and per-process, which is right for a prototype and
 * awkward for tests — `__resetProcessBudgetForTests` exists for exactly this, and
 * every test below starts from a clean slate so ordering cannot make one test's
 * spending another's failure.
 */

import { strict as assert } from 'node:assert'
import { beforeEach, describe, it } from 'node:test'

import {
  LIMITS,
  __resetProcessBudgetForTests,
  budgetRemaining,
  checkIntakeAllowed,
  recordIntakeCall,
  recordOffTopic,
  resetClient,
} from '../server/guards.js'

/** A request shaped like the ones the handler builds, with sane defaults. */
function allow(overrides = {}) {
  return checkIntakeAllowed({
    key: 'test-client',
    turnCount: 0,
    message: 'my Lp(a) came back at 187',
    transcriptChars: 0,
    ...overrides,
  })
}

beforeEach(() => {
  __resetProcessBudgetForTests()
})

describe('checkIntakeAllowed', () => {
  it('permits a normal first turn', () => {
    assert.equal(allow(), null)
  })

  it('refuses an empty or whitespace-only message', () => {
    for (const message of ['', '   ', '\n\t', null, undefined, 42]) {
      const blocked = allow({ message })
      assert.ok(blocked, `message ${JSON.stringify(message)} should be refused`)
      assert.equal(blocked.status, 400)
      assert.equal(blocked.kind, 'bad_request')
    }
  })

  it('refuses a message over the per-message cap and says where to put it instead', () => {
    const blocked = allow({ message: 'x'.repeat(LIMITS.MAX_MESSAGE_CHARS + 1) })
    assert.equal(blocked.status, 413)
    assert.equal(blocked.kind, 'too_long')
    assert.match(blocked.message, /chart panel/, 'should redirect long pastes, not just refuse')
  })

  it('allows a message exactly at the cap', () => {
    assert.equal(allow({ message: 'x'.repeat(LIMITS.MAX_MESSAGE_CHARS) }), null)
  })

  it('stops the conversation at the turn cap', () => {
    assert.equal(allow({ turnCount: LIMITS.MAX_TURNS - 1 }), null)
    const blocked = allow({ turnCount: LIMITS.MAX_TURNS })
    assert.equal(blocked.status, 429)
    assert.equal(blocked.kind, 'turn_limit')
  })

  it('stops a conversation whose transcript has grown too large to resend', () => {
    const blocked = allow({ transcriptChars: LIMITS.MAX_TRANSCRIPT_CHARS + 1 })
    assert.equal(blocked.status, 413)
    assert.equal(blocked.kind, 'too_long')
  })

  it('recomputes limits from the payload rather than trusting a client count', () => {
    // The handler derives turnCount from the turns array it was sent; a forged low
    // count with a huge transcript must still be caught by the transcript cap.
    const blocked = allow({ turnCount: 0, transcriptChars: LIMITS.MAX_TRANSCRIPT_CHARS * 2 })
    assert.ok(blocked)
  })

  it('throttles two calls sent back to back', () => {
    assert.equal(allow(), null)
    recordIntakeCall('test-client')
    const blocked = allow()
    assert.equal(blocked.status, 429)
    assert.equal(blocked.kind, 'too_fast')
  })

  it('rate-limits a client that exceeds the sliding window', () => {
    // Fill the window without tripping the min-interval guard, which is a
    // separate control keyed on the most recent call only.
    for (let i = 0; i < LIMITS.MAX_PER_WINDOW; i += 1) recordIntakeCall('burst-client')

    const blocked = checkIntakeAllowed({
      key: 'burst-client',
      turnCount: 0,
      message: 'hello',
      transcriptChars: 0,
    })
    assert.equal(blocked.status, 429)
    // Which of the two 429s fires depends on timing: both are correct refusals,
    // and asserting on either specifically would make this test flaky.
    assert.ok(['rate_limited', 'too_fast'].includes(blocked.kind), blocked.kind)
    if (blocked.kind === 'rate_limited') {
      assert.ok(blocked.retryAfterSeconds > 0, 'a rate-limit refusal must say how long to wait')
      assert.ok(blocked.retryAfterSeconds <= LIMITS.WINDOW_MS / 1000)
    }
  })

  it('keys limits per client, so one abuser cannot lock everyone out', () => {
    for (let i = 0; i < LIMITS.MAX_PER_WINDOW; i += 1) recordIntakeCall('noisy')
    assert.equal(allow({ key: 'quiet' }), null)
  })

  it('enforces a process-wide ceiling as a runaway backstop', () => {
    for (let i = 0; i < LIMITS.MAX_CALLS_PER_PROCESS; i += 1) recordIntakeCall(`client-${i}`)
    assert.equal(budgetRemaining(), 0)

    const blocked = allow({ key: 'fresh-client' })
    assert.equal(blocked.status, 429)
    assert.equal(blocked.kind, 'budget_exhausted')
    assert.match(blocked.message, /Restart the dev server/)
  })

  it('reports the remaining budget as it is spent', () => {
    assert.equal(budgetRemaining(), LIMITS.MAX_CALLS_PER_PROCESS)
    recordIntakeCall('a')
    recordIntakeCall('b')
    assert.equal(budgetRemaining(), LIMITS.MAX_CALLS_PER_PROCESS - 2)
  })

  it('never reports a negative budget', () => {
    for (let i = 0; i < LIMITS.MAX_CALLS_PER_PROCESS + 25; i += 1) recordIntakeCall(`c-${i}`)
    assert.equal(budgetRemaining(), 0)
  })
})

describe('off-topic escalation', () => {
  it('counts strikes before blocking', () => {
    for (let i = 1; i < LIMITS.MAX_OFF_TOPIC_STRIKES; i += 1) {
      const result = recordOffTopic('drifter')
      assert.equal(result.strikes, i)
      assert.equal(result.blocked, false)
    }
  })

  it('blocks the session on the final strike', () => {
    let result
    for (let i = 0; i < LIMITS.MAX_OFF_TOPIC_STRIKES; i += 1) result = recordOffTopic('abuser')
    assert.equal(result.strikes, LIMITS.MAX_OFF_TOPIC_STRIKES)
    assert.equal(result.blocked, true)
  })

  it('refuses every later request from a blocked client', () => {
    for (let i = 0; i < LIMITS.MAX_OFF_TOPIC_STRIKES; i += 1) recordOffTopic('abuser')

    const blocked = allow({ key: 'abuser' })
    assert.equal(blocked.status, 403)
    assert.equal(blocked.kind, 'scope_blocked')
    assert.match(blocked.message, /Reset the demo/, 'the refusal must name the way out')
  })

  it('checks the block before spending any budget on the request', () => {
    // A blocked client burning process budget on refusals would defeat the point
    // of escalating from a soft redirect to a hard block.
    for (let i = 0; i < LIMITS.MAX_OFF_TOPIC_STRIKES; i += 1) recordOffTopic('abuser')
    const before = budgetRemaining()
    allow({ key: 'abuser' })
    assert.equal(budgetRemaining(), before)
  })

  it('does not leak strikes between clients', () => {
    for (let i = 0; i < LIMITS.MAX_OFF_TOPIC_STRIKES; i += 1) recordOffTopic('abuser')
    assert.equal(allow({ key: 'innocent' }), null)
  })
})

describe('resetClient', () => {
  it('clears a block so the Reset control is not a dead end', () => {
    // The guard messages tell the user to reset the demo; that instruction has to
    // actually work or it is worse than no instruction.
    for (let i = 0; i < LIMITS.MAX_OFF_TOPIC_STRIKES; i += 1) recordOffTopic('abuser')
    assert.ok(allow({ key: 'abuser' }))

    resetClient('abuser')
    assert.equal(allow({ key: 'abuser' }), null)
  })

  it('clears the rate-limit window too', () => {
    for (let i = 0; i < LIMITS.MAX_PER_WINDOW; i += 1) recordIntakeCall('noisy')
    assert.ok(allow({ key: 'noisy' }))

    resetClient('noisy')
    assert.equal(allow({ key: 'noisy' }), null)
  })

  it('does not refund the process-wide budget', () => {
    // Per-client reset is a UX affordance; the process ceiling is a spend control
    // and must not be resettable from a request.
    recordIntakeCall('a')
    const before = budgetRemaining()
    resetClient('a')
    assert.equal(budgetRemaining(), before)
  })
})

describe('LIMITS', () => {
  it('keeps every limit a positive number', () => {
    for (const [name, value] of Object.entries(LIMITS)) {
      assert.equal(typeof value, 'number', `${name} should be numeric`)
      assert.ok(value > 0, `${name} should be positive`)
    }
  })

  it('caps intake output low enough to hold the agent to a chat reply', () => {
    // The prompt asks for under 90 words. A high ceiling here is what lets the
    // agent drift into essays, so the cap is a behavioural control as well as a
    // cost one.
    assert.ok(LIMITS.MAX_OUTPUT_TOKENS <= 1000)
  })

  it('allows a transcript large enough for the full turn budget', () => {
    // If the transcript cap were below what MAX_TURNS turns can produce, a
    // conversation would die mid-way through its own allowance.
    assert.ok(LIMITS.MAX_TRANSCRIPT_CHARS >= LIMITS.MAX_TURNS * 500)
  })
})
