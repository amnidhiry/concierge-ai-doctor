import { Suspense, lazy } from 'react'

/**
 * Defers the LiveKit SDK until a visit is actually opened.
 *
 * `livekit-client` plus `@livekit/components-react` is roughly 600 kB of the
 * bundle — more than twice everything else combined. Loading it eagerly would
 * make the marketing pages pay for a WebRTC stack that most visitors never
 * touch. Splitting here keeps the initial bundle close to its pre-video size and
 * moves the cost to the moment someone clicks into a call, where a brief load is
 * expected anyway.
 *
 * The import lives behind this component rather than at each call site so both
 * the physician modal and the standalone patient page share one chunk.
 */
const VideoVisitPanelImpl = lazy(() =>
  import('./VideoVisitPanel.jsx').then((m) => ({ default: m.VideoVisitPanel })),
)

function LoadingFallback() {
  return (
    <div className="px-6 py-12 text-center sm:px-8">
      <span className="mx-auto flex h-3 w-3 animate-breathe rounded-full bg-pulse" />
      <p className="mt-5 font-display text-xl text-ink">Loading video</p>
      <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-umber">
        Fetching the video components. This happens once per session.
      </p>
    </div>
  )
}

export function VideoVisitPanel(props) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VideoVisitPanelImpl {...props} />
    </Suspense>
  )
}
