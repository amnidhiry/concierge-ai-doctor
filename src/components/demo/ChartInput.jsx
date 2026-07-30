import { useRef, useState } from 'react'
import { Badge, Button } from '../ui/primitives.jsx'

/**
 * Chart / case-summary input: paste or upload plain text.
 *
 * Empty by default — the whole point of the demo is that it processes whatever
 * the reviewer brings, so there is no sample case seeded here.
 *
 * Upload reads text client-side via FileReader. PDF and DOCX are rejected
 * explicitly rather than silently producing binary garbage: without a parser
 * those files would reach the model as mojibake and quietly degrade the output,
 * which is worse than an honest error.
 */

const TEXT_EXTENSIONS = ['.txt', '.md', '.markdown', '.csv', '.tsv', '.json', '.rtf', '.log']
const REJECTED = {
  pdf: 'PDF',
  doc: 'Word',
  docx: 'Word',
  rtfd: 'Word',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  heic: 'image',
}

function extensionOf(name) {
  const idx = name.lastIndexOf('.')
  return idx === -1 ? '' : name.slice(idx).toLowerCase()
}

export function ChartInput({ value, onChange, fileName, onFileName, disabled }) {
  const inputRef = useRef(null)
  const [fileError, setFileError] = useState(null)
  const [dragging, setDragging] = useState(false)

  function ingest(file) {
    if (!file) return
    setFileError(null)

    const ext = extensionOf(file.name)
    const bare = ext.replace('.', '')

    if (REJECTED[bare]) {
      setFileError(
        `${REJECTED[bare]} files can't be read in this prototype — there's no document parser wired up. Open the file and paste the text instead.`,
      )
      return
    }

    const looksTextual = TEXT_EXTENSIONS.includes(ext) || file.type.startsWith('text/')
    if (!looksTextual) {
      setFileError(
        `Can't read "${file.name}". Plain-text formats only (${TEXT_EXTENSIONS.join(', ')}), or paste the text directly.`,
      )
      return
    }

    if (file.size > 1_000_000) {
      setFileError('That file is over 1MB. Trim it, or paste the relevant sections.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      // Append rather than replace, so a second upload doesn't silently discard
      // what's already there.
      onChange(value.trim() ? `${value.trim()}\n\n---\n\n${text}` : text)
      onFileName(file.name)
    }
    reader.onerror = () => setFileError('Could not read that file. Try pasting the text instead.')
    reader.readAsText(file)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-dune bg-sandstone">
      <div className="flex items-center justify-between gap-3 border-b border-dune bg-sandstone-raised px-4 py-3">
        <div>
          <p className="text-[15px] font-medium text-ink">Records & case summary</p>
          <p className="mt-0.5 text-xs text-umber">Paste or upload — optional, but it's what the synthesis reads</p>
        </div>
        <Badge tone="neutral">Chart</Badge>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
        <div
          onDragOver={(e) => {
            e.preventDefault()
            if (!disabled) setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            if (!disabled) ingest(e.dataTransfer.files?.[0])
          }}
          className={`rounded-md border border-dashed px-4 py-3 transition-colors ${
            dragging ? 'border-pulse bg-pulse-wash' : 'border-dune-deep bg-dune/25'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-umber">
              {fileName ? (
                <>
                  Loaded <span className="font-mono text-[13px] text-ink">{fileName}</span>
                </>
              ) : (
                'Drop a text file here, or'
              )}
            </p>
            <Button
              variant="outline"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="px-3.5 py-1.5 text-sm"
            >
              {fileName ? 'Add another file' : 'Choose file'}
            </Button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={[...TEXT_EXTENSIONS, 'text/*'].join(',')}
            className="hidden"
            onChange={(e) => {
              ingest(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>

        {fileError && (
          <p role="alert" className="rounded-md bg-crimson-wash px-3.5 py-2.5 text-sm leading-relaxed text-crimson">
            {fileError}
          </p>
        )}

        <label htmlFor="chart-text" className="sr-only">
          Chart or case summary text
        </label>
        <textarea
          id="chart-text"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            'Paste the lipid panel, calcium score report, discharge summary, or case notes here…\n\nSynthetic data only.'
          }
          className="min-h-[220px] flex-1 resize-y rounded-md border border-dune-deep bg-sandstone px-3.5 py-3 font-mono text-[13px] leading-relaxed text-ink placeholder:font-sans placeholder:text-[14px] placeholder:text-umber-light focus:border-pulse focus:outline-none focus:ring-1 focus:ring-pulse disabled:opacity-50"
        />

        <p className="text-xs leading-relaxed text-umber">
          {value.length.toLocaleString()} characters. This text is sent to the Anthropic API for
          synthesis — use synthetic case data only, never real patient information.
        </p>
      </div>
    </div>
  )
}
