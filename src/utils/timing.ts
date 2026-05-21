// Central source of truth for all quiz timing and animation durations.
// Change a value here and every dependent useEffect / CSS variable updates.
//
// Sequence after an answer:
//
//   0ms ─────────────────── answer registered, green/red appears instantly
//   ANSWER_FEEDBACK_MS ───── card begins exit transition
//   + CARD_TRANSITION_MS ─── content swaps (new question), enter animation fires
//   + CARD_ENTER_MS ─────── new question fully visible
//
//   Total ≈ 950ms (vs previous 1200ms flat wait)
//   Perceived delay ≈ 600ms because motion signals progress from that point

export const TIMING = {
  // How long the green/red feedback is shown before the exit animation starts.
  // 600ms: long enough to register the result, short enough to feel snappy.
  ANSWER_FEEDBACK_MS: 600,

  // Duration of the card fade-out + slide-up before the question swaps.
  // Keep this ≤ 200ms — perceptible but not distracting.
  CARD_TRANSITION_MS: 150,

  // Duration of the card fade-in + slide-up after the new question appears.
  // Slightly longer than exit so entering content feels weightier than leaving.
  CARD_ENTER_MS: 200,
} as const
