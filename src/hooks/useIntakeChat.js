import { useCallback, useMemo, useRef, useState } from 'react'
import { requestIntakeTurn, resetIntake } from '../lib/api.js'
import { INTAKE_OPENER, buildIntakeTranscript } from '../prompts/intakePrompt.js'
import { CLIENT_LIMITS } from '../domain/limits.js'

/**
 * Drives the AI-assisted intake conversation.
 *
 * Lives in a hook rather than in DemoProvider because the conversation is a
 * booking-stage concern that resolves into a single `patientMessage` when the
 * visit is booked. Keeping it out of the case model means the case stays the
 * clean, portable shape a Flutter client or a real backend would consume.
 *
 * The client mirrors the server's limits for UX (a disabled send button beats a
 * rejected request), but treats them as hints only — the server recomputes every
 * one of them from the payload, because a client-side cap is trivially bypassed.
 */
export function useIntakeChat() {
  // Turns exclude the opener, which is static and prepended server-side.
  const [turns, setTurns] = useState([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)
  const [blocked, setBlocked] = useState(false)
  const inFlight = useRef(false)

  const patientTurnCount = turns.filter((t) => t.role === 'patient').length

  /** Latest agent state — drives the progress panel and the booking gate. */
  const agentState = useMemo(() => {
    for (let i = turns.length - 1; i >= 0; i -= 1) {
      if (turns[i].role === 'assistant') return turns[i]
    }
    return null
  }, [turns])

  const emergency = agentState?.scope === 'emergency'
  const turnsRemaining = Math.max(0, CLIENT_LIMITS.MAX_TURNS - patientTurnCount)
  const atTurnLimit = turnsRemaining === 0

  const send = useCallback(
    async (text) => {
      const message = text.trim()
      if (!message || inFlight.current || blocked || atTurnLimit) return

      inFlight.current = true
      setPending(true)
      setError(null)

      // Optimistically render the patient's turn so the chat feels immediate.
      const patientTurn = { role: 'patient', text }
      const nextTurns = [...turns, patientTurn]
      setTurns(nextTurns)

      const result = await requestIntakeTurn({ message, turns })

      inFlight.current = false
      setPending(false)

      if (!result.ok) {
        setError(result.error)
        if (result.error.kind === 'scope_blocked') setBlocked(true)
        // Keep the patient's message in the thread — dropping what they typed on
        // a transient failure loses their words and reads as a bug.
        return
      }

      setTurns([...nextTurns, result.turn])
      if (result.meta?.blocked) setBlocked(true)
    },
    [turns, blocked, atTurnLimit],
  )

  const reset = useCallback(async () => {
    setTurns([])
    setError(null)
    setBlocked(false)
    setPending(false)
    inFlight.current = false
    // Clear the server-side counters too, otherwise a reset leaves the rate
    // limit and strike count from the previous conversation in place.
    await resetIntake()
  }, [])

  const dismissError = useCallback(() => setError(null), [])

  /** The transcript handed to the care-packet call. */
  const transcript = useMemo(() => buildIntakeTranscript(turns, agentState), [turns, agentState])

  return {
    opener: INTAKE_OPENER,
    turns,
    pending,
    error,
    blocked,
    emergency,
    agentState,
    patientTurnCount,
    turnsRemaining,
    atTurnLimit,
    readyForVisit: Boolean(agentState?.ready_for_visit),
    transcript,
    send,
    reset,
    dismissError,
  }
}
