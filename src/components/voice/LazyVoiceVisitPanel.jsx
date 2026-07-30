import { Suspense, lazy } from 'react'

/**
 * Defers the LiveKit SDK until a call is actually opened.
 *
 * `livekit-client` plus `@livekit/components-react` is the largest single piece of
 * the bundle by a wide margin. Loading it eagerly would make the marketing pages
 * pay for a WebRTC stack that most visitors never touch. Splitting here keeps the
 * initial bundle small and moves the cost to the moment someone joins a call,
 * where a brief load is expected anyway.
 *
 * The import lives behind this component rather than at each call site so both
 * the physician's visit view and the standalone patient page share one chunk.
 */
const VoiceVisitPanelImpl = lazy(() =>
  import('./VoiceVisitPanel.jsx').then((m) => ({ default: m.VoiceVisitPanel })),
)

function LoadingFallback() {
  return (
    <div className="px-6 py-12 text-center sm:px-8">
      <span className="mx-auto flex h-3 w-3 animate-breathe rounded-full bg-pulse" />
      <p className="mt-5 text-title text-ink">Loading the call</p>
      <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-umber">
        Fetching the audio components. This happens once per session.
      </p>
    </div>
  )
}

export function VoiceVisitPanel(props) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VoiceVisitPanelImpl {...props} />
    </Suspense>
  )
}
