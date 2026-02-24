import { ChatGroq } from '@langchain/groq';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

/**
 * Builds the LangChain LCEL pipeline for analysing an angry message.
 * prompt → Gemini → JSON parser
 *
 * Returns:
 * {
 *   hasComplaint: boolean,      — true if user has a concrete complaint
 *   title:        string|null,  — short ticket title (null if no complaint)
 *   description:  string|null   — full complaint description (null if no complaint)
 * }
 */
export function buildAngryChain() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY environment variable is not set');

  const model = new ChatGroq({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2,
    apiKey,
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are a support analyst. A user is angry. Determine if they have a specific complaint that needs to be actioned.
A complaint is a concrete problem (e.g. broken feature, wrong charge, missing order).
Pure venting with no actionable issue is NOT a complaint.

Respond in JSON format ONLY – no extra text:
{{
  "hasComplaint": true | false,
  "title":        "short one-line summary (max 10 words) or null",
  "description":  "clear description of the complaint or null"
}}`,
    ],
    ['human', '{content}'],
  ]);

  return RunnableSequence.from([prompt, model, new JsonOutputParser()]);
}
