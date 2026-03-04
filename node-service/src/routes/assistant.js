import { Router } from 'express';
import multer from 'multer';
import { transcribeAudio } from '../services/speechService.js';
import { requireAuth } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { processEnquiry } from '../graph/enquiry/workflow.js';
import { findOrCreateConversation, getRecentMessages, saveInteraction, clearConversation, getConversationMessageCount } from '../services/conversationService.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['audio/wav', 'audio/x-wav', 'audio/wave', 'audio/webm', 'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/flac'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio type: ${file.mimetype}`));
    }
  },
});

router.post('/transcribe', upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided. Send a file with field name "audio".' });
    }

    const result = await transcribeAudio(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    res.json(result);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      console.error('[assistant] transcribe error:', error.message);
    }
    res.status(status).json({ error: error.message || 'Transcription failed' });
  }
});

/**
 * POST /assistant/enquiry/text  (SSE — text input, no audio)
 *
 * Accepts JSON body: { "text": "user question" }.
 * Skips transcription; runs the enquiry LangGraph and streams same SSE format as /enquiry.
 */
router.post('/enquiry/text', requireAuth, async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const text = req.body?.text;
    if (!text || typeof text !== 'string' || !text.trim()) {
      sendEvent('error', { error: 'Request body must include a non-empty "text" string.' });
      return res.end();
    }

    const trimmed = text.trim();

    const user = await User.findById(req.user.userId).lean();
    if (!user) {
      sendEvent('error', { error: 'User not found.' });
      return res.end();
    }
    if (!user.clinic_id) {
      sendEvent('error', { error: 'User is not associated with a clinic.' });
      return res.end();
    }

    // Get or create conversation (auto-resets after 10 queries)
    const conversation = await findOrCreateConversation(user._id.toString());
    const conversationHistory = await getRecentMessages(conversation._id.toString());
    console.log('[enquiry/text] Using conversation:', conversation._id, '| history length:', conversationHistory.length);

    sendEvent('stage', { stage: 2, message: 'Understanding your question...' });

    const result = await processEnquiry(
      trimmed,
      { 
        userId: user._id, 
        userType: user.user_type, 
        clinicId: user.clinic_id,
        conversationId: conversation._id.toString(),
        conversationHistory,
      },
      (stageInfo) => sendEvent('stage', stageInfo),
    );

    // Save interaction to conversation
    const messageCount = await saveInteraction(
      conversation._id.toString(),
      trimmed,
      result.reply,
      { intent: result.intent, response_type: result.response_type },
    );

    const resultPayload = {
      reply: result.reply,
      intent: result.intent,
      transcription: trimmed,
      response_type: result.response_type ?? 'text',
      conversationId: conversation._id.toString(),
      conversationMessageCount: messageCount,
    };
    if (result.response_type === 'json' && result.response_data != null) {
      resultPayload.data = result.response_data;
    }
    console.log('[enquiry/text] sending result payload with conversationMessageCount:', messageCount);
    sendEvent('result', resultPayload);
  } catch (error) {
    console.error('[assistant] enquiry/text error:', error.message);
    sendEvent('error', { error: error.message || 'Enquiry processing failed' });
  } finally {
    res.end();
  }
});

/**
 * POST /assistant/enquiry  (SSE — Server-Sent Events)
 *
 * Accepts audio blob, transcribes via Whisper, then runs the enquiry LangGraph.
 * Streams progress stages back to the client as SSE events.
 * Requires JWT auth (sets req.user with userId, phone, user_type).
 *
 * SSE event format:
 *   event: stage
 *   data: { "stage": 1, "message": "Transcribing audio...", "data": { ... } }
 *
 *   event: result
 *   data: { "reply": "...", "intent": "...", "transcription": "..." }
 *
 *   event: error
 *   data: { "error": "..." }
 */
