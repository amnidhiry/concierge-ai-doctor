/**
 * Data shapes for the demo flow.
 *
 * Deliberately plain: no React, no browser APIs, no framework types. These are
 * the structures that would become Dart classes when the core flow is ported to
 * Flutter, and the boundary the future real backend would serve. Keeping them
 * here — rather than letting shapes emerge inline inside components — is what
 * makes that port a translation rather than a rewrite.
 *
 * The `snake_case` fields inside `packet` and `documentation` are intentional:
 * those objects are returned verbatim by the model (see src/prompts/) and are
 * treated as wire payloads rather than reshaped, so the tool schema stays the
 * single source of truth.
 *
 * ── The product this models ────────────────────────────────────────────────
 * One bounded, episodic preventive-cardiology expert-opinion visit:
 *
 *   book → AI-assisted intake → care packet → scheduled 20–30 min voice call
 *        → AI-drafted documentation → physician review and approval
 *
 * There is no asynchronous physician correspondence, no longitudinal panel, no
 * prescribing, and no test ordering anywhere in this model — so there is no
 * field here for a message thread, a care plan, a prescription, or an order.
 * The absence is the design.
 */

/** @typedef {'routine' | 'prompt' | 'urgent'} Urgency */
/** @typedef {'low' | 'moderate' | 'high'} Confidence */

/** Scheduled visit length. Bounded on purpose — see VISIT_SCOPE below. */
export const VISIT_MINUTES = { min: 20, max: 30 }

/**
 * What the visit does and does not include. Single source of truth so the
 * marketing pages, the intake agent's framing, and the demo chrome cannot drift
 * from each other.
 */
export const VISIT_SCOPE = {
  includes: [
    'One scheduled voice call with a preventive-cardiology physician, 20–30 minutes',
    'AI-assisted intake beforehand, so the call starts from the record rather than from scratch',
    'A care packet the physician reads before the call: what your material shows, and what it is missing',
    'A written clinical note and a plain-language summary of the call, approved by the physician',
  ],
  excludes: [
    'Prescribing — no medication is started, stopped, or adjusted',
    'Ordering imaging or laboratory tests',
    'Ongoing or longitudinal care, and any follow-up beyond this one visit',
    'Messaging a physician between visits',
    'Physical examination',
    'Urgent or emergency care of any kind',
  ],
}

/**
 * What the patient submitted before the call.
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
 * The scheduled voice visit.
 *
 * Scheduling is synthetic in this prototype — there is no calendar, no
 * availability check, and no reminder. `scheduledFor` exists so the UI can state
 * a bounded appointment rather than implying an always-on service.
 */
export function makeVisit({ scheduledFor = null, durationMinutes = VISIT_MINUTES.max } = {}) {
  return {
    scheduledFor,
    durationMinutes,
    /** Set when the physician marks the call as finished. Drives documentation. */
    endedAt: null,
  }
}

/**
 * A case as it moves through the four demo stages. `status` is the single field
 * the whole flow reads to decide what to render, which keeps stage transitions
 * from depending on which route happens to be mounted.
 *
 * @typedef {(
 *   'booking' | 'assembling_packet' | 'packet_ready' | 'awaiting_documentation' |
 *   'drafting_documentation' | 'documentation_ready' | 'approved' |
 *   'packet_failed' | 'documentation_failed'
 * )} CaseStatus
 */
export function makeCase({ id, patient, intake, visit, status = 'booking' }) {
  return {
    id,
    patient,
    intake,
    visit: visit ?? makeVisit(),
    status,

    /** Structured care packet from the model. Null until the packet call succeeds. */
    packet: null,
    /** Call metadata (model, elapsed, tokens) for demo transparency. */
    packetMeta: null,
    /** Normalized error from a failed packet call. Null otherwise. */
    packetError: null,

    /**
     * The visit transcript.
     *
     * There is NO speech-to-text in this build. This field is only ever filled
     * by an operator pasting synthetic text after the call, and it is empty
     * until they do. Nothing anywhere generates, guesses, or reconstructs a
     * transcript — a fabricated one would make the documentation stage a
     * demonstration of nothing.
     */
    transcript: '',
    transcriptSource: null,

    /** Structured documentation from the model. Null until that call succeeds. */
    documentation: null,
    documentationMeta: null,
    documentationError: null,

    /**
     * The physician's reviewed versions. Seeded from the model draft, then owned
     * by the physician — approval is what makes them the record.
     */
    reviewedNote: '',
    reviewedPatientSummary: '',
    /** The billing code the physician actually accepts, which may not be the suggestion. */
    acceptedBillingCode: null,

    approvedAt: null,
    approvedBy: null,
  }
}

