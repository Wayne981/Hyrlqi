import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import rateLimit from 'express-rate-limit';
import { prisma } from '../server';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth routes
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required().max(255),
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(8).max(128).required()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
    .message('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    .messages({ 'any.only': 'Passwords do not match' })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128).required()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
    .message('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
    .messages({ 'any.only': 'Passwords do not match' })
});

/**
 * Generate JWT token
 */
const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { 
      expiresIn: '7d',
      issuer: 'hyrlqi',
      audience: 'hyrlqi-users'
    }
  );
};

/**
 * Register new user
 */
router.post('/register', authLimiter, asyncHandler(async (req: Request, res: Response) => {
  // Validate input
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { email, username, password } = value;

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    }
  });

  if (existingUser) {
    throw new AppError('User with this email or username already exists', 400);
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password: hashedPassword,
      balance: 1000.00 // Starting balance
    },
    select: {
      id: true,
      email: true,
      username: true,
      balance: true,
      isActive: true,
      isVerified: true,
      createdAt: true
    }
  });

  // Generate token
  const token = generateToken(user.id);

  // Create session record
  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        ...user,
        balance: user.balance.toString()
      },
      token
    }
  });
}));

/**
 * Login user
 */
router.post('/login', authLimiter, asyncHandler(async (req: Request, res: Response) => {
  // Validate input
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { email, password } = value;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      username: true,
      password: true,
      balance: true,
      isActive: true,
      isVerified: true,
      createdAt: true
    }
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('Account is deactivated. Please contact support.', 401);
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate token
  const token = generateToken(user.id);

  // Create session record
  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  });

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        ...userWithoutPassword,
        balance: user.balance.toString()
      },
      token
    }
  });
}));

/**
 * Get current user profile
 */
router.get('/me', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
}));

/**
 * Change password
 */
router.put('/change-password', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Validate input
  const { error, value } = changePasswordSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { currentPassword, newPassword } = value;
  const userId = req.user!.id;

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.password);
  if (!isValidPassword) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Hash new password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  // Invalidate all existing sessions
  await prisma.session.deleteMany({
    where: { userId }
  });

  res.json({
    success: true,
    message: 'Password changed successfully. Please log in again.'
  });
}));

/**
 * Logout user
 */
router.post('/logout', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    // Delete specific session
    await prisma.session.deleteMany({
      where: {
        userId: req.user!.id,
        token
      }
    });
  }

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

/**
 * Logout from all devices
 */
router.post('/logout-all', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Delete all sessions for user
  await prisma.session.deleteMany({
    where: { userId: req.user!.id }
  });

  res.json({
    success: true,
    message: 'Logged out from all devices successfully'
  });
}));

/**
 * Refresh token
 */
router.post('/refresh', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const oldToken = req.headers.authorization?.replace('Bearer ', '');

  // Generate new token
  const newToken = generateToken(userId);

  // Update session with new token
  if (oldToken) {
    await prisma.session.updateMany({
      where: {
        userId,
        token: oldToken
      },
      data: {
        token: newToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });
  } else {
    // Create new session
    await prisma.session.create({
      data: {
        userId,
        token: newToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });
  }

  res.json({
    success: true,
    data: {
      token: newToken
    }
  });
}));

/**
 * Verify token endpoint
 */
router.get('/verify', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      user: req.user
    }
  });
}));

export { router as authRoutes };
