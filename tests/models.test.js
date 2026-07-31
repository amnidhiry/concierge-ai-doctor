/**
 * Domain-shape tests.
 *
 * These target the normalizers, which are the code standing between a model
 * response and the renderers. Their whole job is that a partial, reordered, or
 * outright hostile payload renders as blank sections rather than throwing — so the
 * interesting cases are all the malformed ones, and that is most of what is below.
 *
 * Run with `npm test` (node:test, no test framework dependency).
 */

import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

import {
  CASE_STATUSES,
  EMPTY_DOCUMENTATION,
  EMPTY_PACKET,
  VISIT_MINUTES,
  VISIT_SCOPE,
  VISIT_STAGES,
  makeCase,
  makeIntake,
  makePatient,
  makeVisit,
  noteToText,
  normalizeCarePacket,
  normalizeDocumentation,
  stageStateFor,
} from '../src/domain/models.js'

describe('normalizeCarePacket', () => {
  it('returns the empty shape for junk input', () => {
    for (const junk of [null, undefined, 0, '', 'a string', [], true]) {
      assert.deepEqual(normalizeCarePacket(junk), EMPTY_PACKET)
    }
  })

  it('fills every field the renderers read, even from an empty object', () => {
    const packet = normalizeCarePacket({})
    assert.deepEqual(Object.keys(packet).sort(), Object.keys(EMPTY_PACKET).sort())
    assert.equal(packet.one_line_summary, '')
    assert.deepEqual(packet.clinical_snapshot.key_history, [])
    assert.deepEqual(packet.supplied_risk_scores, [])
    assert.deepEqual(packet.call_agenda, [])
  })

  it('keeps sourced items and drops ones with no statement', () => {
    const packet = normalizeCarePacket({
      clinical_snapshot: {
        key_history: [
          { statement: 'Lp(a) 187 nmol/L', source: 'Chart: LIPID PANEL', basis: 'stated' },
          { statement: '', source: 'Chart', basis: 'stated' }, // no statement — dropped
          { source: 'Chart: nothing' }, // no statement at all — dropped
          null,
          'a bare string',
        ],
      },
    })
    assert.equal(packet.clinical_snapshot.key_history.length, 1)
    assert.equal(packet.clinical_snapshot.key_history[0].statement, 'Lp(a) 187 nmol/L')
  })

  it('defaults an unrecognised basis to "stated" and preserves "inferred"', () => {
    const packet = normalizeCarePacket({
      clinical_snapshot: {
        current_treatment: [
          { statement: 'a', source: 's', basis: 'inferred' },
          { statement: 'b', source: 's', basis: 'guessed' },
          { statement: 'c', source: 's' },
        ],
      },
    })
    const bases = packet.clinical_snapshot.current_treatment.map((i) => i.basis)
    assert.deepEqual(bases, ['inferred', 'stated', 'stated'])
  })

  it('supplies an empty source string rather than undefined when none is given', () => {
    // The renderer prints "source not stated" for a falsy source; undefined would
    // read the same but would also propagate into any JSON round-trip as a
    // missing key, which is a different claim from "we asked and got nothing".
    const packet = normalizeCarePacket({
      clinical_snapshot: { key_history: [{ statement: 'a' }] },
    })
    assert.equal(packet.clinical_snapshot.key_history[0].source, '')
  })

  it('keeps only risk scores that name themselves', () => {
    const packet = normalizeCarePacket({
      supplied_risk_scores: [
        { name: 'Agatston', value_as_supplied: '240', source: 'CAC CT' },
        { name: '', value_as_supplied: '99' },
        { value_as_supplied: '12%' },
        'nonsense',
        null,
      ],
    })
    assert.equal(packet.supplied_risk_scores.length, 1)
    assert.deepEqual(packet.supplied_risk_scores[0], {
      name: 'Agatston',
      value_as_supplied: '240',
      source: 'CAC CT',
    })
  })

  it('clamps discussion-point confidence to the allowed set', () => {
    const packet = normalizeCarePacket({
      discussion_points: [
        { point: 'a', confidence: 'high' },
        { point: 'b', confidence: 'certain' },
        { point: 'c' },
      ],
    })
    assert.deepEqual(
      packet.discussion_points.map((d) => d.confidence),
      ['high', 'low', 'low'],
    )
  })

  it('clamps safety-flag urgency and drops flags with no text', () => {
    const packet = normalizeCarePacket({
      safety_flags: [
        { flag: 'crushing chest pain', urgency: 'urgent' },
        { flag: 'something', urgency: 'catastrophic' },
        { flag: '', urgency: 'urgent' },
      ],
    })
    assert.equal(packet.safety_flags.length, 2)
    assert.equal(packet.safety_flags[0].urgency, 'urgent')
    assert.equal(packet.safety_flags[1].urgency, 'routine')
  })

  it('drops non-string entries from plain string arrays', () => {
    const packet = normalizeCarePacket({
      data_gaps: ['no Lp(a)', 42, null, { gap: 'x' }, 'no ApoB'],
      call_agenda: ['open', undefined, 'close'],
    })
    assert.deepEqual(packet.data_gaps, ['no Lp(a)', 'no ApoB'])
    assert.deepEqual(packet.call_agenda, ['open', 'close'])
  })

  it('never invents a risk-assessment statement', () => {
    // The renderer supplies the "none was calculated" fallback text. The
    // normalizer must not, or the two would drift and the UI would be asserting
    // something the model did not say.
    assert.equal(normalizeCarePacket({}).risk_assessment_status, '')
  })
})

