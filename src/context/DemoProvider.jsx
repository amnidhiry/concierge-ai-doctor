import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { LIVE_PATIENT, REVIEWING_PHYSICIAN } from '../domain/mockPanel.js'
import { makeCase, makeIntake, normalizeDraft } from '../domain/models.js'
import { requestSynthesis } from '../lib/api.js'

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

  const resetDemo = useCallback(() => {
    inFlight.current = false
    setLiveCase(initialCase())
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
    }),
    [
      liveCase,
      submitIntake,
      runSynthesis,
      retrySynthesis,
      updatePhysicianResponse,
      sendPhysicianResponse,
      resetDemo,
    ],
  )

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo() {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemo must be used inside <DemoProvider>')
  return ctx
}
