import express from 'express';
import User from '../models/User.js';
import { sign, verify } from '../utils/jwt.js';

const router = express.Router();

const PHONE_REGEX = /^\d{10}$/;
const GENDERS = ['male', 'female', 'other'];
const USER_TYPES = ['patient', 'staff'];

/**
 * Parse dob string. Accepts:
 * - ISO: YYYY-MM-DD
 * - YYYY-DD-MM: e.g. 1996-29-11 (29 Nov 1996)
 * - DD-MM-YYYY: e.g. 29-11-1996
 */
function parseDob(value) {
  if (!value) return null;
  const s = String(value).trim();
  let d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d;
  const parts = s.split(/[-/]/);
  if (parts.length !== 3) return null;
  const [a, b, c] = parts.map((p) => parseInt(p, 10));
  if (Number.isNaN(a) || Number.isNaN(b) || Number.isNaN(c)) return null;
  // YYYY-DD-MM (e.g. 1996-29-11)
  if (a >= 1900 && a <= 2100 && b >= 1 && b <= 31 && c >= 1 && c <= 12) {
    d = new Date(a, c - 1, b);
    if (!Number.isNaN(d.getTime())) return d;
  }
  // DD-MM-YYYY (e.g. 29-11-1996)
  if (a >= 1 && a <= 31 && b >= 1 && b <= 12 && c >= 1900 && c <= 2100) {
    d = new Date(c, b - 1, a);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function toUserResponse(user) {
  const u = user.toObject ? user.toObject() : user;
  return {
    id: u._id,
    phone: u.phone,
    name: u.name,
    gender: u.gender,
    dob: u.dob,
    user_type: u.user_type,
    email: u.email,
    clinic_id: u.clinic_id,
    city_id: u.city_id,
    state_id: u.state_id,
    country_id: u.country_id,
  };
}

function createAuthResponse(user) {
  const payload = {
    userId: user._id.toString(),
    phone: user.phone,
    user_type: user.user_type,
  };
  const token = sign(payload);
  return {
    success: true,
    data: {
      user: toUserResponse(user),
      token,
    },
    timestamp: new Date().toISOString(),
  };
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { phone, name, gender, dob, user_type } = req.body;

    if (!phone || !PHONE_REGEX.test(String(phone).trim())) {
      return res.status(400).json({
        success: false,
        error: 'Phone must be exactly 10 digits',
        timestamp: new Date().toISOString(),
      });
    }
    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Name is required',
        timestamp: new Date().toISOString(),
      });
    }
    if (!gender || !GENDERS.includes(gender)) {
      return res.status(400).json({
        success: false,
        error: `Gender must be one of: ${GENDERS.join(', ')}`,
        timestamp: new Date().toISOString(),
      });
    }
    const dobDate = parseDob(dob);
    if (!dob || !dobDate) {
      return res.status(400).json({
        success: false,
        error: 'Valid date of birth is required (e.g. YYYY-MM-DD, YYYY-DD-MM, or DD-MM-YYYY)',
        timestamp: new Date().toISOString(),
      });
    }
    if (!user_type || !USER_TYPES.includes(user_type)) {
      return res.status(400).json({
        success: false,
        error: `user_type must be one of: ${USER_TYPES.join(', ')}`,
        timestamp: new Date().toISOString(),
      });
    }

    const phoneTrimmed = String(phone).trim();
    const existing = await User.findOne({ phone: phoneTrimmed });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Phone number already registered',
        timestamp: new Date().toISOString(),
      });
    }

    const user = await User.create({
      phone: phoneTrimmed,
      name: String(name).trim(),
      gender,
      dob: dobDate,
      user_type,
    });

    res.status(201).json(createAuthResponse(user));
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: err.message || 'Validation failed',
        timestamp: new Date().toISOString(),
      });
    }
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone || !PHONE_REGEX.test(String(phone).trim())) {
      return res.status(400).json({
        success: false,
        error: 'Phone must be exactly 10 digits',
        timestamp: new Date().toISOString(),
      });
    }

    const user = await User.findOne({ phone: String(phone).trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json(createAuthResponse(user));
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — current user from JWT (Authorization: Bearer <token>)
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        timestamp: new Date().toISOString(),
      });
    }

    let payload;
    try {
      payload = verify(token);
    } catch {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        timestamp: new Date().toISOString(),
      });
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json({
      success: true,
      data: { user: toUserResponse(user) },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