describe('normalizeDocumentation', () => {
  it('returns the empty shape for junk input', () => {
    for (const junk of [null, undefined, 'x', 7, []]) {
      assert.deepEqual(normalizeDocumentation(junk), EMPTY_DOCUMENTATION)
    }
  })

  it('fills the whole note and billing shape from an empty object', () => {
    const doc = normalizeDocumentation({})
    assert.deepEqual(
      Object.keys(doc.clinical_note).sort(),
      Object.keys(EMPTY_DOCUMENTATION.clinical_note).sort(),
    )
    assert.deepEqual(
      Object.keys(doc.billing_code_suggestion).sort(),
      Object.keys(EMPTY_DOCUMENTATION.billing_code_suggestion).sort(),
    )
    assert.equal(doc.patient_summary, '')
    assert.deepEqual(doc.documentation_gaps, [])
  })

  it('preserves a real payload', () => {
    const doc = normalizeDocumentation({
      clinical_note: {
        subjective: 'Asked what a calcium score of 240 means for him.',
        objective: ['CAC 240 (as supplied)', 'LDL-C 141 mg/dL (as supplied)'],
        examination: 'No physical examination was performed; audio-only visit.',
        assessment: 'No assessment stated on the call.',
        plan: ['ApoB and Lp(a) via own GP', 'Return to own GP with the note.'],
        scope_statement: 'One bounded expert-opinion call.',
      },
      patient_summary: 'We talked about your calcium score.',
      billing_code_suggestion: {
        code_system: 'CPT',
        code: '99242',
        descriptor: 'Office consultation',
        rationale: 'Consultative visit at the request of the patient.',
        requirements_to_confirm: ['Total physician time', 'Payer consultation-code policy'],
      },
      documentation_gaps: ['Blood-pressure technique not discussed'],
    })
    assert.equal(doc.billing_code_suggestion.code, '99242')
    assert.equal(doc.billing_code_suggestion.requirements_to_confirm.length, 2)
    assert.equal(doc.clinical_note.objective[0], 'CAC 240 (as supplied)')
    assert.equal(doc.clinical_note.plan.length, 2)
    assert.match(doc.clinical_note.examination, /No physical examination/)
    assert.equal(doc.documentation_gaps.length, 1)
  })

  it('leaves the code empty when the model declines to suggest one', () => {
    const doc = normalizeDocumentation({
      billing_code_suggestion: { rationale: 'Transcript does not establish duration.' },
    })
    assert.equal(doc.billing_code_suggestion.code, '')
    assert.equal(doc.billing_code_suggestion.code_system, '')
    assert.match(doc.billing_code_suggestion.rationale, /does not establish/)
  })
})

