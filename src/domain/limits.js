/**
 * Client-side mirror of the server's triage limits.
 *
 * Duplicated rather than imported from server/guards.js on purpose: importing
 * server code into the bundle would drag the whole guard implementation —
 * including its in-memory client map — into the browser.
 *
 * These values are **UX hints only**. Their job is to disable the send button
 * and show a counter before the user hits a wall, not to enforce anything. The
 * server recomputes every limit from the request payload and is the only real
 * control; if these two drift, the server wins and the client just shows a
 * slightly late error.
 */
export const CLIENT_LIMITS = {
  MAX_TURNS: 14,
  MAX_MESSAGE_CHARS: 2_000,
}
