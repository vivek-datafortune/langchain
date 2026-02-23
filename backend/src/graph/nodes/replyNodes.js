import { buildFeedbackChain } from '../../chains/feedbackChain.js';
import { buildAngryChain } from '../../chains/angryChain.js';
import { buildEnquiryChain } from '../../chains/enquiryChain.js';
import { Ticket } from '../../models/Ticket.js';
import { Product } from '../../models/Product.js';

// ---------------------------------------------------------------------------
// Reply nodes — one node per mood, wired in workflow.js
// Each node writes to state.reply (+ optionally state.ticket) then exits to END.
// ---------------------------------------------------------------------------

/**
 * Node: replyNeutralNode
 * Mood: Neutral
 * Strategy: simple acknowledgment — no DB lookup, no LLM call needed.
 */
export function replyNeutralNode(state) {
  return {
    reply: `Thank you for reaching out! Is there anything specific we can help you with today?`,
  };
}

/**
 * Node: replyFeedbackNode
 * Mood: Feedback
 * Strategy:
 *   1. LLM extracts a clean title + description from raw user feedback
 *   2. A ticket is created in MongoDB (status: Open)
 *   3. A gratitude reply is returned to the user
 */
export async function replyFeedbackNode(state) {
  try {
    const chain = buildFeedbackChain();
    const { title, description } = await chain.invoke({ content: state.content });

    const ticket = await Ticket.create({ title, description });

    return {
      reply: `Thank you for your feedback! We've logged it and will look into it shortly.`,
      ticket: { id: ticket._id, title: ticket.title, status: ticket.status },
    };
  } catch (err) {
    console.error('replyFeedbackNode error:', err.message);
    // Non-fatal: still reply gracefully even if ticket creation fails
    return {
      reply: `Thank you for your feedback! We appreciate you taking the time to share it with us.`,
    };
  }
}

// ---------------------------------------------------------------------------
// Enquiry helper — formats Product documents into a readable context string
// NOTE: .lean() converts Mongoose Map → plain object, so use Object.entries()
// ---------------------------------------------------------------------------
function formatProductContext(products) {
  if (!products.length) return 'No specific product information found.';

  return products.map(p => {
    // specifications is a plain object after .lean() — use Object.entries()
    const specs = p.specifications && typeof p.specifications === 'object'
      ? Object.entries(p.specifications).map(([k, v]) => `    ${k}: ${v}`).join('\n')
      : '';
    const features = p.features?.length
      ? p.features.map(f => `  - ${f}`).join('\n')
      : '';

    return [
      `### ${p.name} (${p.category})`,
      p.description,
      features ? `Features:\n${features}` : '',
      specs     ? `Specifications:\n${specs}` : '',
    ].filter(Boolean).join('\n');
  }).join('\n\n');
}

/**
 * Node: replyEnquiryNode
 * Mood: Enquiry
 * Strategy:
 *   1. Full-text search MongoDB Products with the user's question
 *   2. Format matching products as context
 *   3. LLM composes a grounded, concise answer from that context
 */
export async function replyEnquiryNode(state) {
  console.log('[replyEnquiryNode] START — question:', state.content);

  try {
    // 1. Text search — weighted index on name, tags, features, description
    console.log('[replyEnquiryNode] Step 1: Running MongoDB text search...');
    const matches = await Product.find(
      { $text: { $search: state.content } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(3)
      .lean();
    console.log(`[replyEnquiryNode] Step 1: Text search returned ${matches.length} match(es):`,
      matches.map(p => `"${p.name}" (score: ${p.score?.toFixed(2)})`));

    // 2. Fallback: broad search if text index finds nothing
    let products = matches;
    if (!matches.length) {
      console.log('[replyEnquiryNode] Step 2: No text matches — falling back to top-5 products');
      products = await Product.find().limit(5).lean();
      console.log(`[replyEnquiryNode] Step 2: Fallback returned ${products.length} product(s)`);
    }

    const context = formatProductContext(products);
    console.log(`[replyEnquiryNode] Step 2: Context built — ${context.length} chars`);

    // 3. LLM answers using product context
    console.log('[replyEnquiryNode] Step 3: Calling enquiryChain (LLM)...');
    const chain = buildEnquiryChain();
    const reply = await chain.invoke({ question: state.content, context });
    console.log('[replyEnquiryNode] Step 3: LLM reply received —', reply?.slice(0, 120), '...');

    return { reply };
  } catch (err) {
    console.error('[replyEnquiryNode] ERROR at:', err.message, err.stack);
    return {
      reply: `I'm sorry, I couldn't retrieve product details right now. Please visit amazon.com/alexa or contact Amazon support for accurate information.`,
    };
  }
}

/**
 * Node: replyAngryNode
 * Mood: Angry
 * Strategy:
 *   1. LLM detects whether the message contains a concrete complaint
 *   2. If yes → create a High priority ticket in MongoDB
 *   3. Always return an apology reply regardless
 */
export async function replyAngryNode(state) {
  const baseReply = `We're really sorry to hear you're upset — that's not the experience we want for you. `;

  try {
    const chain = buildAngryChain();
    const { hasComplaint, title, description } = await chain.invoke({ content: state.content });

    if (hasComplaint && title && description) {
      const ticket = await Ticket.create({ title, description, priority: 'High' });
      return {
        reply: baseReply + `We've escalated your complaint and our team will be in touch shortly.`,
        ticket: { id: ticket._id, title: ticket.title, status: ticket.status, priority: ticket.priority },
      };
    }

    // Pure venting — no actionable complaint detected
    return {
      reply: baseReply + `Please don't hesitate to reach out if there's anything we can do to help.`,
    };
  } catch (err) {
    console.error('replyAngryNode error:', err.message);
    // Non-fatal: always send the apology even if LLM/DB fails
    return {
      reply: baseReply + `Please contact our support team and we'll make it right.`,
    };
  }
}
