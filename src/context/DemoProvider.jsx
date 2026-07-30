import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { LIVE_PATIENT, REVIEWING_PHYSICIAN, findSampleCase } from '../domain/mockPanel.js'
import { makeCase, makeIntake, normalizeDraft } from '../domain/models.js'
import { requestSynthesis, resetTriage } from '../lib/api.js'

/**
 * Single source of truth for the Step 1–4 flow.
 *
 * Session-scoped only — nothing persists across a refresh, which is the
 * intended scope for this pass. The reducer-ish action set here (`submitIntake`,
 * `runSynthesis`, `sendPhysicianResponse`) is the surface a real backend would
 * sit behind, so the components never learn where the data comes from.
 */

const DemoContext = createContext(null)

function initialCase() {
  return makeCase({
    id: LIVE_PATIENT.id,
    patient: LIVE_PATIENT,
    intake: makeIntake(),
    status: 'draft_intake',
  })
}

export function DemoProvider({ children }) {
  const [liveCase, setLiveCase] = useState(initialCase)
  // Guards against a duplicate synthesis when React 18 StrictMode double-invokes
  // effects in development — without this the demo fires two API calls.
  const inFlight = useRef(false)

  const submitIntake = useCallback(({ patientMessage, chartText, chartFileName }) => {
    const intake = makeIntake({ patientMessage, chartText, chartFileName })
    setLiveCase((prev) => ({
      ...prev,
      intake,
      status: 'synthesizing',
      draft: null,
      synthesisMeta: null,
      error: null,
      physicianResponse: '',
      sentResponse: null,
      sentAt: null,
      reviewedBy: null,
    }))
    return intake
  }, [])

  const runSynthesis = useCallback(async (intakeOverride) => {
    if (inFlight.current) return
    inFlight.current = true

    // Read from the override when the caller just submitted, so we don't race
    // the state update that set it.
    const intake = intakeOverride ?? liveCase.intake

    setLiveCase((prev) => ({ ...prev, status: 'synthesizing', error: null }))

    const result = await requestSynthesis({
      patientMessage: intake.patientMessage,
      chartText: intake.chartText,
    })

    inFlight.current = false

    if (!result.ok) {
      setLiveCase((prev) => ({ ...prev, status: 'failed', error: result.error }))
      return result
    }

    const draft = normalizeDraft(result.draft)
    setLiveCase((prev) => ({
      ...prev,
      status: 'awaiting_review',
      draft,
      synthesisMeta: result.meta,
      error: null,
      // Seed the physician's editor with the AI draft. Every later edit is the
      // physician's, which is what makes the Step 3 → 4 handoff meaningful.
      physicianResponse: draft.draft_response_to_patient,
    }))
    return result
  }, [liveCase.intake])

  const retrySynthesis = useCallback(() => runSynthesis(), [runSynthesis])

  const updatePhysicianResponse = useCallback((text) => {
    setLiveCase((prev) => ({ ...prev, physicianResponse: text }))
  }, [])

  const sendPhysicianResponse = useCallback(() => {
    setLiveCase((prev) => ({
      ...prev,
      status: 'physician_sent',
      sentResponse: prev.physicianResponse,
      sentAt: new Date().toISOString(),
      reviewedBy: REVIEWING_PHYSICIAN,
    }))
  }, [])

  /**
   * Synthesis results for sample panel cases, keyed by case ID.
   *
   * Kept as a separate map rather than folded into `liveCase` on purpose. The
   * live case owns the full Step 1–4 loop (intake → draft → physician edit →
   * send); a sample case only ever gets a draft. Merging them would mean every
   * consumer of the case model had to know which fields are meaningful for which
   * kind of case, and the send flow would need guarding at each step.
   *
   * @type {[Record<string, {status: string, draft?: object, meta?: object, error?: object}>, Function]}
   */
  const [sampleSynthesis, setSampleSynthesis] = useState({})
  const samplesInFlight = useRef(new Set())

  const runSampleSynthesis = useCallback(async (caseId) => {
    const sample = findSampleCase(caseId)
    if (!sample || samplesInFlight.current.has(caseId)) return
    samplesInFlight.current.add(caseId)

    setSampleSynthesis((prev) => ({
      ...prev,
      [caseId]: { status: 'synthesizing', startedAt: Date.now() },
    }))

    const result = await requestSynthesis({
      patientMessage: sample.intake.patientMessage,
      chartText: sample.intake.chartText,
    })

    samplesInFlight.current.delete(caseId)

    setSampleSynthesis((prev) => ({
      ...prev,
      [caseId]: result.ok
        ? { status: 'done', draft: normalizeDraft(result.draft), meta: result.meta }
        : { status: 'failed', error: result.error },
    }))
  }, [])

  const clearSampleSynthesis = useCallback((caseId) => {
    samplesInFlight.current.delete(caseId)
    setSampleSynthesis((prev) => {
      const next = { ...prev }
      delete next[caseId]
      return next
    })
  }, [])

  const resetDemo = useCallback(() => {
    inFlight.current = false
    setLiveCase(initialCase())
    samplesInFlight.current.clear()
    setSampleSynthesis({})
    // Also clear the server-side triage counters. The guard messages tell the
    // user to "reset the demo to start over", so Reset has to actually clear the
    // off-topic strikes and rate-limit window — otherwise that instruction is a
    // dead end. Fire-and-forget: a failed reset shouldn't block the UI.
    resetTriage().catch(() => {})
  }, [])

  const value = useMemo(
    () => ({
      liveCase,
      physician: REVIEWING_PHYSICIAN,
      hasIntake: Boolean(
        liveCase.intake.patientMessage.trim() || liveCase.intake.chartText.trim(),
      ),
      submitIntake,
      runSynthesis,
      retrySynthesis,
      updatePhysicianResponse,
      sendPhysicianResponse,
      resetDemo,
      sampleSynthesis,
      runSampleSynthesis,
      clearSampleSynthesis,
    }),
    [
      liveCase,
      submitIntake,
      runSynthesis,
      retrySynthesis,
      updatePhysicianResponse,
      sendPhysicianResponse,
      resetDemo,
      sampleSynthesis,
      runSampleSynthesis,
      clearSampleSynthesis,
    ],
  )

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo() {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemo must be used inside <DemoProvider>')
  return ctx
}
