import { StateGraph, START, END } from '@langchain/langgraph';
import { SentimentState } from './state.js';
import {
  callLLMNode,
  parseOutputNode,
  fallbackNode,
} from './nodes/sentimentNodes.js';
import { replyNeutralNode, replyFeedbackNode, replyAngryNode, replyEnquiryNode } from './nodes/replyNodes.js';

// ---------------------------------------------------------------------------
// Routing helpers
// ---------------------------------------------------------------------------
const routeAfterLLM = (state) => (state.error ? 'fallback' : 'parseOutput');

/**
 * After sentiment is determined (from LLM or fallback),
 * route to the appropriate reply node based on mood.
 * Add a case here each time a new reply node is implemented.
 */
const routeByMood = (state) => {
  switch (state.result?.mood) {
    case 'Neutral':  return 'replyNeutral';
    case 'Feedback': return 'replyFeedback';
    case 'Angry':    return 'replyAngry';
    case 'Enquiry':  return 'replyEnquiry';
    default:         return END;
  }
};

const routeAfterParseOutput = (state) => (state.error ? 'fallback' : routeByMood(state));
const routeAfterFallback    = (state) => routeByMood(state);

// ---------------------------------------------------------------------------
// Compile the LangGraph workflow (once, at module load)
//
// Current graph:
//   START → callLLM → parseOutput ── Neutral  → replyNeutral  → END
//                ↘(error)      ↘(error)  ├─ Feedback → replyFeedback → END (+ ticket, Low priority)
//                  fallback ──────────── ├─ Angry    → replyAngry   → END (+ ticket, High priority if complaint)
//                                        ├─ Enquiry  → replyEnquiry → END (product DB lookup + LLM answer)
//                                        └─ default  → END
// ---------------------------------------------------------------------------
const workflow = new StateGraph(SentimentState)
  // ── sentiment nodes ───────────────────────────────────────────────────────
  .addNode('callLLM',     callLLMNode)
  .addNode('parseOutput', parseOutputNode)
  .addNode('fallback',    fallbackNode)
  // ── reply nodes ───────────────────────────────────────────────────────────
  .addNode('replyNeutral',  replyNeutralNode)
  .addNode('replyFeedback', replyFeedbackNode)
  .addNode('replyAngry',    replyAngryNode)
  .addNode('replyEnquiry',  replyEnquiryNode)
  // ── edges ─────────────────────────────────────────────────────────────────
  .addEdge(START, 'callLLM')
  .addConditionalEdges('callLLM',     routeAfterLLM)
  .addConditionalEdges('parseOutput', routeAfterParseOutput)
  .addConditionalEdges('fallback',    routeAfterFallback)
  .addEdge('replyNeutral',  END)
  .addEdge('replyFeedback', END)
  .addEdge('replyAngry',    END)
  .addEdge('replyEnquiry',  END);

export const feedbackGraph = workflow.compile();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Process user feedback through the full LangGraph workflow.
 * Currently: sentiment analysis → (future: reply generation)
 *
 * @param {string} content - User feedback text
 * @returns {Promise<{mood: string, confidence: number, reasoning: string}>}
 */
export async function processFeedback(content) {
  if (!content || typeof content !== 'string') {
    throw new Error('Content must be a non-empty string');
  }

  const state = await feedbackGraph.invoke({ content });

  if (!state.result) {
    throw new Error('Failed to process feedback');
  }

  return {
    ...state.result,
    ...(state.reply && { reply: state.reply }),    ...(state.ticket && { ticket: state.ticket }),  };
}
