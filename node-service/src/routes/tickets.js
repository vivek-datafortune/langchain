import express from 'express';
import Ticket from '../models/Ticket.js';

const router = express.Router();

// GET /api/tickets — list all tickets, newest first, optional ?status & ?priority filters
router.get('/', async (req, res, next) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;

    const skip = (Number(page) - 1) * Number(limit);

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Ticket.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        tickets: tickets.map(t => ({
          id:          t._id,
          title:       t.title,
          description: t.description,
          status:      t.status,
          priority:    t.priority,
          createdAt:   t.createdAt,
          updatedAt:   t.updatedAt,
        })),
        pagination: {
          total,
          page:  Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/tickets/:id — single ticket
router.get('/:id', async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id).lean();
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });

    res.json({
      success: true,
      data: {
        id:          ticket._id,
        title:       ticket.title,
        description: ticket.description,
        status:      ticket.status,
        priority:    ticket.priority,
        createdAt:   ticket.createdAt,
        updatedAt:   ticket.updatedAt,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tickets/:id — update status (or priority)
router.patch('/:id', async (req, res, next) => {
  try {
    const allowed = ['status', 'priority'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update (status, priority)' });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });

    res.json({
      success: true,
      data: {
        id:          ticket._id,
        title:       ticket.title,
        description: ticket.description,
        status:      ticket.status,
        priority:    ticket.priority,
        createdAt:   ticket.createdAt,
        updatedAt:   ticket.updatedAt,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
