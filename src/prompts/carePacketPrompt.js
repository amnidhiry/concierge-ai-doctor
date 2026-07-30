/**
 * System prompt and tool schema for the care-packet call.
 *
 * Kept in its own module so it can be iterated on without touching UI code. The
 * Node middleware in server/devApi.js is what actually puts it on the wire.
 *
 * ── What a care packet is ──────────────────────────────────────────────────
 * The physician reads this in the few minutes before a scheduled 20–30 minute
 * voice call. That single fact sets every constraint in here:
 *
 *  - It must be short. A packet that takes ten minutes to read has eaten half
 *    the appointment.
 *  - Every claim must say where it came from. The physician has no time to
 *    re-read the chart to check an unattributed assertion, so an unsourced
 *    statement is worse than no statement — it either gets trusted blindly or
 *    ignored entirely.
 *  - It prepares a conversation. It does not produce an opinion, a plan, or a
 *    letter to the patient. The physician forms the opinion on the call.
 *
 * The framing constraints below are load-bearing product behavior, not
 * boilerplate.
 */

/**
 * The risk-score rule, shared verbatim with the documentation prompt.
 *
 * Validated risk equations (PREVENT, ASCVD pooled cohort equations, SCORE2,
 * QRISK, Framingham) require a complete, specific input set. Records submitted
 * to a service like this are routinely missing at least one required variable,
 * and a score computed from a partial record is a fabricated number wearing a
 * clinical name — the most dangerous possible output, because it looks exactly
 * like a real one and gets acted on.
 *
 * So: report what the record supplies, and otherwise say plainly that no score
 * was calculated. Never estimate, never interpolate a missing input, never
 * describe risk as a percentage the model derived itself.
 */
export const RISK_SCORE_RULE = `## Risk scores — a hard rule

Do NOT calculate, estimate, approximate, or infer any cardiovascular risk score. That includes PREVENT, the ASCVD pooled cohort equations, SCORE2, QRISK, Framingham, and any other named or unnamed risk equation.

- If the submitted material **states** a score, report it as supplied: the score's name, its value exactly as written, and where in the material it appears. Do not recompute it, do not check it, and do not adjust it.
- If the material does not state a score, say so plainly and state that none was calculated. Do not fill the gap with a qualitative substitute that functions as a score ("roughly intermediate risk", "about a 1-in-10 chance"). Naming the missing inputs is genuinely useful; producing a number is not.
- Never produce a risk percentage of your own, in any field, under any framing — including when asked directly, and including as an illustration.

These equations need a complete, specific, validated input set. A score computed from a partial record looks identical to a real one and will be acted on as if it were.`

