import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDemo } from '../../context/DemoProvider.jsx'
import { useIntakeChat } from '../../hooks/useIntakeChat.js'
import { IntakeChat } from '../../components/demo/IntakeChat.jsx'
import { IntakeProgress } from '../../components/demo/IntakeProgress.jsx'
import { ChartInput } from '../../components/demo/ChartInput.jsx'
import { Button, Container, Eyebrow } from '../../components/ui/primitives.jsx'
import { VISIT_MINUTES } from '../../domain/models.js'

/**
 * Stage 1 — book the call and run the AI-assisted intake.
 *
 * Booking and intake are one screen rather than two. There is no real calendar
 * behind this, so a separate scheduling step would be a form pretending to
 * negotiate availability that doesn't exist. Choosing a slot beside the intake is
 * honest about what it is: picking a time so the rest of the flow has a bounded
 * appointment to be about.
 *
 * The chat is a real agent loop; `useIntakeChat` owns that conversation and
 * resolves it into a single transcript when the visit is booked. Chart text stays
 * local here. Neither is pre-filled: the demo processes whatever case the reviewer
 * brings.
 */

/**
 * Offered slots.
 *
 * Generated from the current time rather than hardcoded, so the demo never shows
 * an appointment in the past — which is the kind of small dishonesty that makes an
 * audience stop trusting the rest of the screen. Deliberately only three, at
 * plausible clinic times, because a full availability grid would imply scheduling
 * logic this build does not have.
 */
function offeredSlots(now = new Date()) {
  const slots = []
  const base = new Date(now)
  base.setSeconds(0, 0)

  const plan = [
    { addDays: 1, hour: 9, minutes: 0, duration: VISIT_MINUTES.max },
    { addDays: 2, hour: 14, minutes: 30, duration: VISIT_MINUTES.max },
    { addDays: 4, hour: 17, minutes: 0, duration: VISIT_MINUTES.min },
  ]

  plan.forEach(({ addDays, hour, minutes, duration }) => {
    const d = new Date(base)
    d.setDate(d.getDate() + addDays)
    d.setHours(hour, minutes, 0, 0)
    slots.push({
      iso: d.toISOString(),
      label: d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }),
      time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      durationMinutes: duration,
    })
  })

  return slots
}

function SlotPicker({ slots, selected, onSelect }) {
  return (
    <fieldset className="rounded-lg border border-dune bg-sandstone-raised">
      <legend className="sr-only">Choose an appointment time</legend>
      <div className="border-b border-dune px-4 py-3">
        <p className="field-label">Choose your call</p>
        <p className="mt-1 text-[13px] leading-relaxed text-umber">
          One call, {VISIT_MINUTES.min}–{VISIT_MINUTES.max} minutes, by voice. Nothing is charged
          anywhere in this prototype.
        </p>
      </div>
      <div className="divide-y divide-dune">
        {slots.map((slot) => {
          const active = selected?.iso === slot.iso
          return (
            <label
              key={slot.iso}
              className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${
                active ? 'bg-pulse-wash' : 'hover:bg-dune/40'
              }`}
            >
              <input
                type="radio"
                name="visit-slot"
                value={slot.iso}
                checked={active}
                onChange={() => onSelect(slot)}
                className="h-3.5 w-3.5 accent-pulse"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] text-ink">{slot.label}</span>
                <span className="mt-0.5 block font-mono text-[11px] uppercase tracking-label text-umber-light">
                  {slot.time} · {slot.durationMinutes} min
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export function BookingPage() {
  const navigate = useNavigate()
  const { bookVisit, assemblePacket } = useDemo()
  const intake = useIntakeChat()

  const [chartText, setChartText] = useState('')
  const [chartFileName, setChartFileName] = useState(null)

  // Computed once per mount: regenerating on every keystroke would shift the
  // offered times under the user's cursor.
  const slots = useMemo(() => offeredSlots(), [])
  const [slot, setSlot] = useState(slots[0])

  const hasMaterial = Boolean(intake.transcript.trim() || chartText.trim())
  const canBook = hasMaterial && Boolean(slot) && !intake.emergency

  function handleBook() {
    if (!canBook) return
    const booked = bookVisit({
      patientMessage: intake.transcript,
      chartText,
      chartFileName,
      slot,
    })
    navigate('/demo/packet')
    // Fire with the intake we just built rather than waiting for the state update
    // to land — otherwise the first call would read a stale intake.
    assemblePacket(booked.intake)
  }

  return (
    <Container className="py-8 sm:py-10">
      <div className="max-w-2xl">
        <Eyebrow tone="pulse">Stage 1 · Patient</Eyebrow>
        <h1 className="mt-3 text-display-sm text-ink sm:text-display">
          Book your call and answer a few questions
        </h1>
        <p className="mt-4 text-body-lg leading-relaxed text-umber">
          One {VISIT_MINUTES.min}–{VISIT_MINUTES.max} minute voice call with a preventive-cardiology
          physician. The assistant below asks real questions and adapts to your answers — every reply
          is a live model call, not a script — so the physician starts the call already knowing your
          situation.
        </p>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className="flex min-h-[560px] flex-col">
          <div className="min-h-0 flex-1">
            <IntakeChat
              opener={intake.opener}
              turns={intake.turns}
              pending={intake.pending}
              error={intake.error}
              blocked={intake.blocked}
              emergency={intake.emergency}
              turnsRemaining={intake.turnsRemaining}
              atTurnLimit={intake.atTurnLimit}
              onSend={intake.send}
              onDismissError={intake.dismissError}
            />
          </div>
        </div>

        <div className="flex min-h-[560px] flex-col gap-5">
          <SlotPicker slots={slots} selected={slot} onSelect={setSlot} />
          <IntakeProgress agentState={intake.agentState} readyForVisit={intake.readyForVisit} />
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
            {intake.emergency
              ? 'Intake stopped — seek in-person care'
              : intake.readyForVisit
                ? 'The assistant has enough for the physician to work with'
                : canBook
                  ? 'You can book now, or keep answering for a fuller picture'
                  : 'Answer the assistant, or paste records, to continue'}
          </p>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-umber">
            {intake.emergency
              ? 'A call booked for later is the wrong venue for what the assistant flagged. Reset the demo to try a different case.'
              : canBook
                ? 'Booking assembles the care packet with a real model call. Expect 10–20 seconds.'
                : 'Either the chat or the records panel alone is enough.'}
          </p>
        </div>
        <Button variant="primary" onClick={handleBook} disabled={!canBook} className="shrink-0">
          Book the call
        </Button>
      </div>
    </Container>
  )
}
