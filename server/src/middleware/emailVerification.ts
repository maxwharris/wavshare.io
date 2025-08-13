import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from './auth';

const prisma = new PrismaClient();

// Middleware to check if user's email is verified
export const requireEmailVerification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { emailVerified: true }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (!user.emailVerified) {
      res.status(403).json({ 
        message: 'Email verification required. Please verify your email before creating posts or remixes.',
        requiresEmailVerification: true
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Email verification check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
