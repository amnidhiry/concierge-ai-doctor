/**
 * Prompt and tool-schema contract tests.
 *
 * Two things are being protected here.
 *
 * **The schemas.** Structured output is forced with a single tool plus
 * `tool_choice`, so the tool schema *is* the output contract. A `required` entry
 * naming a property that does not exist, or a missing `additionalProperties:
 * false`, produces either an API error at request time or a payload the
 * normalizers silently drop — both of which surface as "the model returned
 * nothing useful" a long way from the cause.
 *
 * **The safety clauses.** The risk-score rule and the no-prescribing rule are
 * product behaviour expressed as prompt text, which makes them uniquely easy to
 * lose: nothing breaks when a paragraph is edited out, the demo keeps working, and
 * the model starts producing numbers nobody validated. Asserting on the text is
 * crude, and it is the only mechanism available short of live model evals.
 */

import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

import {
  CARE_PACKET_SYSTEM_PROMPT,
  CARE_PACKET_TOOL,
  RISK_SCORE_RULE,
  buildCarePacketUserMessage,
} from '../src/prompts/carePacketPrompt.js'
import {
  DOCUMENTATION_SYSTEM_PROMPT,
  DOCUMENTATION_TOOL,
  buildDocumentationUserMessage,
} from '../src/prompts/documentationPrompt.js'
import {
  INTAKE_OPENER,
  INTAKE_SYSTEM_PROMPT,
  INTAKE_TOOL,
  buildIntakeMessages,
  buildIntakeTranscript,
} from '../src/prompts/intakePrompt.js'
import { EMPTY_DOCUMENTATION, EMPTY_PACKET } from '../src/domain/models.js'

const TOOLS = [
  ['care packet', CARE_PACKET_TOOL],
  ['documentation', DOCUMENTATION_TOOL],
  ['intake', INTAKE_TOOL],
]

/** Walks a JSON Schema, yielding every object node with its path. */
function* objectNodes(schema, path = 'root') {
  if (!schema || typeof schema !== 'object') return
  if (schema.type === 'object') yield [path, schema]
  for (const [key, value] of Object.entries(schema.properties ?? {})) {
    yield* objectNodes(value, `${path}.${key}`)
  }
  if (schema.items) yield* objectNodes(schema.items, `${path}[]`)
}

