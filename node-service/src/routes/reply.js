import express from 'express';
import { processFeedback } from '../graph/workflow.js';
import { formatResponse, formatError } from '../utils/helpers.js';

const router = express.Router();

/**
 * POST /api/reply
 * Analyzes user feedback and returns sentiment/mood classification
 * 
 * Body: {
 *   "content": "user feedback text"
 * }
 * 
 * Response: {
 *   "mood": "Angry|Neutral|Feedback|Enquiry",
 *   "confidence": 0.0-1.0,
 *   "reasoning": "explanation"
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { content } = req.body;

    // Validate input
    if (!content) {
      return res.status(400).json(
        formatError('Content is required', 400)
      );
    }

    if (typeof content !== 'string') {
      return res.status(400).json(
        formatError('Content must be a string', 400)
      );
    }

    if (content.trim().length === 0) {
      return res.status(400).json(
        formatError('Content cannot be empty or whitespace only', 400)
      );
    }

    // Process feedback through the full workflow
    const result = await processFeedback(content);

    // Return success response
    res.json(formatResponse({
      mood:       result.mood,
      confidence: result.confidence,
      reasoning:  result.reasoning,
      ...(result.reply   && { reply:  result.reply }),
      ...(result.ticket  && { ticket: result.ticket }),
    }));
  } catch (error) {
    console.error('Reply endpoint error:', error.message);

    const statusCode = error.message.includes('Failed to process') ? 500 : 400;
    res.status(statusCode).json(
      formatError(error.message || 'Failed to analyze sentiment', statusCode)
    );
  }
});

export default router;
