import { ChatGroq } from '@langchain/groq';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

const INTENT_LIST = [
  'get_clinic',
  'get_my_tests',
  'find_patient_by_phone',
  'find_patient_by_email',
  'find_patient_by_name',
  'list_patients',
  'list_tests',
  'count_patients',
  'count_tests',
  'clinic_summary',
  'patient_detail_with_tests',
  'unsupported',
];

/**
 * Builds the LCEL chain for intent + parameter extraction from a user question.
 * prompt -> Groq -> JsonOutputParser
 *
 * Returns: { intent: string, params: object }
 */
export function buildIntentChain() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY environment variable is not set');

  const model = new ChatGroq({
    model: 'llama-3.3-70b-versatile',
    temperature: 0,
    apiKey,
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are an intent classifier for a medical clinic enquiry system.
Given a user question, classify it into exactly ONE intent and extract relevant parameters.

Allowed intents:
- get_clinic: user asks about their clinic details (name, email, phone, location/address, active status)
- get_my_tests: user asks about their own tests (list, latest, count)
- find_patient_by_phone: staff looks up a patient by phone number
- find_patient_by_email: staff looks up a patient by email
- find_patient_by_name: staff looks up a patient by name
- list_patients: staff asks for a list of patients in their clinic
- list_tests: staff asks for tests at their clinic (may include filters)
- count_patients: user asks how many patients are in their clinic
- count_tests: user asks how many tests exist (at clinic or for themselves)
- clinic_summary: user asks for a summary of their clinic (counts, info, etc.)
- patient_detail_with_tests: staff asks for a specific patient profile AND their tests
- unsupported: question does not fit any of the above

Extract parameters when present (omit keys that are not mentioned):
- phone: 10-digit phone number
- name: patient name
- email: email address
- date_from: ISO date string (start of range)
- date_to: ISO date string (end of range)
- hba1c_gt: number (HbA1c greater than)
- hba1c_lt: number (HbA1c less than)
- test_type: test type string
- sort_by: field to sort by (e.g. "created_at", "hba1c_value")
- sort_order: "asc" or "desc"
- limit: number of results to return

Respond in JSON format ONLY — no extra text:
{{
  "intent": "one of the allowed intents",
  "params": {{ ... }}
}}`,
    ],
    ['human', '{content}'],
  ]);

  return RunnableSequence.from([prompt, model, new JsonOutputParser()]);
}

export { INTENT_LIST };
