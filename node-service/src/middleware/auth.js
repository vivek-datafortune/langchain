import { verify } from '../utils/jwt.js';

/**
 * Middleware: require valid JWT in Authorization: Bearer <token>.
 * On success sets req.user = { userId, phone, user_type }.
 * On missing/invalid token responds with 401.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || typeof header !== 'string' || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Missing or invalid Authorization header. Use: Bearer <token>',
      timestamp: new Date().toISOString(),
    });
  }

  const token = header.slice(7).trim();
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Missing token',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const decoded = verify(token);
    req.user = {
      userId: decoded.userId,
      phone: decoded.phone,
      user_type: decoded.user_type,
    };
    next();
  } catch {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      timestamp: new Date().toISOString(),
    });
  }
}

export default requireAuth;
