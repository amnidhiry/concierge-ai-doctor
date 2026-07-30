import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { LIVE_PATIENT, REVIEWING_PHYSICIAN, findScheduledVisit } from '../domain/mockSchedule.js'
import {
  makeCase,
  makeIntake,
  makeVisit,
  noteToText,
  normalizeCarePacket,
  normalizeDocumentation,
} from '../domain/models.js'
import { requestCarePacket, requestVisitDocumentation, resetIntake } from '../lib/api.js'

/**
 * Single source of truth for the four-stage demo flow:
 *
 *   booking + intake → care packet → voice visit → documentation + approval
 *
 * Session-scoped only — nothing persists across a refresh, which is the intended
 * scope for this pass. The action set here (`bookVisit`, `assemblePacket`,
 * `setTranscript`, `draftDocumentation`, `approveDocumentation`) is the surface a
 * real backend would sit behind, so the components never learn where the data
 * comes from.
 *
 * ── What is deliberately absent ────────────────────────────────────────────
 * There is no `sendMessage`, no `followUp`, no `prescribe`, and no `orderTest`
 * action, because the product has none of those. The voice call's connection
 * state is also absent: LiveKit owns that, and leaking it into the case model
 * would mean every consumer of a case had to reason about WebRTC. The case knows
 * only whether the physician has declared the visit finished.
 */

const DemoContext = createContext(null)

function initialCase() {
  return makeCase({
    id: LIVE_PATIENT.id,
    patient: LIVE_PATIENT,
    intake: makeIntake(),
    visit: makeVisit(),
    status: 'booking',
  })
}

