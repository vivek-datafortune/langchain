import { ChatGroq } from '@langchain/groq';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

/**
 * Builds the LCEL chain for formatting DB query results into a natural-language reply.
 * prompt(question + data) -> Groq -> StringOutputParser
 *
 * Inputs:
 *   question — the user's original question
 *   data     — JSON-stringified DB results
 *
 * Returns: string — a friendly, concise answer grounded in the data
 */
export function buildAnswerChain() {
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
      `You are a helpful medical clinic assistant. Answer the user's question using ONLY the data provided below.

Rules:
- Always respond in English, regardless of the language or script of the user's question.
- When the data below contains results (e.g. tests, patients, clinic info), summarize them clearly and helpfully. Do NOT say the user did not ask a specific question when data is provided.
- Be concise, friendly, and accurate. Format dates in a readable way. Format numbers clearly.
- If the data is empty or null, say you couldn't find any matching records.
- Do NOT invent data that is not in the provided context.

Data:
{data}`,
    ],
    ['human', '{question}'],
  ]);

  return RunnableSequence.from([prompt, model, new StringOutputParser()]);
}
