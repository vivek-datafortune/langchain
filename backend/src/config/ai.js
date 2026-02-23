import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

let genAI = null;
let model = null;
let langchainModel = null;

export function initializeAI() {
  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY environment variable is not set. Get your key from https://aistudio.google.com/api-keys');
  }

  try {
    // Legacy Google AI client (kept for backward compatibility)
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      }
    });

    // LangChain model used by the LangGraph sentiment workflow
    langchainModel = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-flash',
      temperature: 0.3,
      apiKey,
    });
    
    console.log('Google AI (direct + LangChain) initialized with gemini-2.5-flash model');
  } catch (error) {
    throw new Error(`Failed to initialize Google AI: ${error.message}`);
  }
}

export function getModel() {
  if (!model) {
    throw new Error('AI model not initialized. Call initializeAI() first');
  }
  return model;
}

export function getLangChainModel() {
  if (!langchainModel) {
    throw new Error('LangChain model not initialized. Call initializeAI() first');
  }
  return langchainModel;
}

export function getGenAI() {
  if (!genAI) {
    throw new Error('GenAI client not initialized. Call initializeAI() first');
  }
  return genAI;
}

export async function generateContent(prompt) {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    throw new Error(`Content generation failed: ${error.message}`);
  }
}

export default {
  initializeAI,
  getModel,
  getLangChainModel,
  getGenAI,
  generateContent
};
