import { useEffect, useRef, useState } from 'react'
import { Badge, Button } from '../ui/primitives.jsx'
import { CLIENT_LIMITS } from '../../domain/limits.js'

/**
 * AI-assisted intake chat, before the scheduled call.
 *
 * Structured after the chatscope/chat-ui-kit-react component split
 * (MessageList / Message / MessageInput / TypingIndicator) but built here rather
 * than pulled in, because that kit's default styling is hard to reconcile with
 * this design system and the component tree is what's worth borrowing.
 *
 * Every assistant turn here is a real model response. That changes what the UI
 * owes the user: an in-flight indicator, a visible turn budget, a hard stop when
 * the agent flags an emergency, and honest labelling that this is AI rather than
 * a clinician.
 */

function Avatar({ who }) {
  const isPatient = who === 'patient'
  return (
    <div
      aria-hidden="true"
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[10px] ${
        isPatient
          ? 'bg-pulse text-white'
          : 'border border-draft/40 bg-draft-wash text-draft-deep'
      }`}
    >
      {isPatient ? 'You' : 'AI'}
    </div>
  )
}

function Message({ who, children, tone = 'default' }) {
  const isPatient = who === 'patient'
  const bubble = isPatient
    ? 'bg-pulse text-white'
    : tone === 'emergency'
      ? 'border border-crimson/40 bg-crimson-wash text-ink'
      : tone === 'off_topic'
        ? 'border border-dune-deep bg-dune/40 text-ink-muted'
        : 'border border-dune bg-sandstone-raised text-ink-muted'

  return (
    <div className={`flex items-start gap-3 ${isPatient ? 'flex-row-reverse' : ''}`}>
      <Avatar who={who} />
      <div className={`max-w-[85%] rounded-lg px-4 py-3 text-[15px] leading-relaxed ${bubble}`}>
        <p className="whitespace-pre-wrap">{children}</p>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <Avatar who="assistant" />
      <div className="rounded-lg border border-dune bg-sandstone-raised px-4 py-3.5">
        <span className="sr-only">Intake assistant is typing</span>
        <span className="flex items-center gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 animate-dot rounded-full bg-draft"
              style={{ animationDelay: `${i * 160}ms` }}
            />
          ))}
        </span>
      </div>
    </div>
  )
}

export function IntakeChat({
  opener,
  turns,
  pending,
  error,
  blocked,
  emergency,
  turnsRemaining,
  atTurnLimit,
  onSend,
  onDismissError,
}) {
  const [value, setValue] = useState('')
  const listRef = useRef(null)
  const taRef = useRef(null)

  const over = value.length > CLIENT_LIMITS.MAX_MESSAGE_CHARS
  const locked = pending || blocked || emergency || atTurnLimit
  const canSend = Boolean(value.trim()) && !locked && !over

  // Keep the newest turn in view as the thread grows.
  useEffect(() => {
    const node = listRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [turns.length, pending])

  function submit() {
    if (!canSend) return
    onSend(value)
    setValue('')
    taRef.current?.focus()
  }

  function onKeyDown(e) {
    // Enter sends, Shift+Enter newlines — the convention every messaging app uses.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const placeholder = emergency
    ? 'Intake stopped — please seek immediate in-person care.'
    : blocked
      ? 'Intake chat disabled for this session.'
      : atTurnLimit
        ? 'Message limit reached — book your call below.'
        : 'Type your answer…'

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-dune bg-sandstone">
      <div className="flex items-start justify-between gap-3 border-b border-dune bg-sandstone-raised px-4 py-3">
        <div>
          <p className="text-[15px] font-medium text-ink">Intake assistant</p>
          <p className="mt-0.5 text-xs text-umber">
            AI · prepares the physician for your call. Not a clinician.
          </p>
        </div>
        <Badge tone={emergency ? 'alert' : 'draft'} className="shrink-0">
          {emergency ? 'Stopped' : `${turnsRemaining} left`}
        </Badge>
      </div>

      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5">
        <Message who="assistant">{opener.reply}</Message>

        {turns.map((turn, i) =>
          turn.role === 'patient' ? (
            <Message key={i} who="patient">
              {turn.text}
            </Message>
          ) : (
            <Message key={i} who="assistant" tone={turn.scope}>
              {turn.reply}
            </Message>
          ),
        )}

        {pending && <TypingIndicator />}

        {error && (
          <div
            role="alert"
            className="rounded-md border border-crimson/30 bg-crimson-wash px-4 py-3"
          >
            <p className="text-[13px] leading-relaxed text-crimson">{error.message}</p>
            {error.kind !== 'scope_blocked' && (
              <button
                type="button"
                onClick={onDismissError}
                className="mt-2 font-mono text-[10px] uppercase tracking-label text-crimson hover:underline"
              >
                Dismiss
              </button>
            )}
          </div>
        )}
      </div>

      {emergency && (
        <div className="border-t border-crimson/30 bg-crimson-wash px-4 py-3.5">
          <p className="text-[13px] font-medium text-crimson">
            This intake has been stopped on purpose.
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
            The assistant flagged something that needs same-day in-person assessment. A preventive
            call booked for later is the wrong venue for it.
          </p>
        </div>
      )}

      <div className="border-t border-dune bg-sandstone-raised p-3 sm:p-4">
        <label htmlFor="intake-message" className="sr-only">
          Your answer
        </label>
        <textarea
          id="intake-message"
          ref={taRef}
          rows={3}
          value={value}
          disabled={locked}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full resize-y rounded-md border border-dune-deep bg-sandstone px-3.5 py-2.5 text-[15px] leading-relaxed text-ink placeholder:text-umber-light focus:border-pulse focus:outline-none focus:ring-1 focus:ring-pulse disabled:cursor-not-allowed disabled:opacity-50"
        />
        <div className="mt-2.5 flex items-center justify-between gap-3">
          <p className={`text-xs ${over ? 'text-crimson' : 'text-umber'}`}>
            {over
              ? `${value.length} / ${CLIENT_LIMITS.MAX_MESSAGE_CHARS} — too long for the chat. Use the records panel.`
              : 'Enter to send · Shift+Enter for a new line'}
          </p>
          <Button variant="secondary" onClick={submit} disabled={!canSend}>
            {pending ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  )
}
