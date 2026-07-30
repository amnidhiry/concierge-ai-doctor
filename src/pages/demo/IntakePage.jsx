import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDemo } from '../../context/DemoProvider.jsx'
import { useTriageChat } from '../../hooks/useTriageChat.js'
import { IntakeChat } from '../../components/demo/IntakeChat.jsx'
import { TriageProgress } from '../../components/demo/TriageProgress.jsx'
import { ChartInput } from '../../components/demo/ChartInput.jsx'
import { Button, Container, Eyebrow } from '../../components/ui/primitives.jsx'

/**
 * Step 1 — live triage intake.
 *
 * The chat is a real agent loop; `useTriageChat` owns that conversation and
 * resolves it into a single transcript at submit time. Chart text stays local
 * here. Neither is pre-filled: the demo processes whatever case the reviewer
 * brings.
 */
export function IntakePage() {
  const navigate = useNavigate()
  const { submitIntake, runSynthesis } = useDemo()
  const triage = useTriageChat()

  const [chartText, setChartText] = useState('')
  const [chartFileName, setChartFileName] = useState(null)

  const canSubmit = Boolean(triage.transcript.trim() || chartText.trim()) && !triage.emergency

  function handleSubmit() {
    if (!canSubmit) return
    const intake = submitIntake({
      patientMessage: triage.transcript,
      chartText,
      chartFileName,
    })
    navigate('/demo/synthesis')
    // Fire with the intake we just built rather than waiting for the state
    // update to land — otherwise the first call would read a stale intake.
    runSynthesis(intake)
  }

  return (
    <Container className="py-8 sm:py-10">
      <div className="max-w-2xl">
        <Eyebrow tone="pulse">Step 1 · Patient</Eyebrow>
        <h1 className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl">
          Start your intake
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-umber">
          The assistant asks real questions and adapts to your answers — every reply is a live model
          call, not a script. Add records on the right if you have them.
        </p>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className="flex min-h-[560px] flex-col gap-5">
          <div className="min-h-0 flex-1">
            <IntakeChat
              opener={triage.opener}
              turns={triage.turns}
              pending={triage.pending}
              error={triage.error}
              blocked={triage.blocked}
              emergency={triage.emergency}
              turnsRemaining={triage.turnsRemaining}
              atTurnLimit={triage.atTurnLimit}
              onSend={triage.send}
              onDismissError={triage.dismissError}
            />
          </div>
        </div>

        <div className="flex min-h-[560px] flex-col gap-5">
          <TriageProgress
            agentState={triage.agentState}
            readyForPhysician={triage.readyForPhysician}
          />
          <div className="min-h-0 flex-1">
            <ChartInput
              value={chartText}
              onChange={setChartText}
              fileName={chartFileName}
              onFileName={setChartFileName}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-lg border border-dune bg-sandstone-raised p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[15px] font-medium text-ink">
            {triage.emergency
              ? 'Intake stopped — seek in-person care'
              : triage.readyForPhysician
                ? 'The assistant has enough to send this to a cardiologist'
                : canSubmit
                  ? 'You can submit now, or keep answering for a fuller picture'
                  : 'Answer the assistant, or paste records, to continue'}
          </p>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-umber">
            {triage.emergency
              ? 'Asynchronous review is the wrong venue for what the assistant flagged. Reset the demo to try a different case.'
              : canSubmit
                ? 'Submitting runs a real synthesis call. Expect a few seconds.'
                : 'Either the chat or the records panel alone is enough.'}
          </p>
        </div>
        <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit} className="shrink-0">
          Submit for review
        </Button>
      </div>
    </Container>
  )
}