describe('noteToText', () => {
  it('returns an empty string for no note', () => {
    assert.equal(noteToText(null), '')
    assert.equal(noteToText(undefined), '')
  })

  it('omits sections with no content rather than printing empty headings', () => {
    const text = noteToText({ subjective: 'CAC 240 question', objective: [] })
    assert.match(text, /SUBJECTIVE/)
    assert.doesNotMatch(text, /OBJECTIVE/)
    assert.doesNotMatch(text, /ASSESSMENT/)
  })

  it('renders list sections as bullets and keeps section order', () => {
    const text = noteToText({
      subjective: 's-body',
      objective: ['h1', 'h2'],
      examination: 'No physical examination was performed.',
      assessment: 'a',
      plan: ['d1'],
      scope_statement: 's',
    })
    assert.match(text, /- h1\n- h2/)
    const order = [
      'SUBJECTIVE',
      'OBJECTIVE',
      'ASSESSMENT',
      'PLAN',
      'SCOPE OF THIS VISIT',
    ].map((h) => text.indexOf(h))
    assert.deepEqual(
      order,
      [...order].sort((a, b) => a - b),
      'sections should appear in clinical-note order',
    )
    assert.ok(order.every((i) => i !== -1))
  })

  it('keeps the no-examination statement inside the Objective section', () => {
    // Safety-critical ordering: a reader must reach "no examination" before
    // leaving Objective, not after they have read values as though they were
    // physical findings.
    const text = noteToText({
      subjective: 's',
      objective: ['LDL-C 139 mg/dL'],
      examination: 'No physical examination was performed; audio-only visit.',
      assessment: 'a',
    })
    const objIdx = text.indexOf('OBJECTIVE')
    const examIdx = text.indexOf('No physical examination')
    const assessIdx = text.indexOf('ASSESSMENT')
    assert.ok(objIdx !== -1 && examIdx !== -1 && assessIdx !== -1)
    assert.ok(examIdx > objIdx, 'examination statement must follow the Objective heading')
    assert.ok(examIdx < assessIdx, 'examination statement must precede Assessment')
  })

  it('never emits an empty heading line for the unlabelled examination section', () => {
    const text = noteToText({ examination: 'No physical examination was performed.' })
    assert.doesNotMatch(text, /^\s*$/m.source ? /^EXAMINATION$/m : /^EXAMINATION$/m)
    assert.equal(text, 'No physical examination was performed.')
  })

  it('does not leave trailing blank lines', () => {
    const text = noteToText({ subjective: 'r' })
    assert.equal(text, text.trimEnd())
  })

  it('round-trips through the approval editor without gaining content', () => {
    // The physician edits the flattened text, so flattening must be lossless in
    // the only direction that matters: nothing appears that the note did not say.
    const note = { subjective: 'CAC 240', assessment: 'none stated' }
    const text = noteToText(note)
    assert.ok(text.includes('CAC 240'))
    assert.ok(text.includes('none stated'))
    assert.equal(text.split('\n').filter((l) => l.trim() && !/^[A-Z -]+$/.test(l)).length, 2)
  })
})

describe('case construction', () => {
  it('starts a case in booking with nothing generated', () => {
    const c = makeCase({
      id: 'pt-1',
      patient: makePatient({ id: 'pt-1', name: 'Test', age: 50, sex: 'M', reason: 'r' }),
      intake: makeIntake(),
    })
    assert.equal(c.status, 'booking')
    assert.equal(c.packet, null)
    assert.equal(c.documentation, null)
    assert.equal(c.transcript, '')
    assert.equal(c.transcriptSource, null)
    assert.equal(c.approvedAt, null)
    assert.equal(c.approvedBy, null)
    assert.equal(c.acceptedBillingCode, null)
  })

  it('models no asynchronous messaging, prescribing, or ordering', () => {
    // The absence is the design — see the module comment. If a field like this
    // ever appears, the product has quietly changed shape and the marketing copy
    // is now wrong.
    const c = makeCase({ id: 'x', patient: {}, intake: makeIntake() })
    for (const forbidden of [
      'messages',
      'thread',
      'followUps',
      'prescriptions',
      'orders',
      'subscription',
      'panel',
    ]) {
      assert.ok(!(forbidden in c), `case should not carry a "${forbidden}" field`)
    }
  })

  it('defaults a visit to the upper bound of the booked range', () => {
    const v = makeVisit()
    assert.equal(v.durationMinutes, VISIT_MINUTES.max)
    assert.equal(v.endedAt, null)
    assert.equal(v.scheduledFor, null)
  })

  it('stamps intake with a submission time', () => {
    const i = makeIntake({ patientMessage: 'hi' })
    assert.equal(i.patientMessage, 'hi')
    assert.ok(!Number.isNaN(Date.parse(i.submittedAt)))
  })
})

