import { Annotation } from '@langchain/langgraph';

/**
 * Shared state schema for the sentiment + reply workflow.
 *
 * As new steps are added (enquiry DB lookup, feedback gratitude reply, etc.)
 * simply extend this schema with new fields.
 *
 * reducer: (_, v) => v  →  simple overwrite strategy:
 *   each node returns only the fields it wants to update; others stay untouched.
 */
export const SentimentState = Annotation.Root({
  // ── Input ──────────────────────────────────────────────────────────────────
  content:      Annotation({ reducer: (_, v) => v, default: () => '' }),

  // ── Sentiment analysis ─────────────────────────────────────────────────────
  llmOutput:    Annotation({ reducer: (_, v) => v, default: () => null }),
  result:       Annotation({ reducer: (_, v) => v, default: () => null }),
  usedFallback: Annotation({ reducer: (_, v) => v, default: () => false }),

  // ── Reply generation ────────────────────────────────────────────────────────
  reply:     Annotation({ reducer: (_, v) => v, default: () => null }),
  ticket:    Annotation({ reducer: (_, v) => v, default: () => null }),
  // dbContext: Annotation({ reducer: (_, v) => v, default: () => null }), // future: Enquiry DB lookup

  // ── Shared error channel ───────────────────────────────────────────────────
  error:        Annotation({ reducer: (_, v) => v, default: () => null }),
});
