import { useEffect, useRef, useState } from 'react'
import { Badge, Button } from '../ui/primitives.jsx'

/**
 * Chat-style patient intake.
 *
 * Structured after the chatscope/chat-ui-kit-react component split
 * (MessageList / Message / MessageInput / TypingIndicator) but built here rather
 * than pulled in, because that kit's default styling is hard to reconcile with
 * this design system and the component tree is what's worth borrowing, not the
 * CSS.
 *
 * The coordinator turns are static intake prompts, not model output — they are
 * scripted scaffolding to make the input feel like a conversation, and they are
 * labelled as coordinator rather than AI so nothing here reads as clinical
 * content. Everything the patient types is passed verbatim to the synthesis
 * call; nothing is pre-filled.
 */

const COORDINATOR_TURNS = [
  {
    id: 'c1',
    text: "Hi — I'll help get your case in front of a physician. To start, what's going on, and what decision are you trying to make?",
  },
  {
    id: 'c2',
    text: 'Take as much space as you need. Your own words are more useful to the physician than medical terminology.',
  },
]

function Avatar({ who }) {
  const isPatient = who === 'patient'
  return (
    <div
      aria-hidden="true"
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[10px] ${
        isPatient ? 'bg-pulse text-white' : 'border border-mist-deep bg-mist/50 text-ink-muted'
      }`}
    >
      {isPatient ? 'You' : 'CC'}
    </div>
  )
}

function Message({ who, children }) {
  const isPatient = who === 'patient'
  return (
    <div className={`flex items-start gap-3 ${isPatient ? 'flex-row-reverse' : ''}`}>
      <Avatar who={who} />
      <div
        className={`max-w-[85%] rounded-lg px-4 py-3 text-[15px] leading-relaxed ${
          isPatient
            ? 'bg-pulse text-white'
            : 'border border-mist bg-paper-raised text-ink-muted'
        }`}
      >
        <p className="whitespace-pre-wrap">{children}</p>
      </div>
    </div>
  )
}

export function IntakeChat({ messages, onSend, disabled }) {
  const [value, setValue] = useState('')
  const listRef = useRef(null)
  const taRef = useRef(null)

  // Keep the newest turn in view as the thread grows.
  useEffect(() => {
    const node = listRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [messages.length])

  function submit() {
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
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

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-mist bg-paper">
      <div className="flex items-center justify-between gap-3 border-b border-mist bg-paper-raised px-4 py-3">
        <div>
          <p className="text-[15px] font-medium text-ink">Tell us what's going on</p>
          <p className="mt-0.5 text-xs text-slate">Step 1 of 4 · your words go straight to the physician</p>
        </div>
        <Badge tone="neutral">Intake</Badge>
      </div>

      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5">
        {COORDINATOR_TURNS.map((turn) => (
          <Message key={turn.id} who="coordinator">
            {turn.text}
          </Message>
        ))}

        {messages.map((msg, i) => (
          <Message key={i} who="patient">
            {msg}
          </Message>
        ))}

        {messages.length > 0 && (
          <Message who="coordinator">
            Got it — that's recorded. Add anything else you think matters, and attach your records on
            the right when you're ready.
          </Message>
        )}
      </div>

      <div className="border-t border-mist bg-paper-raised p-3 sm:p-4">
        <label htmlFor="intake-message" className="sr-only">
          Describe your situation
        </label>
        <textarea
          id="intake-message"
          ref={taRef}
          rows={3}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Describe your situation in your own words…"
          className="w-full resize-y rounded-md border border-mist-deep bg-paper px-3.5 py-2.5 text-[15px] leading-relaxed text-ink placeholder:text-slate-light focus:border-pulse focus:outline-none focus:ring-1 focus:ring-pulse disabled:opacity-50"
        />
        <div className="mt-2.5 flex items-center justify-between gap-3">
          <p className="text-xs text-slate">Enter to send · Shift+Enter for a new line</p>
          <Button variant="secondary" onClick={submit} disabled={disabled || !value.trim()}>
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
