import { Annotation } from '@langchain/langgraph';

/**
 * Shared state schema for the enquiry workflow.
 *
 * reducer: (_, v) => v  →  simple overwrite strategy:
 *   each node returns only the fields it wants to update; others stay untouched.
 */
export const EnquiryState = Annotation.Root({
  // ── Input ──────────────────────────────────────────────────────────────────
  content:   Annotation({ reducer: (_, v) => v, default: () => '' }),
  userId:    Annotation({ reducer: (_, v) => v, default: () => null }),
  userType:  Annotation({ reducer: (_, v) => v, default: () => null }),
  clinicId:  Annotation({ reducer: (_, v) => v, default: () => null }),

  // ── Conversation context ───────────────────────────────────────────────────
  conversationId: Annotation({ reducer: (_, v) => v, default: () => null }),
  conversationHistory: Annotation({ reducer: (_, v) => v, default: () => [] }),

  // ── Intent extraction ──────────────────────────────────────────────────────
  intent:    Annotation({ reducer: (_, v) => v, default: () => null }),
  params:    Annotation({ reducer: (_, v) => v, default: () => ({}) }),

  // ── Data fetch ─────────────────────────────────────────────────────────────
  dbResult:  Annotation({ reducer: (_, v) => v, default: () => null }),

  // ── Reply ──────────────────────────────────────────────────────────────────
  reply:          Annotation({ reducer: (_, v) => v, default: () => null }),
  response_type: Annotation({ reducer: (_, v) => v, default: () => null }),
  response_data: Annotation({ reducer: (_, v) => v, default: () => null }),

  // ── Shared error channel ───────────────────────────────────────────────────
  error:     Annotation({ reducer: (_, v) => v, default: () => null }),
});
