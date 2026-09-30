import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
    if (!token) return res.status(401).json({ message: 'Authentication required.' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) return res.status(401).json({ message: 'Token has expired.' });
      if (err instanceof jwt.JsonWebTokenError) return res.status(401).json({ message: 'Invalid token.' });
      throw err;
    }

    const user = await User.findById(payload.userId);
    if (!user) return res.status(401).json({ message: 'User account not found.' });
    if (user.isActive === false) return res.status(403).json({ message: 'This user account is inactive.' });

    req.user = user;
    next();
  } catch (err) {
    console.error('Authentication middleware error:', err);
    return res.status(503).json({ message: 'Authentication service temporarily unavailable.' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission for this action.' });
    }
    next();
  };
}