/** A patient identity. Synthetic only — this prototype never handles real PHI. */
export function makePatient({ id, name, age, sex, reason }) {
  return { id, name, age, sex, reason }
}

/**
 * The four stages of one visit, and how a `CaseStatus` maps onto them.
 *
 * Lives here rather than in the step-rail component for two reasons. It is
 * status-shape logic, so it belongs on the same side of the boundary as the case
 * model — a Flutter client would need exactly this mapping and should not have to
 * re-derive it from a React component. And keeping it in plain JS means it is
 * directly testable, which matters because a wrong mapping is the kind of bug
 * that shows up as a rail quietly lying about where the case is.
 */
export const VISIT_STAGES = [
  { key: 'intake', path: '/demo', label: 'Book & intake', short: 'Intake' },
  { key: 'packet', path: '/demo/packet', label: 'Care packet', short: 'Packet' },
  { key: 'visit', path: '/demo/visit', label: 'Voice visit', short: 'Visit' },
  { key: 'documentation', path: '/demo/documentation', label: 'Notes & approval', short: 'Notes' },
]

const REACHED_BY_STATUS = {
  booking: ['intake'],
  assembling_packet: ['intake', 'packet'],
  packet_failed: ['intake', 'packet'],
  packet_ready: ['intake', 'packet', 'visit'],
  awaiting_documentation: ['intake', 'packet', 'visit', 'documentation'],
  drafting_documentation: ['intake', 'packet', 'visit', 'documentation'],
  documentation_failed: ['intake', 'packet', 'visit', 'documentation'],
  documentation_ready: ['intake', 'packet', 'visit', 'documentation'],
  approved: ['intake', 'packet', 'visit', 'documentation'],
}

/** Every status the flow can be in. Exported so a test can assert the mapping is total. */
export const CASE_STATUSES = Object.keys(REACHED_BY_STATUS)

/**
 * Whether a stage is `done`, `active`, or `pending` for a given case status.
 *
 * An unknown status falls back to the first stage rather than throwing: a rail
 * that renders wrong is recoverable, a rail that crashes the demo chrome takes the
 * whole flow with it.
 */
export function stageStateFor(stageKey, status) {
  const reached = REACHED_BY_STATUS[status] ?? ['intake']

  // Once approved, every stage is complete — there is no active stage left, which
  // is the correct shape for a case that has closed.
  if (status === 'approved') return reached.includes(stageKey) ? 'done' : 'pending'

  const activeKey = reached[reached.length - 1]
  if (stageKey === activeKey) return 'active'
  if (reached.includes(stageKey)) return 'done'
  return 'pending'
}

/**
 * Empty-state care packet. Components read through this rather than
 * optional-chaining every field, so a partial model response renders as blank
 * sections instead of throwing.
 */
export const EMPTY_PACKET = {
  one_line_summary: '',
  clinical_snapshot: {
    presenting_problem: '',
    key_history: [],
    current_treatment: [],
  },
  supplied_risk_scores: [],
  risk_assessment_status: '',
  discussion_points: [],
  open_questions_for_physician: [],
  data_gaps: [],
  safety_flags: [],
  call_agenda: [],
}

/**
 * A sourced claim: a statement plus where in the submitted material it came
 * from. The packet is read by a physician minutes before a call, so an
 * unattributed assertion is worse than no assertion — they cannot check it in
 * the time available.
 */
function asSourced(v) {
  if (!v || typeof v !== 'object') return null
  const statement = typeof v.statement === 'string' ? v.statement : ''
  if (!statement) return null
  return {
    statement,
    source: typeof v.source === 'string' ? v.source : '',
    /** 'stated' = present in the input verbatim. 'inferred' = the model's reading. */
    basis: v.basis === 'inferred' ? 'inferred' : 'stated',
  }
}

const asArray = (v) => (Array.isArray(v) ? v : [])
const asString = (v) => (typeof v === 'string' ? v : '')
const sourcedList = (v) => asArray(v).map(asSourced).filter(Boolean)

