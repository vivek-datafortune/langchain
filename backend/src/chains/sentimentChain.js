import { ChatGroq } from '@langchain/groq';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

/**
 * Builds the LangChain LCEL pipeline: prompt → Gemini → JSON parser.
 * This is a pure LLM chain — no graph state, no routing, no side effects.
 *
 * Add more chains (e.g. replyChain.js) alongside this file for each
 * distinct LLM task in the workflow.
 */
export function buildLLMChain() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY environment variable is not set');

  const model = new ChatGroq({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3,
    apiKey,
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are a sentiment analysis expert. Classify the user feedback into exactly ONE of these categories: Angry, Neutral, Feedback, Enquiry.
Respond in JSON format ONLY – no extra text:
{{
  "mood": "Angry|Neutral|Feedback|Enquiry",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}}`,
    ],
    ['human', '{content}'],
  ]);

  return RunnableSequence.from([prompt, model, new JsonOutputParser()]);
}
