import { StateGraph, START, END } from '@langchain/langgraph';
import { EnquiryState } from './state.js';
import { extractIntentNode, intentFallbackNode } from './nodes/intentNodes.js';
import { fetchDataNode } from './nodes/fetchDataNode.js';
import { formatReplyNode } from './nodes/formatReplyNode.js';

// ---------------------------------------------------------------------------
// Routing helpers
// ---------------------------------------------------------------------------
const routeAfterExtract = (state) =>
  state.error ? 'intentFallback' : 'fetchData';

// ---------------------------------------------------------------------------
// Compile the LangGraph enquiry workflow (once, at module load)
//
// Graph:
//   START → extractIntent ─── (ok)  → fetchData → formatReply → END
//                          └─ (err) → intentFallback → fetchData → formatReply → END
// ---------------------------------------------------------------------------
const workflow = new StateGraph(EnquiryState)
  .addNode('extractIntent',   extractIntentNode)
  .addNode('intentFallback',  intentFallbackNode)
  .addNode('fetchData',       fetchDataNode)
  .addNode('formatReply',     formatReplyNode)
  .addEdge(START, 'extractIntent')
  .addConditionalEdges('extractIntent', routeAfterExtract)
  .addEdge('intentFallback', 'fetchData')
  .addEdge('fetchData', 'formatReply')
  .addEdge('formatReply', END);

export const enquiryGraph = workflow.compile();

// ---------------------------------------------------------------------------
// Public API — streaming (SSE-friendly)
// ---------------------------------------------------------------------------

const NODE_STAGE_MAP = {
  extractIntent:  { stage: 2, message: 'Understanding your question...' },
  intentFallback: { stage: 2, message: 'Understanding your question...' },
  fetchData:      { stage: 3, message: 'Fetching data from records...' },
  formatReply:    { stage: 4, message: 'Composing your answer...' },
};

/**
 * Process a user enquiry through the LangGraph workflow, streaming stage
 * events as each node completes.
 *
 * @param {string}   content     - The user's question text
 * @param {object}   context     - { userId, userType, clinicId }
 * @param {function} [onStage]   - Optional callback({ stage, message, data? }) for SSE
 * @returns {Promise<{ reply: string, intent: string, dbResult: any }>}
 */
export async function processEnquiry(content, { userId, userType, clinicId }, onStage) {
  if (!content || typeof content !== 'string') {
    throw new Error('Content must be a non-empty string');
  }
  if (!userId || !clinicId) {
    throw new Error('userId and clinicId are required');
  }

  const emit = typeof onStage === 'function' ? onStage : () => {};

  let finalState = {};

  const stream = await enquiryGraph.stream({
    content,
    userId,
    userType,
    clinicId,
  });

  for await (const chunk of stream) {
    const nodeName = Object.keys(chunk)[0];
    const nodeOutput = chunk[nodeName];

    Object.assign(finalState, nodeOutput);

    const stageInfo = NODE_STAGE_MAP[nodeName];
    if (stageInfo) {
      const payload = { ...stageInfo };
      if (nodeName === 'extractIntent' || nodeName === 'intentFallback') {
        payload.data = { intent: nodeOutput.intent || null };
      }
      emit(payload);
    }
  }

  emit({ stage: 5, message: 'Done' });

  return {
    reply:          finalState.reply || 'Sorry, I could not generate a response.',
    intent:         finalState.intent,
    dbResult:       finalState.dbResult,
    response_type: finalState.response_type ?? 'text',
    response_data:  finalState.response_data ?? null,
  };
}