export function DemoProvider({ children }) {
  const [liveCase, setLiveCase] = useState(initialCase)
  // Guards against a duplicate call when React 18 StrictMode double-invokes
  // effects in development — without this the demo fires two API requests.
  const packetInFlight = useRef(false)
  const documentationInFlight = useRef(false)

  /**
   * Mirror of the current case, for the async actions to read at call time.
   *
   * Assigned during render rather than in an effect: an effect would run after
   * paint, so a click handler firing in the same tick as a state update could
   * read a stale case. Assigning here is safe because it derives from state
   * rather than driving it — nothing renders off the ref.
   */
  const caseRef = useRef(liveCase)
  caseRef.current = liveCase

  /**
   * Books the visit and captures the intake in one action.
   *
   * Booking and intake are a single step in this prototype: there is no calendar
   * to negotiate, so the slot is chosen alongside the intake rather than in a
   * separate flow that would imply availability logic that doesn't exist.
   */
  const bookVisit = useCallback(({ patientMessage, chartText, chartFileName, slot }) => {
    const intake = makeIntake({ patientMessage, chartText, chartFileName })
    const visit = makeVisit({
      scheduledFor: slot?.iso ?? null,
      durationMinutes: slot?.durationMinutes,
    })

    setLiveCase((prev) => ({
      ...prev,
      intake,
      visit,
      status: 'assembling_packet',
      packet: null,
      packetMeta: null,
      packetError: null,
      transcript: '',
      transcriptSource: null,
      documentation: null,
      documentationMeta: null,
      documentationError: null,
      reviewedNote: '',
      reviewedPatientSummary: '',
      acceptedBillingCode: null,
      approvedAt: null,
      approvedBy: null,
    }))

    return { intake, visit }
  }, [])

  const assemblePacket = useCallback(
    async (intakeOverride) => {
      if (packetInFlight.current) return
      packetInFlight.current = true

      // Read from the override when the caller just booked, so we don't race the
      // state update that set it.
      const intake = intakeOverride ?? liveCase.intake

      setLiveCase((prev) => ({ ...prev, status: 'assembling_packet', packetError: null }))

      const result = await requestCarePacket({
        patientMessage: intake.patientMessage,
        chartText: intake.chartText,
      })

      packetInFlight.current = false

      if (!result.ok) {
        setLiveCase((prev) => ({ ...prev, status: 'packet_failed', packetError: result.error }))
        return result
      }

      setLiveCase((prev) => ({
        ...prev,
        status: 'packet_ready',
        packet: normalizeCarePacket(result.packet),
        packetMeta: result.meta,
        packetError: null,
      }))
      return result
    },
    [liveCase.intake],
  )

  const retryPacket = useCallback(() => assemblePacket(), [assemblePacket])

  /**
   * Marks the call as finished, which opens the documentation stage.
   *
   * Called by the physician, not by LiveKit disconnecting — leaving the room is
   * not the same as concluding the visit, and a dropped connection should not
   * advance the case.
   */
  const endVisit = useCallback(() => {
    setLiveCase((prev) => ({
      ...prev,
      status: prev.status === 'packet_ready' ? 'awaiting_documentation' : prev.status,
      visit: { ...prev.visit, endedAt: new Date().toISOString() },
    }))
  }, [])

  /**
   * Records the operator-pasted synthetic transcript.
   *
   * `source` is stored alongside the text so the UI can keep saying where it came
   * from — 'pasted' or 'example'. There is no third option: nothing in this build
   * transcribes audio, so a transcript with no stated human origin would be a
   * bug worth surfacing rather than a state to render.
   */
  const setTranscript = useCallback((text, source = 'pasted') => {
    setLiveCase((prev) => ({
      ...prev,
      transcript: text,
      transcriptSource: text.trim() ? source : null,
      // A new transcript invalidates documentation drafted from the old one.
      ...(prev.documentation ? { documentation: null, documentationMeta: null } : {}),
      status:
        prev.status === 'documentation_ready' || prev.status === 'documentation_failed'
          ? 'awaiting_documentation'
          : prev.status,
    }))
  }, [])

  const draftDocumentation = useCallback(async () => {
    if (documentationInFlight.current) return
    documentationInFlight.current = true

    // Read through the ref rather than the closure. A `useCallback` closing over
    // `liveCase` would be rebuilt on every keystroke in the transcript textarea,
    // and the in-flight guard above lives in a ref precisely so that this
    // function can stay stable — those two only work together if the payload is
    // read from a ref too.
    const current = caseRef.current

    setLiveCase((prev) => ({
      ...prev,
      status: 'drafting_documentation',
      documentationError: null,
    }))

    const result = await requestVisitDocumentation({
      transcript: current?.transcript ?? '',
      packet: current?.packet ?? null,
    })

    documentationInFlight.current = false

    if (!result.ok) {
      setLiveCase((prev) => ({
        ...prev,
        status: 'documentation_failed',
        documentationError: result.error,
      }))
      return result
    }

    const documentation = normalizeDocumentation(result.documentation)

    setLiveCase((prev) => ({
      ...prev,
      status: 'documentation_ready',
      documentation,
      documentationMeta: result.meta,
      documentationError: null,
      // Seed the physician's editors with the model draft. Every later edit is
      // the physician's, which is what makes approval mean something.
      reviewedNote: noteToText(documentation.clinical_note),
      reviewedPatientSummary: documentation.patient_summary,
      acceptedBillingCode: documentation.billing_code_suggestion.code || null,
    }))
    return result
  }, [])

  const retryDocumentation = useCallback(() => draftDocumentation(), [draftDocumentation])

  const updateReviewedNote = useCallback((text) => {
    setLiveCase((prev) => ({ ...prev, reviewedNote: text }))
  }, [])

  const updateReviewedPatientSummary = useCallback((text) => {
    setLiveCase((prev) => ({ ...prev, reviewedPatientSummary: text }))
  }, [])

  const updateAcceptedBillingCode = useCallback((code) => {
    setLiveCase((prev) => ({ ...prev, acceptedBillingCode: code }))
  }, [])

  /**
   * The physician takes responsibility for the documentation.
   *
   * This is the terminal state of a case. Nothing is transmitted anywhere —
   * approval updates local state and stamps a named clinician on it, which is the
   * whole claim the product makes.
   */
  const approveDocumentation = useCallback(() => {
    setLiveCase((prev) => ({
      ...prev,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: REVIEWING_PHYSICIAN,
    }))
  }, [])

  /**
   * Care packets for sample scheduled visits, keyed by case ID.
   *
   * Kept as a separate map rather than folded into `liveCase` on purpose. The
   * live case owns the full four-stage loop; a sample visit only ever gets a
   * packet. Merging them would mean every consumer of the case model had to know
   * which fields are meaningful for which kind of case, and the approval flow
   * would need guarding at each step.
   *
   * @type {[Record<string, {status: string, packet?: object, meta?: object, error?: object}>, Function]}
   */
  const [samplePackets, setSamplePackets] = useState({})
  const samplesInFlight = useRef(new Set())

  const runSamplePacket = useCallback(async (caseId) => {
    const sample = findScheduledVisit(caseId)
    if (!sample || samplesInFlight.current.has(caseId)) return
    samplesInFlight.current.add(caseId)

    setSamplePackets((prev) => ({
      ...prev,
      [caseId]: { status: 'assembling', startedAt: Date.now() },
    }))

    const result = await requestCarePacket({
      patientMessage: sample.intake.patientMessage,
      chartText: sample.intake.chartText,
    })

    samplesInFlight.current.delete(caseId)

    setSamplePackets((prev) => ({
      ...prev,
      [caseId]: result.ok
        ? { status: 'done', packet: normalizeCarePacket(result.packet), meta: result.meta }
        : { status: 'failed', error: result.error },
    }))
  }, [])

  const clearSamplePacket = useCallback((caseId) => {
    samplesInFlight.current.delete(caseId)
    setSamplePackets((prev) => {
      const next = { ...prev }
      delete next[caseId]
      return next
    })
  }, [])

  const resetDemo = useCallback(() => {
    packetInFlight.current = false
    documentationInFlight.current = false
    setLiveCase(initialCase())
    samplesInFlight.current.clear()
    setSamplePackets({})
    // Also clear the server-side intake counters. The guard messages tell the
    // user to "reset the demo to start over", so Reset has to actually clear the
    // off-topic strikes and rate-limit window — otherwise that instruction is a
    // dead end. Fire-and-forget: a failed reset shouldn't block the UI.
    resetIntake().catch(() => {})
  }, [])

  const value = useMemo(
    () => ({
      liveCase,
      physician: REVIEWING_PHYSICIAN,
      hasIntake: Boolean(
        liveCase.intake.patientMessage.trim() || liveCase.intake.chartText.trim(),
      ),
      bookVisit,
      assemblePacket,
      retryPacket,
      endVisit,
      setTranscript,
      draftDocumentation,
      retryDocumentation,
      updateReviewedNote,
      updateReviewedPatientSummary,
      updateAcceptedBillingCode,
      approveDocumentation,
      resetDemo,
      samplePackets,
      runSamplePacket,
      clearSamplePacket,
    }),
    [
      liveCase,
      bookVisit,
      assemblePacket,
      retryPacket,
      endVisit,
      setTranscript,
      draftDocumentation,
      retryDocumentation,
      updateReviewedNote,
      updateReviewedPatientSummary,
      updateAcceptedBillingCode,
      approveDocumentation,
      resetDemo,
      samplePackets,
      runSamplePacket,
      clearSamplePacket,
    ],
  )

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo() {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemo must be used inside <DemoProvider>')
  return ctx
}
