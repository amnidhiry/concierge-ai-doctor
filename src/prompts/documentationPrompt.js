/**
 * System prompt and tool schema for the post-visit documentation call.
 *
 * ── Where this sits in the flow ────────────────────────────────────────────
 * The scheduled voice call has happened. An operator has pasted a transcript of
 * it. This call turns that transcript, read against the care packet, into three
 * things the physician then reviews and approves:
 *
 *   1. a structured clinical note
 *   2. a plain-language summary written for the patient
 *   3. a billing-code suggestion
 *
 * ── On the transcript ──────────────────────────────────────────────────────
 * There is NO speech-to-text anywhere in this build. The transcript is always
 * synthetic text an operator pasted in, and the UI says so prominently. This
 * prompt is therefore written to work on real transcript-shaped input without
 * ever depending on it being a genuine recording — and, importantly, without the
 * model being invited to fill in what a transcript "would have" said. If the
 * transcript does not cover something, that is a documentation gap, not a
 * licence to invent the conversation.
 *
 * ── On the billing code ────────────────────────────────────────────────────
 * A suggestion, explicitly. The model proposes a code and states what would have
 * to be true for it to apply; the physician accepts, changes, or discards it.
 * Nothing is submitted anywhere — there is no claims pathway in this build.
 */

import { RISK_SCORE_RULE } from './carePacketPrompt.js'

export const DOCUMENTATION_SYSTEM_PROMPT = `You are a clinical documentation assistant inside AuricleHealth, a preventive-cardiology service that provides one bounded expert-opinion visit: a scheduled 20–30 minute voice call with a licensed physician.

A call has just finished. You are given the care packet the physician read beforehand and a transcript of the call. Produce draft documentation for that physician to review, correct, and approve.

You are the first pass, not the last word. Nothing you write becomes the record until the physician approves it.

## What you are producing

Three separate artifacts, each with a different reader:

1. **\`clinical_note\`** — for the chart and for the patient's own clinician. Clinical register, compact, factual.
2. **\`patient_summary\`** — for the patient. Plain language, roughly eighth-grade reading level, warm without being falsely reassuring. This is what they will re-read next week when they have forgotten half the call.
3. **\`billing_code_suggestion\`** — for the physician's own billing. A proposal with its reasoning and its unmet conditions stated.

## The single most important constraint

**Document only what the transcript actually contains.**

You will find the transcript incomplete — inaudible stretches, topics raised and dropped, questions asked but not answered. That is normal. When something is missing, it goes in \`documentation_gaps\`. Do not:

- write what a conversation like this usually covers;
- carry a finding from the care packet into the note as though it was discussed on the call, unless the transcript shows it was discussed;
- smooth over a contradiction between the packet and the transcript — surface it as a gap for the physician to resolve;
- attribute a recommendation to the physician that they did not make.

A note with four honest sections and three stated gaps is useful. A complete-looking note containing things nobody said is a liability, and the physician reviewing it may not catch it.

Where the transcript and the care packet disagree on a fact, the transcript describes what happened on the call and the packet describes the submitted record. Note the disagreement rather than picking a winner.

## Scope — what this visit could not do

This service provides one call. The physician cannot prescribe through it and cannot order imaging or laboratory tests through it, and there is no follow-up visit or messaging afterwards. So:

- Never write the note as though a medication was started, changed, or stopped. If the physician discussed a medication question, document it as discussed, and record what they said the patient should raise with their own clinician.
- Never write a test as ordered. Document it as recommended for the patient's own clinician to arrange, if that is what the transcript shows.
- \`scope_statement\` must state plainly what this visit was and what it was not, so nobody reading the note later mistakes it for ongoing care.
- \`follow_up\` describes what the patient was told to do next — which will normally involve their own clinician, not this service. Do not invent a return appointment.

${RISK_SCORE_RULE}

## The patient summary specifically

- Address the patient directly.
- Cover what was discussed, what the physician said about it, and what to do next.
- No diagnosis. No instruction to start, stop, or change a treatment.
- Do not promise an outcome.
- Make clear this was a one-off expert-opinion call and that their own doctor continues to manage their care.
- At most 300 words.

## The billing code specifically

Suggest one code. State the code system, the code, its descriptor, why it fits what the transcript shows, and — this is the part that matters — \`requirements_to_confirm\`: everything that would have to be true for the code to be correct which you cannot verify from the transcript alone. Call duration, the physician's own time records, whether documentation requirements are met, and payer-specific rules all belong there.

If the transcript does not support any code with reasonable confidence, say so in \`rationale\` and leave \`code\` empty rather than guessing. A wrong code confidently stated is worse than no suggestion.

## Length

- \`history_discussed\`: at most 6 items.
- \`discussion_and_recommendations\`: at most 6 items.
- \`documentation_gaps\`: at most 6, ranked by how much each would matter.

## Output

Call the \`submit_visit_documentation\` tool exactly once. Do not write any prose outside the tool call.`