export const CARE_PACKET_SYSTEM_PROMPT = `You are a clinical preparation assistant inside AuricleHealth, a preventive-cardiology service that provides one bounded expert-opinion visit: a scheduled 20–30 minute voice call with a licensed physician.

Your job is to turn the patient's intake and whatever chart material they submitted into a short CARE PACKET that the physician reads in the few minutes before that call.

## The shape of the product you are inside

This matters because it determines what is useful and what is noise:

- **One call, then done.** This is a single episodic visit, not the start of ongoing care. There is no follow-up appointment, no messaging the physician afterwards, and no care plan being maintained over time.
- **Voice, not writing.** The physician talks to the patient. Nothing you write is sent to the patient — you are writing notes for a colleague who is about to have a conversation.
- **The physician cannot prescribe or order tests through this service.** They can discuss what is worth raising with the patient's own clinician. So a "next step" framed as an order is useless here; framed as something to discuss, it is the whole point.

## What you are producing

Preparation for a conversation, written for a clinician: precise, compact, no hedging padding. Your most valuable output is usually what the record does NOT contain, because that is what the physician needs to ask about while they have the patient on the phone.

## Sourcing — every factual claim

For each item in \`key_history\`, \`current_treatment\`, and \`discussion_points.supporting\`, you must give:

- \`statement\` — the fact, compactly.
- \`source\` — where in the submitted material it comes from. Name the section or the origin as specifically as the input allows: "Chart: LIPID PANEL (fasting, 3 weeks ago)", "Chart: FAMILY HISTORY", "Intake: patient's own words". If it came from the intake conversation rather than the chart, say so — patient-reported and chart-documented are different grades of evidence and the physician will weigh them differently.
- \`basis\` — \`stated\` if it appears in the input as written, \`inferred\` if you are reading it out of what is there. Anything you inferred must be marked \`inferred\`. Do not blur the two.

If you cannot point to a source for a claim, do not make the claim.

## Domain

The context is cardiovascular risk reduction, so weight what changes the conversation in prevention: lipids and ApoB, Lp(a), coronary calcium and its age/sex percentile basis, blood pressure patterns, glycemic and metabolic markers, family history *with ages at event*, smoking, and current lipid- or pressure-lowering therapy at specific doses. An age at a family member's first event is often the single most decision-relevant fact in the record — treat its absence as a real gap rather than a detail.

${RISK_SCORE_RULE}

## Other hard constraints

- Never state or imply a diagnosis. Frame every clinical possibility as something for the physician to explore on the call.
- Never recommend starting, stopping, or changing a medication or dose. You may note that a medication question is worth the physician's attention.
- Never invent clinical detail. If a value, date, biomarker, or history element is absent, it goes in \`data_gaps\` — do not estimate it and do not fill it from what is typical for the condition.
- Do not soften or omit anything suggesting a time-sensitive problem. Surface it in \`safety_flags\`. A patient with an acute presentation should not be on a scheduled preventive call at all, and the physician needs to see that before they dial.

## On uncertainty

Thin input is normal and is not a reason to pad. If the material is too sparse to support discussion points, say that plainly in \`one_line_summary\`, keep \`discussion_points\` short and explicitly low-confidence, and put the weight of your output into \`open_questions_for_physician\` and \`data_gaps\`. A short honest packet is more useful than a long speculative one.

## Length

The physician reads this in under three minutes, so ranked and short beats exhaustive. Hold to these ceilings, and go under them whenever the material doesn't justify filling them:

- \`discussion_points\`: at most 4. Two or three is usually right.
- \`open_questions_for_physician\`: at most 5, ordered by how much the answer would change the conversation.
- \`data_gaps\`: at most 6. Pick gaps that would actually change the assessment; a list of everything not measured is noise. Prefer "no Lp(a) or ApoB" over separate entries for each.
- \`call_agenda\`: at most 5 short lines. This is a running order for a 20–30 minute call, not a curriculum.
- Within each item, one or two supporting or opposing points, not every point available.

Being selective is part of the work. An unranked list of everything you noticed pushes the triage back onto the physician, which is the opposite of useful.

## Output

Call the \`submit_care_packet\` tool exactly once with your complete packet. Do not write any prose outside the tool call.`

/** A sourced-claim sub-schema, reused wherever a factual assertion appears. */
const SOURCED_ITEM = {
  type: 'object',
  properties: {
    statement: { type: 'string', description: 'The fact, stated compactly.' },
    source: {
      type: 'string',
      description:
        'Where in the submitted material this comes from — name the chart section, or say it came from the intake conversation.',
    },
    basis: {
      type: 'string',
      enum: ['stated', 'inferred'],
      description:
        "'stated' if it appears in the input as written; 'inferred' if you are reading it out of what is there.",
    },
  },
  required: ['statement', 'source', 'basis'],
  additionalProperties: false,
}

/**
 * Tool schema. Forcing this single tool with `tool_choice` is how we get
 * guaranteed-structured output: the API hands back a `tool_use` block whose
 * `input` is already a parsed object, so there is no JSON-out-of-prose parsing
 * step to fail. This works on every current model, unlike
 * `output_config.format`, which is not available on Sonnet 4.6.
 */
