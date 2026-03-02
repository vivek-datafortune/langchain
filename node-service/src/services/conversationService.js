import { Conversation } from '../models/Conversation.js';

const MAX_QUERIES = 10;
const CONTEXT_MESSAGE_LIMIT = 9; // Pass last 9 messages as context (keep 1 slot for current query)

/**
 * Find or create a conversation for the user.
 * Auto-creates a new conversation if the current one has reached MAX_QUERIES.
 *
 * @param {string} userId - The user's ID
 * @returns {Promise<Conversation>} The active conversation
 */
export async function findOrCreateConversation(userId) {
  if (!userId) throw new Error('userId is required');

  // Find most recent conversation for this user
  let conversation = await Conversation.findOne({ userId })
    .sort({ updatedAt: -1 });

  if (!conversation) {
    console.log('[conversationService] No conversation found, creating new one for user:', userId);
    return await Conversation.create({
      userId,
      title: 'Medical Enquiry Session',
      messages: [],
    });
  }

  // Count user messages (queries)
  const userMsgCount = conversation.messages.filter(m => m.role === 'user').length;
  console.log('[conversationService] Found conversation:', conversation._id, '| user messages:', userMsgCount);

  // Auto-reset if limit reached
  if (userMsgCount >= MAX_QUERIES) {
    console.log('[conversationService] Query limit reached, creating fresh conversation for user:', userId);
    return await Conversation.create({
      userId,
      title: 'Medical Enquiry Session',
      messages: [],
    });
  }

  return conversation;
}

/**
 * Save a user query and assistant reply to the conversation.
 *
 * @param {string} conversationId - The conversation ID
 * @param {string} userMessage - The user's query text
 * @param {string} assistantMessage - The assistant's reply text
 * @param {object} metadata - Optional metadata (intent, response_type, etc.)
 * @returns {Promise<void>}
 */
export async function saveInteraction(conversationId, userMessage, assistantMessage, metadata = {}) {
  if (!conversationId || !userMessage || !assistantMessage) {
    throw new Error('conversationId, userMessage, and assistantMessage are required');
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new Error(`Conversation ${conversationId} not found`);
  }

  conversation.messages.push(
    {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    },
    {
      role: 'assistant',
      content: assistantMessage,
      timestamp: new Date(),
      metadata,
    }
  );

  await conversation.save();
  console.log('[conversationService] Saved interaction to conversation:', conversationId, '| total messages:', conversation.messages.length);
}

/**
 * Get recent messages from a conversation for context.
 * Returns last N messages (user + assistant pairs).
 *
 * @param {string} conversationId - The conversation ID
 * @param {number} limit - Maximum number of messages to return (default: CONTEXT_MESSAGE_LIMIT)
 * @returns {Promise<Array>} Array of messages [{role, content}]
 */
export async function getRecentMessages(conversationId, limit = CONTEXT_MESSAGE_LIMIT) {
  if (!conversationId) return [];

  const conversation = await Conversation.findById(conversationId).lean();
  if (!conversation || !conversation.messages || conversation.messages.length === 0) {
    return [];
  }

  // Get last N messages
  const recent = conversation.messages.slice(-limit);
  console.log('[conversationService] Retrieved', recent.length, 'recent messages from conversation:', conversationId);

  return recent.map(m => ({
    role: m.role,
    content: m.content,
  }));
}

/**
 * Clear (delete) all conversations for a user.
 * Used when user clicks "Reset Conversation" button.
 *
 * @param {string} userId - The user's ID
 * @returns {Promise<number>} Number of conversations deleted
 */
export async function clearConversation(userId) {
  if (!userId) throw new Error('userId is required');

  const result = await Conversation.deleteMany({ userId });
  console.log('[conversationService] Cleared', result.deletedCount, 'conversation(s) for user:', userId);
  return result.deletedCount;
}
