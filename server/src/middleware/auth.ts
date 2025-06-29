import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // Check cookie
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if ((req as any).user?.role !== role) {
      res.status(403).json({ message: 'Forbidden: insufficient role' });
      return;
    }
    next();
  };
}; 