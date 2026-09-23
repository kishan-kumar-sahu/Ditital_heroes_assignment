import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export async function auth(req, res, next) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' });

  try {
    const payload = jwt.verify(h.slice(7), process.env.JWT_SECRET || 'digital-heroes-dev-secret-change-me');
    const user = await User.findById(payload.id).lean();
    if (!user || Number(user.tokenVersion || 0) !== Number(payload.tokenVersion || 0)) {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }
    req.user = { id: String(user._id), email: user.email, role: user.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Authentication required' });
  }
}

export const roles = allowed => (req, res, next) => {
  if (!allowed.includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });
  next();
};