/** Defensively fills a model care-packet response against EMPTY_PACKET. */
export function normalizeCarePacket(raw) {
  if (!raw || typeof raw !== 'object') return EMPTY_PACKET

  return {
    one_line_summary: asString(raw.one_line_summary),
    clinical_snapshot: {
      presenting_problem: asString(raw.clinical_snapshot?.presenting_problem),
      key_history: sourcedList(raw.clinical_snapshot?.key_history),
      current_treatment: sourcedList(raw.clinical_snapshot?.current_treatment),
    },
    /**
     * Scores the submitted material states, reported as supplied. The model is
     * instructed never to compute PREVENT, ASCVD, or any other risk score —
     * those need complete validated inputs, and a score calculated from a
     * partial record is a fabricated number wearing a clinical name.
     */
    supplied_risk_scores: asArray(raw.supplied_risk_scores)
      .map((s) => {
        if (!s || typeof s !== 'object') return null
        const name = asString(s.name)
        if (!name) return null
        return {
          name,
          value_as_supplied: asString(s.value_as_supplied),
          source: asString(s.source),
        }
      })
      .filter(Boolean),
    risk_assessment_status: asString(raw.risk_assessment_status),
    discussion_points: asArray(raw.discussion_points)
      .map((d) => {
        if (!d || typeof d !== 'object') return null
        const point = asString(d.point)
        if (!point) return null
        return {
          point,
          why_it_matters: asString(d.why_it_matters),
          supporting: sourcedList(d.supporting),
          against_or_gaps: asArray(d.against_or_gaps).map(asString).filter(Boolean),
          confidence: ['low', 'moderate', 'high'].includes(d.confidence) ? d.confidence : 'low',
        }
      })
      .filter(Boolean),
    open_questions_for_physician: asArray(raw.open_questions_for_physician)
      .map((q) => {
        if (!q || typeof q !== 'object') return null
        const question = asString(q.question)
        if (!question) return null
        return { question, why_it_matters: asString(q.why_it_matters) }
      })
      .filter(Boolean),
    data_gaps: asArray(raw.data_gaps).map(asString).filter(Boolean),
    safety_flags: asArray(raw.safety_flags)
      .map((f) => {
        if (!f || typeof f !== 'object') return null
        const flag = asString(f.flag)
        if (!flag) return null
        return {
          flag,
          urgency: ['routine', 'prompt', 'urgent'].includes(f.urgency) ? f.urgency : 'routine',
        }
      })
      .filter(Boolean),
    call_agenda: asArray(raw.call_agenda).map(asString).filter(Boolean),
  }
}

/** Empty-state documentation shape. */
export const EMPTY_DOCUMENTATION = {
  clinical_note: {
    subjective: '',
    objective: [],
    examination: '',
    assessment: '',
    plan: [],
    scope_statement: '',
  },
  patient_summary: '',
  billing_code_suggestion: {
    code_system: '',
    code: '',
    descriptor: '',
    rationale: '',
    requirements_to_confirm: [],
  },
  documentation_gaps: [],
}

/** Defensively fills a model documentation response against EMPTY_DOCUMENTATION. */
export function normalizeDocumentation(raw) {
  if (!raw || typeof raw !== 'object') return EMPTY_DOCUMENTATION

  return {
    clinical_note: {
      subjective: asString(raw.clinical_note?.subjective),
      objective: asArray(raw.clinical_note?.objective).map(asString).filter(Boolean),
      examination: asString(raw.clinical_note?.examination),
      assessment: asString(raw.clinical_note?.assessment),
      plan: asArray(raw.clinical_note?.plan).map(asString).filter(Boolean),
      scope_statement: asString(raw.clinical_note?.scope_statement),
    },
    patient_summary: asString(raw.patient_summary),
    billing_code_suggestion: {
      code_system: asString(raw.billing_code_suggestion?.code_system),
      code: asString(raw.billing_code_suggestion?.code),
      descriptor: asString(raw.billing_code_suggestion?.descriptor),
      rationale: asString(raw.billing_code_suggestion?.rationale),
      requirements_to_confirm: asArray(raw.billing_code_suggestion?.requirements_to_confirm)
        .map(asString)
        .filter(Boolean),
    },
    documentation_gaps: asArray(raw.documentation_gaps).map(asString).filter(Boolean),
  }
}

/**
 * Flattens a clinical note into the editable plain text the physician approves.
 *
 * The model returns the note structured so each part can be validated; the
 * physician edits it as prose, because that is what a note is. Approval applies
 * to the text they actually read.
 */
export function noteToText(note) {
  if (!note) return ''
  const lines = []
  const section = (label, body) => {
    if (!body) return
    if (label) lines.push(label.toUpperCase())
    lines.push(body, '')
  }
  const listSection = (label, items) => {
    if (!items?.length) return
    lines.push(label.toUpperCase(), ...items.map((i) => `- ${i}`), '')
  }

  // SOAP order. `examination` is folded into Objective rather than given its own
  // heading, because it belongs to that section clinically — and putting it last
  // in Objective means a reader reaches "no examination was performed" before
  // leaving the section, rather than after they have already read values as
  // though they were findings.
  section('Subjective', note.subjective)
  listSection('Objective', note.objective)
  section('', note.examination)
  section('Assessment', note.assessment)
  listSection('Plan', note.plan)
  section('Scope of this visit', note.scope_statement)

  return lines.join('\n').trimEnd()
}

export const URGENCY_ORDER = { urgent: 0, prompt: 1, routine: 2 }