describe('VISIT_SCOPE', () => {
  it('names the exclusions the product depends on', () => {
    const excludes = VISIT_SCOPE.excludes.join(' ').toLowerCase()
    for (const boundary of ['prescrib', 'ordering', 'longitudinal', 'messaging', 'emergency']) {
      assert.match(excludes, new RegExp(boundary), `exclusions should cover "${boundary}"`)
    }
  })

  it('describes a single bounded call in what it includes', () => {
    const includes = VISIT_SCOPE.includes.join(' ').toLowerCase()
    assert.match(includes, /one scheduled voice call/)
    assert.match(includes, new RegExp(`${VISIT_MINUTES.min}.${VISIT_MINUTES.max} minutes`))
  })

  it('promises nothing it also excludes', () => {
    const includes = VISIT_SCOPE.includes.join(' ').toLowerCase()
    for (const forbidden of ['prescri', 'order imaging', 'follow-up appointment', 'unlimited']) {
      assert.doesNotMatch(includes, new RegExp(forbidden))
    }
  })
})

describe('stageStateFor', () => {
  it('covers every status the flow can hold', () => {
    for (const status of CASE_STATUSES) {
      const states = VISIT_STAGES.map((s) => stageStateFor(s.key, status))
      assert.ok(
        states.every((s) => ['done', 'active', 'pending'].includes(s)),
        `status ${status} produced ${states}`,
      )
    }
  })

  it('puts a fresh case on intake', () => {
    assert.equal(stageStateFor('intake', 'booking'), 'active')
    assert.equal(stageStateFor('packet', 'booking'), 'pending')
    assert.equal(stageStateFor('visit', 'booking'), 'pending')
  })

  it('keeps a failed stage active rather than advancing past it', () => {
    assert.equal(stageStateFor('packet', 'packet_failed'), 'active')
    assert.equal(stageStateFor('visit', 'packet_failed'), 'pending')
    assert.equal(stageStateFor('documentation', 'documentation_failed'), 'active')
  })

  it('unlocks the call only once the packet exists', () => {
    assert.equal(stageStateFor('visit', 'assembling_packet'), 'pending')
    assert.equal(stageStateFor('visit', 'packet_ready'), 'active')
    assert.equal(stageStateFor('packet', 'packet_ready'), 'done')
  })

  it('marks every stage done once approved, with none active', () => {
    const states = VISIT_STAGES.map((s) => stageStateFor(s.key, 'approved'))
    assert.deepEqual(states, ['done', 'done', 'done', 'done'])
  })

  it('falls back to intake for an unknown status instead of throwing', () => {
    assert.equal(stageStateFor('intake', 'nonsense'), 'active')
    assert.equal(stageStateFor('documentation', undefined), 'pending')
  })

  it('never reports two active stages at once', () => {
    for (const status of CASE_STATUSES) {
      const active = VISIT_STAGES.filter((s) => stageStateFor(s.key, status) === 'active')
      assert.ok(active.length <= 1, `status ${status} had ${active.length} active stages`)
    }
  })

  it('has a route for every stage', () => {
    for (const stage of VISIT_STAGES) {
      assert.match(stage.path, /^\/demo/)
      assert.ok(stage.label && stage.short)
    }
  })
})