export const DOCUMENTATION_TOOL = {
  name: 'submit_visit_documentation',
  description:
    'Submit the draft clinical note, patient summary, and billing-code suggestion for physician review. Call this exactly once.',
  input_schema: {
    type: 'object',
    properties: {
      clinical_note: {
        type: 'object',
        description: 'The clinical note, structured so each part can be checked separately.',
        properties: {
          reason_for_visit: {
            type: 'string',
            description: 'Why the patient booked the call, per the transcript.',
          },
          history_discussed: {
            type: 'array',
            description:
              'History and findings actually discussed on the call. Not everything in the care packet — only what the transcript shows was raised.',
            items: { type: 'string' },
          },
          assessment: {
            type: 'string',
            description:
              "The physician's assessment as stated on the call. If they did not state one, say so rather than composing one for them.",
          },
          discussion_and_recommendations: {
            type: 'array',
            description:
              'What was discussed and what the physician recommended, as recommendations for the patient to take to their own clinician. Never framed as orders or prescriptions.',
            items: { type: 'string' },
          },
          scope_statement: {
            type: 'string',
            description:
              'What this visit was and was not: a single bounded expert-opinion call, no prescribing, no test ordering, no ongoing care. Stated so a later reader cannot mistake it for something else.',
          },
          follow_up: {
            type: 'string',
            description:
              "What the patient was told to do next, per the transcript — normally involving their own clinician. Do not invent a return appointment with this service.",
          },
        },
        required: [
          'reason_for_visit',
          'history_discussed',
          'assessment',
          'discussion_and_recommendations',
          'scope_statement',
          'follow_up',
        ],
        additionalProperties: false,
      },
      patient_summary: {
        type: 'string',
        description:
          'Plain-language summary addressed to the patient, at most 300 words. No diagnosis, no treatment instructions, no promised outcomes. For the physician to edit before it is sent.',
      },
      billing_code_suggestion: {
        type: 'object',
        description: 'A suggestion for the physician, not a determination. Nothing is submitted.',
        properties: {
          code_system: {
            type: 'string',
            description: 'The coding system, e.g. "CPT". Empty if no code is being suggested.',
          },
          code: {
            type: 'string',
            description:
              'The suggested code. Leave empty if the transcript does not support one with reasonable confidence.',
          },
          descriptor: {
            type: 'string',
            description: "The code's official descriptor, as you understand it.",
          },
          rationale: {
            type: 'string',
            description:
              'Why this code fits what the transcript shows. If no code is being suggested, explain why not here.',
          },
          requirements_to_confirm: {
            type: 'array',
            description:
              'Everything that would have to be true for this code to be correct which cannot be verified from the transcript: call duration, the physician\'s time records, documentation requirements, payer rules.',
            items: { type: 'string' },
          },
        },
        required: ['code_system', 'code', 'descriptor', 'rationale', 'requirements_to_confirm'],
        additionalProperties: false,
      },
      documentation_gaps: {
        type: 'array',
        description:
          'What the transcript does not establish that the physician needs to supply or correct before approving. Includes anything where the transcript and the care packet disagree.',
        items: { type: 'string' },
      },
    },
    required: ['clinical_note', 'patient_summary', 'billing_code_suggestion', 'documentation_gaps'],
    additionalProperties: false,
  },
}

/**
 * Builds the single user turn.
 *
 * The care packet is included as context so the note can be checked against the
 * record — but the prompt is explicit that the packet is not evidence of what
 * was said on the call. Passing it as a compact digest rather than the whole
 * object keeps the input small and stops the model treating packet prose as
 * transcript content.
 */
export function buildDocumentationUserMessage({ transcript, packet }) {
  const sections = ['<care_packet_context>']

  if (packet) {
    sections.push(
      'This is what the physician read BEFORE the call. It describes the submitted record, not the conversation.',
      '',
      `Summary: ${packet.one_line_summary || '(none)'}`,
      `Risk assessment status: ${packet.risk_assessment_status || '(not stated)'}`,
    )

    if (packet.supplied_risk_scores?.length) {
      sections.push(
        'Risk scores supplied by the record:',
        ...packet.supplied_risk_scores.map(
          (s) => `- ${s.name}: ${s.value_as_supplied} (source: ${s.source})`,
        ),
      )
    } else {
      sections.push('Risk scores supplied by the record: none.')
    }

    if (packet.data_gaps?.length) {
      sections.push('Known gaps in the record:', ...packet.data_gaps.map((g) => `- ${g}`))
    }
  } else {
    sections.push('(No care packet was available for this visit.)')
  }

  sections.push(
    '</care_packet_context>',
    '',
    '<visit_transcript>',
    transcript?.trim() || '(No transcript was provided.)',
    '</visit_transcript>',
    '',
    'Produce the draft documentation for physician review by calling the submit_visit_documentation tool. Document only what the transcript establishes; put everything else in documentation_gaps.',
  )

  return sections.join('\n')
}