describe('tool schemas', () => {
  for (const [name, tool] of TOOLS) {
    describe(name, () => {
      it('has a name, a description, and an object root', () => {
        assert.match(tool.name, /^[a-z0-9_]+$/, 'tool names must be snake_case for the API')
        assert.ok(tool.description.length > 20)
        assert.equal(tool.input_schema.type, 'object')
      })

      it('lists only real properties in every "required"', () => {
        for (const [path, node] of objectNodes(tool.input_schema)) {
          for (const key of node.required ?? []) {
            assert.ok(
              Object.prototype.hasOwnProperty.call(node.properties ?? {}, key),
              `${path} requires "${key}" but does not define it`,
            )
          }
        }
      })

      it('requires every property it defines', () => {
        // Forced-tool output is only reliably complete when everything is
        // required; an optional field arrives missing often enough that the
        // renderers would need optional-chaining the normalizers exist to avoid.
        for (const [path, node] of objectNodes(tool.input_schema)) {
          const defined = Object.keys(node.properties ?? {}).sort()
          const required = [...(node.required ?? [])].sort()
          assert.deepEqual(required, defined, `${path} required/properties mismatch`)
        }
      })

      it('closes every object against extra properties', () => {
        for (const [path, node] of objectNodes(tool.input_schema)) {
          assert.equal(
            node.additionalProperties,
            false,
            `${path} should set additionalProperties: false`,
          )
        }
      })

      it('describes every property', () => {
        for (const [path, node] of objectNodes(tool.input_schema)) {
          for (const [key, prop] of Object.entries(node.properties ?? {})) {
            const described = prop.description || prop.items?.description || prop.properties
            assert.ok(described, `${path}.${key} has no description`)
          }
        }
      })

      it('constrains every enum to a non-empty set', () => {
        const walk = (node) => {
          if (!node || typeof node !== 'object') return
          if (node.enum) assert.ok(node.enum.length > 0)
          Object.values(node.properties ?? {}).forEach(walk)
          if (node.items) walk(node.items)
        }
        walk(tool.input_schema)
      })
    })
  }

  it('care-packet schema matches the normalizer shape', () => {
    // If these drift, the model returns fields nothing renders, or the renderers
    // read fields the model was never asked for.
    assert.deepEqual(
      Object.keys(CARE_PACKET_TOOL.input_schema.properties).sort(),
      Object.keys(EMPTY_PACKET).sort(),
    )
  })

  it('documentation schema matches the normalizer shape', () => {
    assert.deepEqual(
      Object.keys(DOCUMENTATION_TOOL.input_schema.properties).sort(),
      Object.keys(EMPTY_DOCUMENTATION).sort(),
    )
    assert.deepEqual(
      Object.keys(DOCUMENTATION_TOOL.input_schema.properties.clinical_note.properties).sort(),
      Object.keys(EMPTY_DOCUMENTATION.clinical_note).sort(),
    )
    assert.deepEqual(
      Object.keys(
        DOCUMENTATION_TOOL.input_schema.properties.billing_code_suggestion.properties,
      ).sort(),
      Object.keys(EMPTY_DOCUMENTATION.billing_code_suggestion).sort(),
    )
  })

  it('sources every factual claim in the care packet', () => {
    const sourced = ['key_history', 'current_treatment']
    const snapshot = CARE_PACKET_TOOL.input_schema.properties.clinical_snapshot.properties
    for (const field of sourced) {
      const item = snapshot[field].items
      assert.deepEqual(Object.keys(item.properties).sort(), ['basis', 'source', 'statement'])
      assert.deepEqual(item.properties.basis.enum, ['stated', 'inferred'])
    }
    const supporting =
      CARE_PACKET_TOOL.input_schema.properties.discussion_points.items.properties.supporting.items
    assert.ok(supporting.properties.source, 'discussion-point support must carry a source')
  })

  it('reports supplied risk scores rather than computed ones', () => {
    const scores = CARE_PACKET_TOOL.input_schema.properties.supplied_risk_scores
    assert.deepEqual(
      Object.keys(scores.items.properties).sort(),
      ['name', 'source', 'value_as_supplied'],
      'a computed score would need a numeric field; there deliberately is not one',
    )
    assert.match(scores.description, /never a score you calculated/i)
  })
})

describe('the risk-score rule', () => {
  it('names every equation it forbids', () => {
    for (const equation of ['PREVENT', 'ASCVD', 'SCORE2', 'QRISK', 'Framingham']) {
      assert.match(RISK_SCORE_RULE, new RegExp(equation))
    }
  })

  it('forbids calculating, estimating, and inferring', () => {
    assert.match(RISK_SCORE_RULE, /Do NOT calculate, estimate, approximate, or infer/)
  })

  it('closes the qualitative-substitute loophole', () => {
    // Without this clause a model asked not to give a number reliably gives
    // "roughly intermediate risk" instead, which is the same claim with the
    // accountability removed.
    assert.match(RISK_SCORE_RULE, /qualitative substitute/i)
  })

  it('requires supplied scores to be reported verbatim with a source', () => {
    assert.match(RISK_SCORE_RULE, /report it as supplied/i)
    assert.match(RISK_SCORE_RULE, /do not recompute it/i)
  })

  it('is shared by both clinical prompts rather than duplicated', () => {
    assert.ok(CARE_PACKET_SYSTEM_PROMPT.includes(RISK_SCORE_RULE))
    assert.ok(DOCUMENTATION_SYSTEM_PROMPT.includes(RISK_SCORE_RULE))
  })

  it('is echoed in the intake agent, which talks to the patient directly', () => {
    assert.match(INTAKE_SYSTEM_PROMPT, /do not calculate, estimate, or quote any cardiovascular risk score/i)
  })
})

