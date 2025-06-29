import express, { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { comparePasswords, hashPassword } from '../utils/hash';
import { generateToken, verifyToken } from '../utils/jwt';

const router = express.Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// Me route for auth check
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    let token = null;
    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }
    res.json({ id: user._id, email: user.email, role: user.role });
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});

export default router; 