import { useState } from 'react'
import { Button } from '../ui/primitives.jsx'
import { AiDraftBadge } from '../ui/AiDraftBadge.jsx'
import { noteToText } from '../../domain/models.js'

/**
 * Physician review and approval of the drafted documentation.
 *
 * Replaces the earlier edit-and-send editor, and the difference is more than
 * naming. That flow had one field and one action: rewrite the message, send it.
 * This one has three artifacts the physician is separately responsible for — the
 * note, the patient summary, and the code they will actually bill — and one
 * terminal action that stamps their name on all three.
 *
 * Tracking `dirty` per field lets the UI say plainly what the physician changed.
 * Approving the model's text unedited is allowed; it should not be invisible that
 * that is what happened.
 */

function FieldHeader({ label, hint, dirty, onRestore, canRestore }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5 border-b border-dune bg-dune/25 px-5 py-3.5">
      <div className="min-w-0">
        <p className="field-label">{label}</p>
        {hint && <p className="mt-1 max-w-prose text-[13px] leading-relaxed text-umber">{hint}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <p
          className={`font-mono text-[10px] uppercase tracking-label ${
            dirty ? 'text-verified' : 'text-umber-light'
          }`}
        >
          {dirty ? 'Edited by you' : 'Unchanged'}
        </p>
        {canRestore && dirty && (
          <button
            type="button"
            onClick={onRestore}
            className="font-mono text-[10px] uppercase tracking-label text-pulse hover:underline"
          >
            Restore draft
          </button>
        )}
      </div>
    </div>
  )
}

