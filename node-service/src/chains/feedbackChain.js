import { ChatGroq } from '@langchain/groq';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

/**
 * Builds the LangChain LCEL pipeline for extracting a ticket from feedback.
 * prompt → Gemini → JSON parser
 *
 * Returns: { title: string, description: string }
 */
export function buildFeedbackChain() {
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
      `You are a product support assistant. A user has submitted feedback.
Extract a concise ticket from it and respond in JSON format ONLY – no extra text:
{{
  "title":       "short one-line summary (max 10 words)",
  "description": "clear, complete description of the feedback"
}}`,
    ],
    ['human', '{content}'],
  ]);

  return RunnableSequence.from([prompt, model, new JsonOutputParser()]);
}