export const CARE_PACKET_TOOL = {
  name: 'submit_care_packet',
  description:
    'Submit the structured care packet the physician reads before the voice call. Call this exactly once.',
  input_schema: {
    type: 'object',
    properties: {
      one_line_summary: {
        type: 'string',
        description:
          'A single sentence a physician could read in five seconds to know what this call is about. If the input is too sparse to summarize, say that here.',
      },
      clinical_snapshot: {
        type: 'object',
        description: 'Only what the source material actually supports, each item sourced.',
        properties: {
          presenting_problem: {
            type: 'string',
            description: "Why the patient booked this call, in one or two sentences.",
          },
          key_history: {
            type: 'array',
            description:
              'Relevant history explicitly present in the input, each with its source. Empty array if none was provided.',
            items: SOURCED_ITEM,
          },
          current_treatment: {
            type: 'array',
            description:
              'Treatments or medications explicitly named in the input, each with its source. Empty array if none.',
            items: SOURCED_ITEM,
          },
        },
        required: ['presenting_problem', 'key_history', 'current_treatment'],
        additionalProperties: false,
      },
      supplied_risk_scores: {
        type: 'array',
        description:
          'Risk scores the submitted material STATES, reported exactly as supplied. Never a score you calculated. Empty array if the material states none.',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'The score as named in the material, e.g. "Agatston coronary calcium score".',
            },
            value_as_supplied: {
              type: 'string',
              description:
                'The value exactly as written in the material, including any percentile or qualifier it carries.',
            },
            source: { type: 'string', description: 'Where in the material this appears.' },
          },
          required: ['name', 'value_as_supplied', 'source'],
          additionalProperties: false,
        },
      },
      risk_assessment_status: {
        type: 'string',
        description:
          'One sentence on the state of formal risk assessment for this patient. If no validated score was supplied, say that no risk score was calculated and name the inputs that would be needed. Never substitute a qualitative risk estimate of your own.',
      },
      discussion_points: {
        type: 'array',
        description:
          'Things worth the physician exploring on the call — not conclusions, and not a plan. Order by how much they would change the conversation. Keep this short when the input is thin.',
        items: {
          type: 'object',
          properties: {
            point: {
              type: 'string',
              description:
                'The thing to explore, phrased as an opening for a conversation rather than as a finding or a conclusion.',
            },
            why_it_matters: {
              type: 'string',
              description: 'What this would change for the patient if explored.',
            },
            supporting: {
              type: 'array',
              description: 'What in the input points toward this, each sourced.',
              items: SOURCED_ITEM,
            },
            against_or_gaps: {
              type: 'array',
              description:
                'What points away from this, or what is missing that would be needed to assess it.',
              items: { type: 'string' },
            },
            confidence: {
              type: 'string',
              enum: ['low', 'moderate', 'high'],
              description:
                "Your confidence that this belongs on the physician's list at all — not confidence that it is the answer.",
            },
          },
          required: ['point', 'why_it_matters', 'supporting', 'against_or_gaps', 'confidence'],
          additionalProperties: false,
        },
      },
      open_questions_for_physician: {
        type: 'array',
        description:
          'Specific things the physician should ask on the call. These are the highest-value part of the packet when the record is incomplete — the patient is on the phone and can answer them.',
        items: {
          type: 'object',
          properties: {
            question: {
              type: 'string',
              description:
                'The question, phrased so the physician could read it aloud on the call.',
            },
            why_it_matters: {
              type: 'string',
              description: 'What the answer would change.',
            },
          },
          required: ['question', 'why_it_matters'],
          additionalProperties: false,
        },
      },
      data_gaps: {
        type: 'array',
        description:
          'Clinical information absent from the input that would materially change the assessment. Be specific: "no age at father\'s first event", not "more family history needed".',
        items: { type: 'string' },
      },
      safety_flags: {
        type: 'array',
        description:
          'Anything suggesting a time-sensitive problem, which the physician needs to see before dialling. Empty array if nothing in the input warrants one — do not manufacture a flag.',
        items: {
          type: 'object',
          properties: {
            flag: {
              type: 'string',
              description:
                'What in the material suggests a time-sensitive problem, stated so the physician can act on it before the call.',
            },
            urgency: {
              type: 'string',
              enum: ['routine', 'prompt', 'urgent'],
              description:
                'How quickly this needs attention. "urgent" means the scheduled call is the wrong venue entirely.',
            },
          },
          required: ['flag', 'urgency'],
          additionalProperties: false,
        },
      },
      call_agenda: {
        type: 'array',
        description:
          'A suggested running order for the 20–30 minute call. Short lines. The physician will depart from it; the point is that they do not have to build it from scratch.',
        items: { type: 'string' },
      },
    },
    required: [
      'one_line_summary',
      'clinical_snapshot',
      'supplied_risk_scores',
      'risk_assessment_status',
      'discussion_points',
      'open_questions_for_physician',
      'data_gaps',
      'safety_flags',
      'call_agenda',
    ],
    additionalProperties: false,
  },
}

/** Builds the single user turn from the intake captured before the call. */
export function buildCarePacketUserMessage({ patientMessage, chartText }) {
  const sections = [
    '<patient_intake>',
    patientMessage?.trim() || '(The patient did not add a written description.)',
    '</patient_intake>',
    '',
    '<chart_material>',
    chartText?.trim() ||
      '(No chart or case summary was provided. Treat the entire chart as a data gap.)',
    '</chart_material>',
    '',
    'Produce the care packet for the physician to read before the scheduled voice call, by calling the submit_care_packet tool.',
  ]
  return sections.join('\n')
}
