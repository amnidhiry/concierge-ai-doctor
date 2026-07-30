import { useState } from 'react'
import { Button } from '../ui/primitives.jsx'
import { AiDraftBadge } from '../ui/AiDraftBadge.jsx'

/**
 * Inline editor for the patient-facing reply.
 *
 * The textarea starts seeded with the model's `draft_response_to_patient` and
 * every keystroke after that is the physician's. Tracking `dirty` against the
 * original lets the UI say plainly whether the physician actually changed
 * anything — sending the model's text unedited is allowed, but it shouldn't be
 * invisible that that's what happened.
 */
export function DraftEditor({ aiDraft, value, onChange, onSend, sent, sentAt, reviewedBy }) {
  const [confirming, setConfirming] = useState(false)

  const dirty = value.trim() !== (aiDraft ?? '').trim()
  const empty = !value.trim()

  if (sent) {
    return (
      <div className="overflow-hidden rounded-lg border border-verified/30 bg-paper-raised">
        <div className="border-b border-verified/20 bg-verified-wash px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="field-label text-verified">Sent to patient</p>
            <AiDraftBadge state="reviewed" />
          </div>
          <p className="mt-2 font-mono text-[11px] text-verified">
            {reviewedBy?.name} · {reviewedBy?.credential}
            {sentAt && ` · ${new Date(sentAt).toLocaleTimeString()}`}
          </p>
        </div>
        <div className="px-5 py-5">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{value}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-mist bg-paper-raised">
      <div className="border-b border-mist bg-mist/25 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="field-label">Reply to patient · editable</p>
          <AiDraftBadge />
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-slate">
          Seeded with the AI draft. Edit freely — what you send is what the patient sees.
        </p>
      </div>

      <div className="p-5">
        <label htmlFor="physician-reply" className="sr-only">
          Reply to patient
        </label>
        <textarea
          id="physician-reply"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setConfirming(false)
          }}
          rows={14}
          className="w-full resize-y rounded-md border border-mist-deep bg-paper px-4 py-3.5 text-[15px] leading-relaxed text-ink focus:border-pulse focus:outline-none focus:ring-1 focus:ring-pulse"
          placeholder="Write the response the patient will receive…"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-slate">
            {empty ? (
              <span className="text-alert">Empty — nothing to send.</span>
            ) : dirty ? (
              <>
                <span className="text-verified">Edited by you.</span> {value.length.toLocaleString()}{' '}
                characters.
              </>
            ) : (
              <>Unchanged from the AI draft. {value.length.toLocaleString()} characters.</>
            )}
          </p>
          {aiDraft && dirty && (
            <button
              type="button"
              onClick={() => onChange(aiDraft)}
              className="font-mono text-[11px] uppercase tracking-label text-pulse hover:underline"
            >
              Restore AI draft
            </button>
          )}
        </div>

        {confirming ? (
          <div className="mt-5 rounded-md border border-pulse/30 bg-pulse-wash px-4 py-4">
            <p className="text-[15px] font-medium text-ink">Send this to the patient?</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
              {dirty
                ? 'Your edited version will be sent under your name.'
                : "You haven't changed the AI draft. It will be sent under your name as written."}
            </p>
            <div className="mt-4 flex gap-3">
              <Button variant="verified" onClick={onSend}>
                Confirm and send
              </Button>
              <Button variant="outline" onClick={() => setConfirming(false)}>
                Keep editing
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="primary"
            disabled={empty}
            onClick={() => setConfirming(true)}
            className="mt-5"
          >
            Review and send
          </Button>
        )}
      </div>
    </div>
  )
}
