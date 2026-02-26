import { ChatGroq } from '@langchain/groq';

let langchainModel = null;

export function initializeAI() {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set. Get your free key from https://console.groq.com');
  }

  try {
    // LangChain model used by the LangGraph sentiment workflow
    langchainModel = new ChatGroq({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      apiKey,
    });
    
    console.log('Groq AI (LangChain) initialized with llama-3.3-70b-versatile model');
  } catch (error) {
    throw new Error(`Failed to initialize Groq AI: ${error.message}`);
  }
}

export function getLangChainModel() {
  if (!langchainModel) {
    throw new Error('LangChain model not initialized. Call initializeAI() first');
  }
  return langchainModel;
}

export default {
  initializeAI,
  getLangChainModel,
};
