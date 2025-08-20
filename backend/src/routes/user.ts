import express from 'express';
import Joi from 'joi';
import { prisma } from '../server';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Validation schemas
const updateProfileSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).optional(),
  email: Joi.string().email().max(255).optional()
});

/**
 * Get user profile
 */
router.get('/profile', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      balance: true,
      isActive: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: {
      user: {
        ...user,
        balance: user.balance.toString()
      }
    }
  });
}));

/**
 * Update user profile
 */
router.put('/profile', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  // Validate input
  const { error, value } = updateProfileSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const userId = req.user!.id;
  const updateData: any = {};

  // Check if username is being updated and is available
  if (value.username && value.username !== req.user!.username) {
    const existingUser = await prisma.user.findUnique({
      where: { username: value.username.toLowerCase() }
    });

    if (existingUser) {
      throw new AppError('Username is already taken', 400);
    }

    updateData.username = value.username.toLowerCase();
  }

  // Check if email is being updated and is available
  if (value.email && value.email !== req.user!.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: value.email.toLowerCase() }
    });

    if (existingUser) {
      throw new AppError('Email is already taken', 400);
    }

    updateData.email = value.email.toLowerCase();
    updateData.isVerified = false; // Reset verification status
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      username: true,
      balance: true,
      isActive: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true
    }
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        ...updatedUser,
        balance: updatedUser.balance.toString()
      }
    }
  });
}));

/**
 * Get user balance
 */
router.get('/balance', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: {
      balance: user.balance.toString()
    }
  });
}));

/**
 * Get user transactions
 */
router.get('/transactions', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const type = req.query.type as string;

  const where: any = { userId };
  if (type && ['DEPOSIT', 'WITHDRAWAL', 'BET', 'WIN', 'BONUS', 'REFUND'].includes(type.toUpperCase())) {
    where.type = type.toUpperCase();
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        type: true,
        amount: true,
        balanceBefore: true,
        balanceAfter: true,
        description: true,
        createdAt: true
      }
    }),
    prisma.transaction.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      transactions: transactions.map(tx => ({
        ...tx,
        amount: tx.amount.toString(),
        balanceBefore: tx.balanceBefore.toString(),
        balanceAfter: tx.balanceAfter.toString()
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

/**
 * Get user statistics
 */
router.get('/stats', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const userId = req.user!.id;

  // Game statistics
  const gameStats = await prisma.gameHistory.groupBy({
    by: ['gameType'],
    where: { userId },
    _count: { id: true },
    _sum: {
      betAmount: true,
      payout: true
    }
  });

  // Win statistics
  const winStats = await prisma.gameHistory.groupBy({
    by: ['gameType'],
    where: { userId, isWin: true },
    _count: { id: true }
  });

  // Overall statistics
  const overallStats = await prisma.gameHistory.aggregate({
    where: { userId },
    _count: { id: true },
    _sum: {
      betAmount: true,
      payout: true
    },
    _avg: {
      multiplier: true
    },
    _max: {
      payout: true,
      multiplier: true
    }
  });

  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentActivity = await prisma.gameHistory.aggregate({
    where: {
      userId,
      createdAt: { gte: sevenDaysAgo }
    },
    _count: { id: true },
    _sum: {
      betAmount: true,
      payout: true
    }
  });

  // Format game statistics
  const gameStatsFormatted = gameStats.map(stat => {
    const wins = winStats.find(w => w.gameType === stat.gameType)?._count.id || 0;
    const totalBet = parseFloat(stat._sum.betAmount?.toString() || '0');
    const totalPayout = parseFloat(stat._sum.payout?.toString() || '0');

    return {
      gameType: stat.gameType,
      totalGames: stat._count.id,
      wins,
      winRate: stat._count.id > 0 ? (wins / stat._count.id) * 100 : 0,
      totalBet: totalBet.toString(),
      totalPayout: totalPayout.toString(),
      profit: (totalPayout - totalBet).toString()
    };
  });

  const totalBet = parseFloat(overallStats._sum.betAmount?.toString() || '0');
  const totalPayout = parseFloat(overallStats._sum.payout?.toString() || '0');
  const recentTotalBet = parseFloat(recentActivity._sum.betAmount?.toString() || '0');
  const recentTotalPayout = parseFloat(recentActivity._sum.payout?.toString() || '0');

  res.json({
    success: true,
    data: {
      overall: {
        totalGames: overallStats._count.id,
        totalBet: totalBet.toString(),
        totalPayout: totalPayout.toString(),
        totalProfit: (totalPayout - totalBet).toString(),
        averageMultiplier: overallStats._avg.multiplier || 0,
        biggestWin: overallStats._max.payout?.toString() || '0',
        biggestMultiplier: overallStats._max.multiplier || 0
      },
      byGame: gameStatsFormatted,
      recent: {
        totalGames: recentActivity._count.id,
        totalBet: recentTotalBet.toString(),
        totalPayout: recentTotalPayout.toString(),
        totalProfit: (recentTotalPayout - recentTotalBet).toString()
      }
    }
  });
}));

/**
 * Get user's active sessions
 */
router.get('/sessions', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const userId = req.user!.id;

  const sessions = await prisma.session.findMany({
    where: { userId },
    select: {
      id: true,
      token: true,
      expiresAt: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  // Hide token for security, just show if it's the current session
  const currentToken = req.headers.authorization?.replace('Bearer ', '');
  
  const sessionsFormatted = sessions.map(session => ({
    id: session.id,
    isCurrentSession: session.token === currentToken,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt
  }));

  res.json({
    success: true,
    data: {
      sessions: sessionsFormatted
    }
  });
}));

/**
 * Delete a specific session
 */
router.delete('/sessions/:sessionId', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const userId = req.user!.id;
  const sessionId = req.params.sessionId;

  const session = await prisma.session.findUnique({
    where: { id: sessionId }
  });

  if (!session || session.userId !== userId) {
    throw new AppError('Session not found', 404);
  }

  await prisma.session.delete({
    where: { id: sessionId }
  });

  res.json({
    success: true,
    message: 'Session deleted successfully'
  });
}));

/**
 * Deactivate user account
 */
router.post('/deactivate', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
  const userId = req.user!.id;

  // Deactivate user account
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false }
  });

  // Delete all sessions
  await prisma.session.deleteMany({
    where: { userId }
  });

  res.json({
    success: true,
    message: 'Account deactivated successfully'
  });
}));

export { router as userRoutes };
