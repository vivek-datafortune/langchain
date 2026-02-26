import { buildLLMChain } from '../../chains/sentimentChain.js';

// ---------------------------------------------------------------------------
// Node 1 – call the LangChain LCEL chain (prompt → Gemini → JSON parser)
// ---------------------------------------------------------------------------
export async function callLLMNode(state) {
  try {
    const chain = buildLLMChain();
    const llmOutput = await chain.invoke({ content: state.content });
    return { llmOutput, error: null };
  } catch (err) {
    console.warn('LLM call failed, will use fallback:', err.message);
    return { error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Node 2 – validate & normalise the parsed JSON from the LLM
// ---------------------------------------------------------------------------
export function parseOutputNode(state) {
  const parsed = state.llmOutput;
  const validMoods = ['Angry', 'Neutral', 'Feedback', 'Enquiry'];

  if (!parsed || !validMoods.includes(parsed.mood)) {
    console.warn('Invalid LLM output, will use fallback:', parsed);
    return { error: `Invalid mood value: ${parsed?.mood}` };
  }

  return {
    result: {
      mood:       parsed.mood,
      confidence: Math.min(Math.max(parseFloat(parsed.confidence) || 0.5, 0), 1),
      reasoning:  parsed.reasoning || 'Analysis complete',
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Node 3 – heuristic fallback when the LLM is unavailable or returns garbage
// ---------------------------------------------------------------------------
export function fallbackNode(state) {
  console.warn('Using heuristic fallback for sentiment detection');
  return { result: detectSentimentFallback(state.content), usedFallback: true };
}

// ---------------------------------------------------------------------------
// Heuristic helper (private to this module)
// ---------------------------------------------------------------------------
function detectSentimentFallback(content) {
  const lowerContent = content.toLowerCase();

  const angryWords    = ['angry', 'furious', 'hate', 'terrible', 'awful', 'worst', 'disgusted', 'outrageous', '!!!', 'unacceptable'];
  const enquiryWords  = ['how', 'what', 'when', 'where', 'why', 'can you', 'could you', 'help', 'question', '?'];
  const feedbackWords = ['suggest', 'recommend', 'improve', 'better', 'feature', 'idea', 'think', 'opinion', 'feedback'];

  const angryCount    = angryWords.filter(w => lowerContent.includes(w)).length;
  const enquiryCount  = enquiryWords.filter(w => lowerContent.includes(w)).length;
  const feedbackCount = feedbackWords.filter(w => lowerContent.includes(w)).length;

  let mood = 'Neutral', confidence = 0.6, reasoning = 'Detected using fallback heuristics';

  if (angryCount > enquiryCount && angryCount > feedbackCount) {
    mood = 'Angry';
    confidence = Math.min(0.9, 0.5 + angryCount * 0.1);
    reasoning = `Detected ${angryCount} anger indicator(s)`;
  } else if (enquiryCount > feedbackCount) {
    mood = 'Enquiry';
    confidence = Math.min(0.9, 0.5 + enquiryCount * 0.1);
    reasoning = `Detected ${enquiryCount} enquiry indicator(s)`;
  } else if (feedbackCount > 0) {
    mood = 'Feedback';
    confidence = Math.min(0.9, 0.5 + feedbackCount * 0.1);
    reasoning = `Detected ${feedbackCount} feedback indicator(s)`;
  }

  return {
    mood,
    confidence: Math.min(Math.max(confidence, 0), 1),
    reasoning,
  };
}
