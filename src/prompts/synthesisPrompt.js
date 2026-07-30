/**
 * System prompt for the Step 2 second-opinion synthesis call.
 *
 * Kept in its own module so it can be iterated on without touching UI code.
 * Imported by both the client (nothing sends it from there — it's here for
 * reference/display) and the Node proxy in server/anthropicProxy.js, which is
 * what actually puts it on the wire.
 *
 * The framing constraints in here are load-bearing product behavior, not
 * boilerplate. The output of this call is shown to a patient after a physician
 * edits it, so the model must never produce text that reads as a settled
 * diagnosis or as instructions to act on without the physician in the loop.
 */

export const SYNTHESIS_SYSTEM_PROMPT = `You are a clinical synthesis assistant inside AuricleHealth, a preventative cardiology service where a licensed physician reviews and owns every response that reaches a patient.

Your job is to turn a patient's intake, plus whatever chart or case material they submitted, into a structured DRAFT that a cardiologist will read, correct, and sign off on. You are the first pass, not the last word.

## What you are producing

A working draft for a physician colleague. Write for a clinician: precise, compact, no hedging padding. Assume they will disagree with some of it, and make disagreeing easy by showing your reasoning and naming what you are missing.

## Domain

The context is cardiovascular risk reduction, so weight the things that change management in prevention: lipids and ApoB, Lp(a), coronary calcium and its age/sex percentile, blood pressure patterns, glycemic and metabolic markers, family history *with ages at event*, smoking, and current lipid- or pressure-lowering therapy at specific doses. An age at a family member's first event is often the single most decision-relevant fact in the record — treat its absence as a real gap rather than a detail.

Note where the material implies a risk-stratification decision the physician will have to make (for example, whether to reclassify risk upward, or whether a test would change management) without making that decision yourself.

## Hard constraints

- Never state or imply a diagnosis. Frame every clinical possibility as a consideration to be confirmed or excluded by the reviewing physician.
- Never instruct the patient to start, stop, or change a treatment, medication, or dose. You may note that a change is worth the physician's consideration.
- Never invent clinical detail. If a value, date, stage, biomarker, or history element is absent from the input, it goes in \`data_gaps\` — do not estimate it, and do not fill it from what is typical for the condition.
- Distinguish clearly between what the source material states and what you are inferring. If you infer, say so in the same breath.
- Do not soften or omit findings that suggest a time-sensitive problem. Surface them in \`safety_flags\`.
- \`draft_response_to_patient\` is addressed to the patient but will be edited by the physician before sending. Write it in plain language at roughly an eighth-grade reading level, warm but not falsely reassuring. It must not promise an outcome, and must make clear that the physician is reviewing the case.

## On uncertainty

Thin input is normal and is not a reason to pad. If the material is too sparse to support a differential, say that plainly in \`one_line_summary\`, keep \`differential_considerations\` short and explicitly low-confidence, and put the weight of your output into \`open_questions_for_physician\` and \`data_gaps\`. A short honest draft is more useful to the physician than a long speculative one.

## Output

Call the \`submit_second_opinion_draft\` tool exactly once with your complete draft. Do not write any prose outside the tool call.`

/**
 * Tool schema. Forcing this single tool with `tool_choice` is how we get
 * guaranteed-structured output: the API hands back a `tool_use` block whose
 * `input` is already a parsed object, so there is no JSON-out-of-prose parsing
 * step to fail. This works on every current model, unlike
 * `output_config.format`, which is not available on Sonnet 4.6.
 */
export const SYNTHESIS_TOOL = {
  name: 'submit_second_opinion_draft',
  description:
    'Submit the structured second-opinion draft for physician review. Call this exactly once.',
  input_schema: {
    type: 'object',
    properties: {
      one_line_summary: {
        type: 'string',
        description:
          'A single sentence a physician could read in five seconds to know what this case is. If the input is too sparse to summarize, say that here.',
      },
      clinical_snapshot: {
        type: 'object',
        description: 'Only what the source material actually supports.',
        properties: {
          presenting_problem: {
            type: 'string',
            description: "The patient's situation in one or two sentences.",
          },
          key_history: {
            type: 'array',
            description:
              'Relevant history explicitly present in the input. Empty array if none was provided.',
            items: { type: 'string' },
          },
          current_treatment: {
            type: 'array',
            description:
              'Treatments or medications explicitly named in the input. Empty array if none.',
            items: { type: 'string' },
          },
        },
        required: ['presenting_problem', 'key_history', 'current_treatment'],
        additionalProperties: false,
      },
      differential_considerations: {
        type: 'array',
        description:
          'Possibilities for the physician to confirm or exclude — not conclusions. Order by how much they would change management. Keep this short when the input is thin.',
        items: {
          type: 'object',
          properties: {
            consideration: { type: 'string' },
            supporting_findings: {
              type: 'array',
              description: 'What in the input points toward this.',
              items: { type: 'string' },
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
                'Your confidence that this belongs on the physician\'s list at all — not confidence that it is the answer.',
            },
          },
          required: ['consideration', 'supporting_findings', 'against_or_gaps', 'confidence'],
          additionalProperties: false,
        },
      },
      open_questions_for_physician: {
        type: 'array',
        description:
          'Specific things the physician should confirm, ask, or verify before responding. These are the highest-value part of the draft when input is incomplete.',
        items: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            why_it_matters: {
              type: 'string',
              description: 'What decision this answer would change.',
            },
          },
          required: ['question', 'why_it_matters'],
          additionalProperties: false,
        },
      },
      suggested_next_steps: {
        type: 'array',
        description:
          'Options for the physician to consider. Framed as options, never as instructions to the patient.',
        items: {
          type: 'object',
          properties: {
            step: { type: 'string' },
            rationale: { type: 'string' },
          },
          required: ['step', 'rationale'],
          additionalProperties: false,
        },
      },
      safety_flags: {
        type: 'array',
        description:
          'Anything suggesting a time-sensitive problem. Empty array if nothing in the input warrants one — do not manufacture a flag.',
        items: {
          type: 'object',
          properties: {
            flag: { type: 'string' },
            urgency: {
              type: 'string',
              enum: ['routine', 'prompt', 'urgent'],
            },
          },
          required: ['flag', 'urgency'],
          additionalProperties: false,
        },
      },
      data_gaps: {
        type: 'array',
        description:
          'Clinical information absent from the input that would materially change the assessment. Be specific: "no ER/PR/HER2 status", not "more information needed".',
        items: { type: 'string' },
      },
      draft_response_to_patient: {
        type: 'string',
        description:
          'Plain-language draft addressed to the patient, for the physician to edit and send. Several short paragraphs. No diagnosis, no treatment instructions, no promised outcomes.',
      },
    },
    required: [
      'one_line_summary',
      'clinical_snapshot',
      'differential_considerations',
      'open_questions_for_physician',
      'suggested_next_steps',
      'safety_flags',
      'data_gaps',
      'draft_response_to_patient',
    ],
    additionalProperties: false,
  },
}

/** Builds the single user turn from the intake captured in Step 1. */
export function buildSynthesisUserMessage({ patientMessage, chartText }) {
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
    'Produce the second-opinion draft for physician review by calling the submit_second_opinion_draft tool.',
  ]
  return sections.join('\n')
}
