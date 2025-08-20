import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';
import { AppError, asyncHandler } from './errorHandler';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    balance: string;
    isActive: boolean;
    isVerified: boolean;
  };
}

export const authenticate = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new AppError('Access denied. No token provided.', 401);
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        balance: true,
        isActive: true,
        isVerified: true
      }
    });

    if (!user) {
      throw new AppError('Token is invalid. User not found.', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated. Please contact support.', 401);
    }

    // Attach user to request
    req.user = {
      ...user,
      balance: user.balance.toString()
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid token.', 401);
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Token expired.', 401);
    }
    throw error;
  }
});

export const requireVerified = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isVerified) {
    throw new AppError('Email verification required.', 403);
  }
  next();
});

export const requireBalance = (minimumBalance: number = 0) => {
  return asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const balance = parseFloat(req.user.balance);
    if (balance < minimumBalance) {
      throw new AppError('Insufficient balance.', 400);
    }

    next();
  });
};
