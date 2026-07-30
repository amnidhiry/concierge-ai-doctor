/**
 * Data shapes for the demo flow.
 *
 * Deliberately plain: no React, no browser APIs, no framework types. These are
 * the structures that would become Dart classes when the core flow is ported to
 * Flutter, and the boundary the future real backend would serve. Keeping them
 * here — rather than letting shapes emerge inline inside components — is what
 * makes that port a translation rather than a rewrite.
 *
 * The `snake_case` fields inside `draft` are intentional: that object is
 * returned verbatim by the model (see src/prompts/synthesisPrompt.js) and is
 * treated as a wire payload rather than reshaped, so the schema stays the
 * single source of truth.
 */

/** @typedef {'routine' | 'prompt' | 'urgent'} Urgency */
/** @typedef {'low' | 'moderate' | 'high'} Confidence */

/**
 * What the patient submitted in Step 1.
 * @param {{ patientMessage?: string, chartText?: string, chartFileName?: string | null }} input
 */
export function makeIntake({ patientMessage = '', chartText = '', chartFileName = null } = {}) {
  return {
    patientMessage,
    chartText,
    chartFileName,
    submittedAt: new Date().toISOString(),
  }
}

/**
 * A case as it moves through Steps 1–4. `status` is the single field the whole
 * flow reads to decide what to render, which keeps step transitions from
 * depending on which route happens to be mounted.
 *
 * @typedef {'draft_intake' | 'synthesizing' | 'awaiting_review' | 'physician_sent' | 'failed'} CaseStatus
 */
export function makeCase({ id, patient, intake, status = 'draft_intake' }) {
  return {
    id,
    patient,
    intake,
    status,
    /** Raw structured output from the model. Null until Step 2 succeeds. */
    draft: null,
    /** Call metadata (model, elapsed, tokens) for demo transparency. */
    synthesisMeta: null,
    /** Normalized error from a failed synthesis. Null otherwise. */
    error: null,
    /** The physician's edited version of `draft.draft_response_to_patient`. */
    physicianResponse: '',
    /** Set when the physician sends. This is what the patient sees in Step 4. */
    sentResponse: null,
    sentAt: null,
    reviewedBy: null,
  }
}

/** A patient identity. Synthetic only — this prototype never handles real PHI. */
export function makePatient({ id, name, age, sex, condition, plan = 'Second Opinion' }) {
  return { id, name, age, sex, condition, plan }
}

/**
 * Empty-state draft shape. Components read through this rather than
 * optional-chaining every field, so a partial model response renders as blank
 * sections instead of throwing.
 */
export const EMPTY_DRAFT = {
  one_line_summary: '',
  clinical_snapshot: {
    presenting_problem: '',
    key_history: [],
    current_treatment: [],
  },
  differential_considerations: [],
  open_questions_for_physician: [],
  suggested_next_steps: [],
  safety_flags: [],
  data_gaps: [],
  draft_response_to_patient: '',
}

/** Defensively fills a model response against EMPTY_DRAFT. */
export function normalizeDraft(raw) {
  if (!raw || typeof raw !== 'object') return EMPTY_DRAFT
  const asArray = (v) => (Array.isArray(v) ? v : [])
  const asString = (v) => (typeof v === 'string' ? v : '')

  return {
    one_line_summary: asString(raw.one_line_summary),
    clinical_snapshot: {
      presenting_problem: asString(raw.clinical_snapshot?.presenting_problem),
      key_history: asArray(raw.clinical_snapshot?.key_history),
      current_treatment: asArray(raw.clinical_snapshot?.current_treatment),
    },
    differential_considerations: asArray(raw.differential_considerations),
    open_questions_for_physician: asArray(raw.open_questions_for_physician),
    suggested_next_steps: asArray(raw.suggested_next_steps),
    safety_flags: asArray(raw.safety_flags),
    data_gaps: asArray(raw.data_gaps),
    draft_response_to_patient: asString(raw.draft_response_to_patient),
  }
}

export const URGENCY_ORDER = { urgent: 0, prompt: 1, routine: 2 }