describe('scope clauses in the system prompts', () => {
  const CLINICAL = [
    ['care packet', CARE_PACKET_SYSTEM_PROMPT],
    ['documentation', DOCUMENTATION_SYSTEM_PROMPT],
    ['intake', INTAKE_SYSTEM_PROMPT],
  ]

  for (const [name, prompt] of CLINICAL) {
    it(`${name}: states the visit is one bounded voice call`, () => {
      assert.match(prompt, /20–30 minute voice call/)
      assert.match(prompt, /bounded/i)
    })

    it(`${name}: forbids prescribing`, () => {
      assert.match(prompt, /prescrib/i)
    })

    it(`${name}: forbids inventing clinical detail`, () => {
      assert.match(prompt, /(never invent|you never invent|do not invent)/i)
    })

    it(`${name}: forces exactly one tool call and no loose prose`, () => {
      assert.match(prompt, /exactly once/)
      assert.match(prompt, /(no prose outside the tool call|Do not write any prose outside the tool call|Never write prose outside the tool call)/i)
    })
  }

  it('care packet: forbids stating a diagnosis', () => {
    assert.match(CARE_PACKET_SYSTEM_PROMPT, /Never state or imply a diagnosis/)
  })

  it('care packet: requires a source or no claim', () => {
    assert.match(
      CARE_PACKET_SYSTEM_PROMPT,
      /If you cannot point to a source for a claim, do not make the claim/,
    )
  })

  it('documentation: forbids documenting what the transcript does not contain', () => {
    assert.match(DOCUMENTATION_SYSTEM_PROMPT, /Document only what the transcript actually contains/)
    assert.match(DOCUMENTATION_SYSTEM_PROMPT, /documentation_gaps/)
  })

  it('documentation: refuses to carry packet findings into the note as discussed', () => {
    assert.match(DOCUMENTATION_SYSTEM_PROMPT, /unless the transcript shows it was discussed/)
  })

  it('documentation: leaves the billing code empty rather than guessing', () => {
    assert.match(DOCUMENTATION_SYSTEM_PROMPT, /leave .*code.* empty rather than guessing/i)
  })

  it('intake: routes acute presentations out instead of booking them', () => {
    assert.match(INTAKE_SYSTEM_PROMPT, /scope.*to "emergency"/i)
    assert.match(INTAKE_SYSTEM_PROMPT, /call emergency services or get to an emergency department now/)
  })

  it('intake: refuses to be a general-purpose assistant, including under override framings', () => {
    assert.match(INTAKE_SYSTEM_PROMPT, /not a general-purpose assistant/)
    assert.match(INTAKE_SYSTEM_PROMPT, /authorized overrides/)
  })

  it('intake: corrects a patient who expects asynchronous correspondence', () => {
    assert.match(INTAKE_SYSTEM_PROMPT, /no written second opinion, no message thread/)
  })
})

describe('buildCarePacketUserMessage', () => {
  it('tags both inputs so the model can tell them apart', () => {
    const msg = buildCarePacketUserMessage({ patientMessage: 'my Lp(a) is 187', chartText: 'CHART' })
    assert.match(msg, /<patient_intake>/)
    assert.match(msg, /<\/patient_intake>/)
    assert.match(msg, /<chart_material>/)
    assert.match(msg, /my Lp\(a\) is 187/)
    assert.match(msg, /CHART/)
    assert.match(msg, /submit_care_packet/)
  })

  it('says so explicitly when a section is empty rather than sending a blank', () => {
    // A blank section reads as "nothing notable"; a stated absence reads as a gap,
    // which is what it is.
    const msg = buildCarePacketUserMessage({ patientMessage: '', chartText: '' })
    assert.match(msg, /did not add a written description/)
    assert.match(msg, /Treat the entire chart as a data gap/)
  })

  it('tolerates undefined inputs', () => {
    const msg = buildCarePacketUserMessage({})
    assert.ok(msg.includes('<patient_intake>'))
  })
})

