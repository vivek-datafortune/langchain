import { buildAnswerChain } from '../../../chains/answerChain.js';

const UNSUPPORTED_REPLY =
  `I can help with questions about your clinic, patients, and test results. ` +
  `For example: "What is my clinic's name?", "Find patient by phone 9876543210", ` +
  `"List tests where HbA1c is greater than 7", or "Give me a clinic summary."`;

// Intents where a template reply is enough (skip LLM call 2)
const TEMPLATE_INTENTS = new Set([
  'count_patients',
  'count_tests',
  'unsupported',
]);

// Intents where we send structured data for cards (response_type: 'json')
const JSON_RESPONSE_INTENTS = new Set([
  'list_patients',
  'list_tests',
  'find_patient_by_name',
  'find_patient_by_phone',
  'find_patient_by_email',
  'get_my_tests',
  'get_clinic',
  'clinic_summary',
  'patient_detail_with_tests',
]);

function withResponseType(reply, intent, dbResult) {
  const useJson =
    JSON_RESPONSE_INTENTS.has(intent) &&
    dbResult != null &&
    typeof dbResult === 'object' &&
    !dbResult.message;
  return {
    reply,
    response_type: useJson ? 'json' : 'text',
    ...(useJson && { response_data: dbResult }),
  };
}

// ---------------------------------------------------------------------------
// Node: formatReplyNode
// Converts dbResult into a natural-language reply.
// Uses a template for trivial results; calls answerChain for the rest.
// ---------------------------------------------------------------------------
export async function formatReplyNode(state) {
  const { intent, dbResult, content, error } = state;
  console.log('[formatReply] intent:', intent, '| has dbResult:', !!dbResult, '| error:', error);

  if (error && !dbResult) {
    console.warn('[formatReply] Replying with error fallback — state.error:', error);
    return withResponseType('Sorry, something went wrong while fetching your data. Please try again.', intent, null);
  }

  if (intent === 'unsupported') {
    console.log('[formatReply] unsupported intent — returning help message');
    return withResponseType(UNSUPPORTED_REPLY, intent, null);
  }

  if (TEMPLATE_INTENTS.has(intent) && dbResult) {
    const reply = buildTemplate(intent, dbResult);
    console.log('[formatReply] template reply:', reply);
    return withResponseType(reply, intent, dbResult);
  }

  try {
    const chain = buildAnswerChain();
    const data = JSON.stringify(dbResult, null, 2);
    console.log('[formatReply] calling answerChain | question:', content, '| data length:', data.length);
    const reply = await chain.invoke({ question: content, data });
    console.log('[formatReply] answerChain reply:', reply);
    return withResponseType(reply, intent, dbResult);
  } catch (err) {
    console.error('[formatReply] LLM error, falling back to raw data:', err.message);
    const fallbackReply = `Here is what I found:\n${JSON.stringify(dbResult, null, 2)}`;
    return withResponseType(fallbackReply, intent, dbResult);
  }
}

// ---------------------------------------------------------------------------
// Template builders for trivial results
// ---------------------------------------------------------------------------

function buildTemplate(intent, data) {
  switch (intent) {
    case 'count_patients':
      return `There are ${data.count ?? 0} patient(s) in your clinic.`;
    case 'count_tests':
      return `There are ${data.count ?? 0} test(s) on record.`;
    default:
      return JSON.stringify(data);
  }
}
