import { buildIntentChain, INTENT_LIST } from '../../../chains/intentChain.js';

const STAFF_ONLY_INTENTS = new Set([
  'find_patient_by_phone',
  'find_patient_by_email',
  'find_patient_by_name',
  'list_patients',
  'count_patients',
  'patient_detail_with_tests',
]);

const PATIENT_ALLOWED_INTENTS = new Set([
  'get_clinic',
  'get_my_tests',
  'count_tests',
  'clinic_summary',
]);

// ---------------------------------------------------------------------------
// Node: extractIntentNode  (LLM call 1)
// ---------------------------------------------------------------------------
export async function extractIntentNode(state) {
  console.log('[extractIntent] question:', state.content, '| userType:', state.userType);
  try {
    const chain = buildIntentChain();
    const llmOutput = await chain.invoke({ content: state.content });
    console.log('[extractIntent] LLM raw output:', JSON.stringify(llmOutput));

    const { intent, params } = llmOutput;

    if (!INTENT_LIST.includes(intent)) {
      console.warn('[extractIntent] Unknown intent from LLM:', intent);
      return { error: `Unknown intent: ${intent}` };
    }

    const validated = applyRoleGuard(intent, state.userType);
    console.log('[extractIntent] intent:', intent, '→ after role guard:', validated, '| params:', JSON.stringify(params));
    return { intent: validated, params: params || {}, error: null };
  } catch (err) {
    console.warn('[extractIntent] LLM call failed, will use fallback:', err.message);
    return { error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Node: intentFallbackNode  (keyword heuristic)
// ---------------------------------------------------------------------------
export function intentFallbackNode(state) {
  console.warn('[intentFallback] Using keyword heuristic');
  const q = state.content.toLowerCase();

  let intent = 'unsupported';
  const params = {};

  const phoneMatch = state.content.match(/\b\d{10}\b/);
  const emailMatch = state.content.match(/\b[\w.-]+@[\w.-]+\.\w+\b/);

  if (phoneMatch) {
    intent = 'find_patient_by_phone';
    params.phone = phoneMatch[0];
  } else if (emailMatch) {
    intent = 'find_patient_by_email';
    params.email = emailMatch[0];
  } else if (/patient.*name|find.*name|details.*name|name.*patient/.test(q)) {
    intent = 'find_patient_by_name';
    const nameMatch = state.content.match(/(?:named?|for)\s+["']?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)["']?/i);
    if (nameMatch) params.name = nameMatch[1];
  } else if (/list.*patient|all.*patient|show.*patient/.test(q)) {
    intent = 'list_patients';
  } else if (/how many.*patient|count.*patient|number of.*patient/.test(q)) {
    intent = 'count_patients';
  } else if (/how many.*test|count.*test|number of.*test/.test(q)) {
    intent = 'count_tests';
  } else if (/list.*test|show.*test|all.*test|tests.*clinic/.test(q)) {
    intent = 'list_tests';
    extractTestFilters(q, state.content, params);
  } else if (/my.*test|test.*result|hba1c/.test(q)) {
    intent = 'get_my_tests';
  } else if (/summary|overview/.test(q)) {
    intent = 'clinic_summary';
  } else if (/clinic.*name|clinic.*email|clinic.*phone|clinic.*address|clinic.*locat|where.*clinic|my clinic/.test(q)) {
    intent = 'get_clinic';
  }

  const validated = applyRoleGuard(intent, state.userType);
  return { intent: validated, params, error: null };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function applyRoleGuard(intent, userType) {
  if (userType === 'patient' && STAFF_ONLY_INTENTS.has(intent)) {
    return 'unsupported';
  }
  if (userType === 'staff' && intent === 'get_my_tests') {
    return 'unsupported';
  }
  return intent;
}

function extractTestFilters(q, raw, params) {
  const gtMatch = raw.match(/(?:greater than|above|>|gt)\s*([\d.]+)/i);
  const ltMatch = raw.match(/(?:less than|below|<|lt)\s*([\d.]+)/i);
  if (gtMatch) params.hba1c_gt = parseFloat(gtMatch[1]);
  if (ltMatch) params.hba1c_lt = parseFloat(ltMatch[1]);

  const afterMatch = raw.match(/(?:after|from|since)\s+(\d{4}[-/]\d{1,2}[-/]\d{1,2})/i);
  const beforeMatch = raw.match(/(?:before|until|to)\s+(\d{4}[-/]\d{1,2}[-/]\d{1,2})/i);
  if (afterMatch) params.date_from = afterMatch[1];
  if (beforeMatch) params.date_to = beforeMatch[1];
}