describe('buildDocumentationUserMessage', () => {
  const packet = {
    one_line_summary: '61M with CAC 240 weighing a statin.',
    risk_assessment_status: 'No score calculated; ApoB and Lp(a) absent.',
    supplied_risk_scores: [{ name: 'Agatston', value_as_supplied: '240', source: 'CAC CT' }],
    data_gaps: ['no ApoB', 'no Lp(a)'],
  }

  it('separates the packet from the transcript', () => {
    const msg = buildDocumentationUserMessage({ transcript: 'PHYSICIAN: hello', packet })
    assert.match(msg, /<care_packet_context>/)
    assert.match(msg, /<visit_transcript>/)
    assert.ok(msg.indexOf('</care_packet_context>') < msg.indexOf('<visit_transcript>'))
  })

  it('warns that the packet is not evidence of what was said', () => {
    const msg = buildDocumentationUserMessage({ transcript: 't', packet })
    assert.match(msg, /describes the submitted record, not the conversation/)
  })

  it('carries supplied scores through with their sources', () => {
    const msg = buildDocumentationUserMessage({ transcript: 't', packet })
    assert.match(msg, /Agatston: 240 \(source: CAC CT\)/)
  })

  it('states plainly when the record supplied no scores', () => {
    const msg = buildDocumentationUserMessage({
      transcript: 't',
      packet: { ...packet, supplied_risk_scores: [] },
    })
    assert.match(msg, /Risk scores supplied by the record: none\./)
  })

  it('handles a missing packet without inventing context', () => {
    const msg = buildDocumentationUserMessage({ transcript: 't', packet: null })
    assert.match(msg, /No care packet was available/)
  })

  it('flags an absent transcript rather than proceeding quietly', () => {
    const msg = buildDocumentationUserMessage({ transcript: '', packet })
    assert.match(msg, /No transcript was provided/)
  })

  it('repeats the gaps-over-invention instruction in the user turn', () => {
    const msg = buildDocumentationUserMessage({ transcript: 't', packet })
    assert.match(msg, /Document only what the transcript establishes/)
  })
})

describe('intake conversation helpers', () => {
  it('seeds the model with its own opener so it does not re-ask it', () => {
    const messages = buildIntakeMessages([])
    assert.equal(messages.length, 2)
    assert.equal(messages[0].role, 'user')
    assert.equal(messages[1].role, 'assistant')
    assert.equal(messages[1].content, INTAKE_OPENER.reply)
  })

  it('alternates roles correctly for a real conversation', () => {
    const messages = buildIntakeMessages([
      { role: 'patient', text: 'my Lp(a) is high' },
      { role: 'assistant', reply: 'Do you have the number?' },
      { role: 'patient', text: '187' },
    ])
    assert.deepEqual(
      messages.map((m) => m.role),
      ['user', 'assistant', 'user', 'assistant', 'user'],
    )
    assert.equal(messages.at(-1).content, '187')
  })

  it('frames the opener around a scheduled call, not a written answer', () => {
    assert.match(INTAKE_OPENER.reply, /your call/)
    assert.doesNotMatch(INTAKE_OPENER.reply, /48 hours|written|message/i)
  })

  it('quotes the patient verbatim in the transcript handed onward', () => {
    const transcript = buildIntakeTranscript(
      [
        { role: 'patient', text: 'I paid for a calcium scan' },
        { role: 'assistant', reply: 'What was the score?' },
      ],
      { information_gathered: ['CAC 240'], still_needed: ['ApoB'] },
    )
    assert.match(transcript, /Patient: I paid for a calcium scan/)
    assert.match(transcript, /Intake assistant: What was the score\?/)
    assert.match(transcript, /STRUCTURED INTAKE/)
    assert.match(transcript, /- CAC 240/)
    assert.match(transcript, /NOT COVERED DURING INTAKE/)
    assert.match(transcript, /- ApoB/)
  })

  it('returns an empty transcript when nothing was said', () => {
    assert.equal(buildIntakeTranscript([], null), '')
  })

  it('omits the structured sections when the agent captured nothing', () => {
    const transcript = buildIntakeTranscript([{ role: 'patient', text: 'hello' }], {
      information_gathered: [],
      still_needed: [],
    })
    assert.doesNotMatch(transcript, /STRUCTURED INTAKE/)
    assert.doesNotMatch(transcript, /NOT COVERED/)
  })
})