router.post('/enquiry', requireAuth, upload.single('audio'), async (req, res) => {
  res.writeHead(200, {
    'Content-Type':  'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection':    'keep-alive',
  });

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    if (!req.file) {
      sendEvent('error', { error: 'No audio file provided. Send a file with field name "audio".' });
      return res.end();
    }

    // Stage 1: Transcription
    sendEvent('stage', { stage: 1, message: 'Transcribing audio...' });

    const transcription = await transcribeAudio(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
    );
    const text = transcription.text || transcription.transcription;
    console.log('[enquiry] transcription raw:', JSON.stringify(transcription));
    console.log('[enquiry] text extracted:', text);

    if (!text || !text.trim()) {
      sendEvent('error', { error: 'Could not transcribe any speech from the audio.' });
      return res.end();
    }

    sendEvent('stage', {
      stage: 1,
      message: 'Transcription complete',
      data: { transcription: text.trim() },
    });

    // Look up full user to get clinic_id
    const user = await User.findById(req.user.userId).lean();
    console.log('[enquiry] user lookup:', user ? `id=${user._id} type=${user.user_type} clinic=${user.clinic_id}` : 'NOT FOUND');

    if (!user) {
      sendEvent('error', { error: 'User not found.' });
      return res.end();
    }
    if (!user.clinic_id) {
      sendEvent('error', { error: 'User is not associated with a clinic.' });
      return res.end();
    }

    // Get or create conversation (auto-resets after 10 queries)
    const conversation = await findOrCreateConversation(user._id.toString());
    const conversationHistory = await getRecentMessages(conversation._id.toString());
    console.log('[enquiry] Using conversation:', conversation._id, '| history length:', conversationHistory.length);

    console.log('[enquiry] invoking processEnquiry with:', { text: text.trim(), userId: user._id, userType: user.user_type, clinicId: user.clinic_id });

    // Stages 2–5: LangGraph (emits stage events via callback)
    const result = await processEnquiry(
      text.trim(),
      { 
        userId: user._id, 
        userType: user.user_type, 
        clinicId: user.clinic_id,
        conversationId: conversation._id.toString(),
        conversationHistory,
      },
      (stageInfo) => {
        console.log('[enquiry] SSE stage:', JSON.stringify(stageInfo));
        sendEvent('stage', stageInfo);
      },
    );

    console.log('[enquiry] processEnquiry result:', JSON.stringify({ reply: result.reply, intent: result.intent }));

    // Save interaction to conversation
    const messageCount = await saveInteraction(
      conversation._id.toString(),
      text.trim(),
      result.reply,
      { intent: result.intent, response_type: result.response_type },
    );

    // Final result
    const resultPayload = {
      reply:         result.reply,
      intent:         result.intent,
      transcription: text.trim(),
      response_type: result.response_type ?? 'text',
      conversationId: conversation._id.toString(),
      conversationMessageCount: messageCount,
    };
    if (result.response_type === 'json' && result.response_data != null) {
      resultPayload.data = result.response_data;
    }
    console.log('[enquiry/audio] sending result payload with conversationMessageCount:', messageCount);
    sendEvent('result', resultPayload);
  } catch (error) {
    console.error('[assistant] enquiry error:', error.message);
    sendEvent('error', { error: error.message || 'Enquiry processing failed' });
  } finally {
    res.end();
  }
});

/**
 * GET /assistant/conversations/current
 *
 * Returns the current conversation's message count for the authenticated user.
 * Used to show context state on page load (e.g. after refresh).
 * Requires JWT auth.
 */
router.get('/conversations/current', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const messageCount = await getConversationMessageCount(userId);
    console.log('[assistant] GET /conversations/current | userId:', userId, '| messageCount:', messageCount);
    res.json({ messageCount });
  } catch (error) {
    console.error('[assistant] get conversation current error:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to get conversation state',
    });
  }
});

/**
 * DELETE /assistant/conversations/clear
 *
 * Manually clears all conversations for the authenticated user.
 * Used when user clicks "Reset Conversation" or "New Chat" button.
 * Requires JWT auth.
 */
router.delete('/conversations/clear', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const deletedCount = await clearConversation(userId);
    
    console.log('[assistant] Cleared conversations for user:', userId, '| deleted:', deletedCount);
    
    res.json({ 
      success: true, 
      message: 'Conversation history cleared successfully.',
      deletedCount,
    });
  } catch (error) {
    console.error('[assistant] clear conversations error:', error.message);
    res.status(500).json({ 
      error: error.message || 'Failed to clear conversation history',
    });
  }
});

export default router;