export function ApprovalPanel({
  documentation,
  note,
  patientSummary,
  billingCode,
  onNoteChange,
  onPatientSummaryChange,
  onBillingCodeChange,
  onApprove,
  approved,
  approvedAt,
  approvedBy,
}) {
  const [confirming, setConfirming] = useState(false)

  const draftNote = noteToText(documentation?.clinical_note)
  const draftSummary = documentation?.patient_summary ?? ''
  const suggestedCode = documentation?.billing_code_suggestion?.code ?? ''
  const codeSystem = documentation?.billing_code_suggestion?.code_system ?? ''

  const noteDirty = note.trim() !== draftNote.trim()
  const summaryDirty = patientSummary.trim() !== draftSummary.trim()
  const codeDirty = (billingCode ?? '') !== suggestedCode

  const noteEmpty = !note.trim()
  const summaryEmpty = !patientSummary.trim()
  const blocked = noteEmpty || summaryEmpty

  if (approved) {
    return (
      <div className="overflow-hidden rounded-lg border border-verified/40 bg-sandstone-raised">
        <div className="border-b border-verified/20 bg-verified-wash px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="field-label text-verified">Approved by the physician</p>
            <AiDraftBadge state="reviewed" />
          </div>
          <p className="mt-2 font-mono text-[11px] text-verified">
            {approvedBy?.name} · {approvedBy?.credential}
            {approvedAt && ` · ${new Date(approvedAt).toLocaleTimeString()}`}
          </p>
        </div>

        <div className="divide-y divide-dune">
          <div className="px-5 py-4">
            <p className="field-label">Clinical note</p>
            <pre className="mt-2.5 whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-ink">
              {note}
            </pre>
          </div>
          <div className="px-5 py-4">
            <p className="field-label">Patient summary</p>
            <p className="mt-2.5 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
              {patientSummary}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="field-label">Billing code accepted</p>
            <p className="mt-2 font-mono text-[15px] text-oxblood">
              {billingCode ? `${codeSystem} ${billingCode}` : 'None accepted'}
            </p>
            <p className="mt-2 max-w-prose text-[13px] leading-relaxed text-umber">
              Recorded locally for the demo. Nothing was submitted to a payer, a clearing house, or
              any billing system — this build has no billing pathway.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-lg border border-dune bg-sandstone-raised">
        <FieldHeader
          label="Clinical note · editable"
          hint="Seeded with the AI draft. What you approve becomes the note."
          dirty={noteDirty}
          canRestore={Boolean(draftNote)}
          onRestore={() => onNoteChange(draftNote)}
        />
        <div className="p-5">
          <label htmlFor="reviewed-note" className="sr-only">
            Clinical note
          </label>
          <textarea
            id="reviewed-note"
            value={note}
            onChange={(e) => {
              onNoteChange(e.target.value)
              setConfirming(false)
            }}
            rows={16}
            className="w-full resize-y rounded-md border border-dune-deep bg-sandstone px-4 py-3.5 text-[15px] leading-relaxed text-ink focus:border-pulse focus:outline-none focus:ring-1 focus:ring-pulse"
            placeholder="Write the clinical note…"
          />
          {noteEmpty && (
            <p className="mt-2 text-[13px] text-crimson">
              Empty — a case cannot be approved without a note.
            </p>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-dune bg-sandstone-raised">
        <FieldHeader
          label="Patient summary · editable"
          hint="Plain language, in your voice. This is what the patient receives."
          dirty={summaryDirty}
          canRestore={Boolean(draftSummary)}
          onRestore={() => onPatientSummaryChange(draftSummary)}
        />
        <div className="p-5">
          <label htmlFor="reviewed-summary" className="sr-only">
            Patient summary
          </label>
          <textarea
            id="reviewed-summary"
            value={patientSummary}
            onChange={(e) => {
              onPatientSummaryChange(e.target.value)
              setConfirming(false)
            }}
            rows={10}
            className="w-full resize-y rounded-md border border-dune-deep bg-sandstone px-4 py-3.5 text-[15px] leading-relaxed text-ink focus:border-pulse focus:outline-none focus:ring-1 focus:ring-pulse"
            placeholder="Write the summary the patient will receive…"
          />
          {summaryEmpty && (
            <p className="mt-2 text-[13px] text-crimson">
              Empty — the patient needs a summary of their call.
            </p>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-oxblood/30 bg-sandstone-raised">
        <FieldHeader
          label="Billing code · your decision"
          hint="The model suggested a code. You decide what is actually correct, or accept none."
          dirty={codeDirty}
          canRestore={Boolean(suggestedCode)}
          onRestore={() => onBillingCodeChange(suggestedCode)}
        />
        <div className="p-5">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label
                htmlFor="accepted-code"
                className="font-mono text-[10px] uppercase tracking-label text-umber-light"
              >
                Code to bill
              </label>
              <input
                id="accepted-code"
                type="text"
                value={billingCode ?? ''}
                onChange={(e) => {
                  onBillingCodeChange(e.target.value.trim() || null)
                  setConfirming(false)
                }}
                placeholder={suggestedCode || 'none'}
                className="mt-1.5 block w-40 rounded-md border border-dune-deep bg-sandstone px-3 py-2 font-mono text-[15px] text-ink focus:border-pulse focus:outline-none focus:ring-1 focus:ring-pulse"
              />
            </div>
            {billingCode && (
              <Button
                variant="ghost"
                onClick={() => onBillingCodeChange(null)}
                className="px-3 py-1.5 text-sm"
              >
                Bill nothing
              </Button>
            )}
          </div>

          {suggestedCode && (
            <p className="mt-3.5 text-[13px] leading-relaxed text-umber">
              Suggested: <span className="font-mono text-ink">{codeSystem} {suggestedCode}</span>.
              The conditions the model could not verify are listed with the draft above — they are
              yours to check, not the model's.
            </p>
          )}
        </div>
      </div>

      {confirming ? (
        <div className="rounded-md border border-pulse/30 bg-pulse-wash px-5 py-4">
          <p className="text-[15px] font-medium text-ink">Approve this documentation?</p>
          <p className="mt-1.5 max-w-prose text-[13px] leading-relaxed text-ink-muted">
            The note and summary go out under your name, and the case closes. This is one bounded
            visit — there is no follow-up appointment and no message thread afterwards, so this is
            the last thing the patient receives.
            {!noteDirty && !summaryDirty && (
              <>
                {' '}
                You have not changed the AI draft; it will be approved as written.
              </>
            )}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="verified" onClick={onApprove}>
              Approve and close the case
            </Button>
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Keep editing
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="primary" disabled={blocked} onClick={() => setConfirming(true)}>
          Review and approve
        </Button>
      )}
    </div>
  )
}
