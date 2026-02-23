import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

/**
 * Builds the LangChain LCEL pipeline for answering product enquiries.
 * prompt(question + product context) → Gemini → plain string reply
 *
 * Inputs:
 *   question — the user's original question
 *   context  — serialised product documents fetched from MongoDB
 *
 * Returns: string — a helpful, concise answer grounded in the product data
 */
export function buildEnquiryChain() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_API_KEY environment variable is not set');

  const model = new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash',
    temperature: 0.4,
    apiKey,
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are a helpful Amazon Alexa product support assistant.
Use ONLY the product information provided below to answer the user's question.
Be concise, friendly, and accurate. If the information is not in the context, say you don't have that detail and suggest contacting Amazon support.

Product Information:
{context}`,
    ],
    ['human', '{question}'],
  ]);

  return RunnableSequence.from([prompt, model, new StringOutputParser()]);
}
