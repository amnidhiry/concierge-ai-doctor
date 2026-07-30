import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDemo } from '../../context/DemoProvider.jsx'
import { IntakeChat } from '../../components/demo/IntakeChat.jsx'
import { ChartInput } from '../../components/demo/ChartInput.jsx'
import { Button, Container, Eyebrow } from '../../components/ui/primitives.jsx'

/**
 * Step 1 — patient submits a case.
 *
 * Local state until submit, then handed to the demo context. Chat turns are
 * joined into a single `patientMessage` because the synthesis call takes one
 * intake blob; keeping them as separate turns here preserves what the patient
 * actually wrote and in what order.
 */
export function IntakePage() {
  const navigate = useNavigate()
  const { submitIntake, runSynthesis } = useDemo()

  const [turns, setTurns] = useState([])
  const [chartText, setChartText] = useState('')
  const [chartFileName, setChartFileName] = useState(null)

  const patientMessage = turns.join('\n\n')
  const canSubmit = Boolean(patientMessage.trim() || chartText.trim())

  function handleSubmit() {
    if (!canSubmit) return
    const intake = submitIntake({ patientMessage, chartText, chartFileName })
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
          Submit a case
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-slate">
          Describe the situation and attach whatever records exist. Both fields are empty on purpose
          — the demo runs a live synthesis on exactly what you provide, with no pre-baked case
          behind it.
        </p>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className="min-h-[520px]">
          <IntakeChat messages={turns} onSend={(text) => setTurns((t) => [...t, text])} />
        </div>
        <div className="min-h-[520px]">
          <ChartInput
            value={chartText}
            onChange={setChartText}
            fileName={chartFileName}
            onFileName={setChartFileName}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-lg border border-mist bg-paper-raised p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[15px] font-medium text-ink">
            {canSubmit ? 'Ready to submit for synthesis' : 'Add a description or chart text to continue'}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate">
            {canSubmit
              ? 'This makes a real Anthropic API call. Expect a few seconds.'
              : 'Either field alone is enough — the physician sees whichever you give.'}
          </p>
        </div>
        <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit} className="shrink-0">
          Submit for review
        </Button>
      </div>
    </Container>
  )
}
