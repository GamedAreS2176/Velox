import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

export default function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.get('Authorization'); // safe getter, returns string | undefined
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No token provided' });
  }

  const token = authHeader.slice(7).trim();
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ msg: 'Server misconfiguration: JWT secret missing' });
  }

  try {
    const decoded = jwt.verify(token, secret) as unknown;

    if (typeof decoded === 'object' && decoded !== null && 'sub' in decoded && typeof (decoded as any).sub === 'string') {
      const payload = decoded as { sub: string; email?: string; iat?: number; exp?: number };
      const user: { sub: string; email?: string; iat?: number; exp?: number } = { sub: String(payload.sub) };
      if (typeof payload.email === 'string') user.email = payload.email;
      if (typeof payload.iat === 'number') user.iat = payload.iat;
      if (typeof payload.exp === 'number') user.exp = payload.exp;
      req.user = user;
      return next();
    }

    return res.status(401).json({ msg: 'Invalid token payload' });
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ msg: 'Token expired' });
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ msg: 'Invalid token' });
    }
    return res.status(500).json({ msg: 'Internal server error' });
  }
}