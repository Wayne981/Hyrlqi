import express, { Request, Response } from 'express';
import Joi from 'joi';
import { prisma } from '../server';
import { authenticate, AuthenticatedRequest, requireBalance } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { PlinkoEngine } from '../services/games/PlinkoEngine';
import { MinesEngine } from '../services/games/MinesEngine';
import { CrashEngine } from '../services/games/CrashEngine';
import { socketService } from '../server';

// Game data interfaces
interface MinesGameData {
  gridSize: number;
  mineCount: number;
  revealedCells: number[];
  isCompleted: boolean;
  currentMultiplier: number;
  minePositions?: number[];
}

interface PlinkoGameData {
  rows: number;
  risk: string;
  path: number[];
  multiplier: number;
}

interface CrashGameData {
  multiplier: number;
  cashedOut: boolean;
  cashOutAt?: number;
}

const router = express.Router();

// Global crash game engine instance
const crashEngine = new CrashEngine();

// Validation schemas
const plinkoGameSchema = Joi.object({
  rows: Joi.number().valid(8, 12, 16).required(),
  risk: Joi.string().valid('low', 'medium', 'high').required(),
  betAmount: Joi.number().min(0.01).max(10000).required()
});

const minesGameSchema = Joi.object({
  gridSize: Joi.number().min(9).max(25).required(),
  mineCount: Joi.number().min(1).max(24).required(),
  betAmount: Joi.number().min(0.01).max(10000).required()
});

const minesRevealSchema = Joi.object({
  gameId: Joi.string().required(),
  cellIndex: Joi.number().min(0).required()
});

const crashGameSchema = Joi.object({
  betAmount: Joi.number().min(0.01).max(10000).required(),
  autoCashOut: Joi.number().min(1.01).max(1000000).optional()
});

/**
 * Update user balance in database
 */
const updateUserBalance = async (userId: string, amount: number, type: 'BET' | 'WIN', description?: string) => {
  return await prisma.$transaction(async (tx) => {
    // Get current balance
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { balance: true }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const currentBalance = parseFloat(user.balance.toString());
    const newBalance = currentBalance + amount;

    if (newBalance < 0) {
      throw new AppError('Insufficient balance', 400);
    }

    // Update user balance
    await tx.user.update({
      where: { id: userId },
      data: { balance: newBalance }
    });

    // Record transaction
    await tx.transaction.create({
      data: {
        userId,
        type,
        amount: Math.abs(amount),
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description
      }
    });

    return newBalance;
  });
};

// ===== PLINKO ROUTES =====

/**
 * Play Plinko game
 */
router.post('/plinko/play', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Validate input
  const { error, value } = plinkoGameSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { rows, risk, betAmount } = value;
  const userId = req.user!.id;

  // Check user balance
  const currentBalance = parseFloat(req.user!.balance);
  if (currentBalance < betAmount) {
    throw new AppError('Insufficient balance', 400);
  }

  // Generate game seed and nonce
  const seed = PlinkoEngine.generateSeed();
  const nonce = Date.now(); // Use timestamp as nonce for uniqueness

  // Play the game
  const gameResult = PlinkoEngine.playGame({ rows, risk, betAmount }, seed, nonce);

  // Calculate profit/loss
  const profit = gameResult.payout - betAmount;

  // Update user balance (deduct bet)
  await updateUserBalance(userId, -betAmount, 'BET', `Plinko bet: ${rows} rows, ${risk} risk`);

  // Add winnings if any
  let newBalance = currentBalance - betAmount;
  if (gameResult.payout > 0) {
    newBalance = await updateUserBalance(userId, gameResult.payout, 'WIN', `Plinko win: ${gameResult.multiplier}x multiplier`);
  }

  // Save game history
  await prisma.gameHistory.create({
    data: {
      userId,
      gameType: 'PLINKO',
      betAmount,
      payout: gameResult.payout,
      multiplier: gameResult.multiplier,
      isWin: gameResult.isWin,
      gameData: {
        rows,
        risk,
        ballPath: gameResult.ballPath,
        finalSlot: gameResult.finalSlot
      },
      seed,
      nonce
    }
  });

  // Emit result to user and public feed
  if (socketService) {
    socketService.emitPlinkoResult(userId, {
      ...gameResult,
      profit,
      newBalance: newBalance.toString()
    });
  }

  res.json({
    success: true,
    data: {
      gameResult: {
        ...gameResult,
        profit,
        newBalance: newBalance.toString()
      }
    }
  });
}));

/**
 * Get Plinko game statistics
 */
router.get('/plinko/stats/:rows/:risk', asyncHandler(async (req: Request, res: Response) => {
  const rows = parseInt(req.params.rows);
  const risk = req.params.risk as 'low' | 'medium' | 'high';

  if (![8, 12, 16].includes(rows)) {
    throw new AppError('Invalid rows parameter', 400);
  }

  if (!['low', 'medium', 'high'].includes(risk)) {
    throw new AppError('Invalid risk parameter', 400);
  }

  const stats = PlinkoEngine.getGameStats(rows, risk);

  res.json({
    success: true,
    data: { stats }
  });
}));

// ===== MINES ROUTES =====

/**
 * Start new Mines game
 */
router.post('/mines/start', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Validate input
  const { error, value } = minesGameSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { gridSize, mineCount, betAmount } = value;
  const userId = req.user!.id;

  // Additional validation
  if (mineCount >= gridSize) {
    throw new AppError('Mine count cannot be greater than or equal to grid size', 400);
  }

  // Check user balance
  const currentBalance = parseFloat(req.user!.balance);
  if (currentBalance < betAmount) {
    throw new AppError('Insufficient balance', 400);
  }

  // Generate game seed and nonce
  const seed = MinesEngine.generateSeed();
  const nonce = Date.now();

  // Start the game
  const gameState = MinesEngine.startGame({ gridSize, mineCount, betAmount }, seed, nonce);

  // Deduct bet amount from user balance
  const newBalance = await updateUserBalance(userId, -betAmount, 'BET', `Mines bet: ${mineCount} mines in ${gridSize} grid`);

  // Store game state in cache (you might want to use Redis for this)
  // For now, we'll store it in the database as a temporary game record
  await prisma.gameHistory.create({
    data: {
      id: gameState.gameId,
      userId,
      gameType: 'MINES',
      betAmount,
      payout: 0,
      multiplier: 1,
      isWin: false,
      gameData: {
        gridSize,
        mineCount,
        revealedCells: [],
        isCompleted: false,
        currentMultiplier: 1
      },
      seed,
      nonce
    }
  });

  res.json({
    success: true,
    data: {
      gameState: {
        gameId: gameState.gameId,
        gridSize: gameState.gridSize,
        mineCount: gameState.mineCount,
        betAmount: gameState.betAmount,
        revealedCells: gameState.revealedCells,
        isCompleted: gameState.isCompleted,
        currentMultiplier: gameState.currentMultiplier,
        totalPayout: gameState.totalPayout
      },
      newBalance: newBalance.toString()
    }
  });
}));

/**
 * Reveal cell in Mines game
 */
router.post('/mines/reveal', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Validate input
  const { error, value } = minesRevealSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { gameId, cellIndex } = value;
  const userId = req.user!.id;

  // Get game from database
  const gameRecord = await prisma.gameHistory.findUnique({
    where: { id: gameId },
    include: { user: true }
  });

  if (!gameRecord || gameRecord.userId !== userId) {
    throw new AppError('Game not found', 404);
  }

  if ((gameRecord.gameData as unknown as MinesGameData).isCompleted) {
    throw new AppError('Game is already completed', 400);
  }

  // Reconstruct game state
  const gameState = MinesEngine.startGame(
    {
      gridSize: (gameRecord.gameData as unknown as MinesGameData).gridSize,
      mineCount: (gameRecord.gameData as unknown as MinesGameData).mineCount,
      betAmount: parseFloat(gameRecord.betAmount.toString())
    },
    gameRecord.seed,
    gameRecord.nonce
  );

  // Apply previous reveals
  for (const cell of (gameRecord.gameData as unknown as MinesGameData).revealedCells) {
    MinesEngine.revealCell(gameState, cell);
  }

  // Reveal the new cell
  const revealResult = MinesEngine.revealCell(gameState, cellIndex);

  let newBalance = parseFloat(req.user!.balance);

  // Update game record
  const updatedGameData = {
    ...(gameRecord.gameData as unknown as MinesGameData),
    revealedCells: gameState.revealedCells,
    isCompleted: gameState.isCompleted,
    currentMultiplier: gameState.currentMultiplier
  };

  await prisma.gameHistory.update({
    where: { id: gameId },
    data: {
      gameData: updatedGameData,
      payout: gameState.totalPayout,
      multiplier: gameState.currentMultiplier,
      isWin: gameState.isWin
    }
  });

  // If game completed with win, add winnings to balance
  if (gameState.isCompleted && gameState.isWin && gameState.totalPayout > 0) {
    newBalance = await updateUserBalance(
      userId,
      gameState.totalPayout,
      'WIN',
      `Mines win: ${gameState.currentMultiplier}x multiplier`
    );
  }

  // Emit update to user
  if (socketService) {
    socketService.emitMinesUpdate(userId, {
      gameId,
      revealResult,
      gameState: {
        revealedCells: gameState.revealedCells,
        isCompleted: gameState.isCompleted,
        isWin: gameState.isWin,
        currentMultiplier: gameState.currentMultiplier,
        totalPayout: gameState.totalPayout
      },
      newBalance: newBalance.toString()
    });
  }

  res.json({
    success: true,
    data: {
      revealResult,
      gameState: {
        gameId: gameState.gameId,
        revealedCells: gameState.revealedCells,
        isCompleted: gameState.isCompleted,
        isWin: gameState.isWin,
        currentMultiplier: gameState.currentMultiplier,
        totalPayout: gameState.totalPayout
      },
      newBalance: newBalance.toString()
    }
  });
}));

/**
 * Cash out from Mines game
 */
router.post('/mines/cashout', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { gameId } = req.body;
  const userId = req.user!.id;

  if (!gameId) {
    throw new AppError('Game ID is required', 400);
  }

  // Get game from database
  const gameRecord = await prisma.gameHistory.findUnique({
    where: { id: gameId }
  });

  if (!gameRecord || gameRecord.userId !== userId) {
    throw new AppError('Game not found', 404);
  }

  if ((gameRecord.gameData as unknown as MinesGameData).isCompleted) {
    throw new AppError('Game is already completed', 400);
  }

  // Reconstruct game state
  const gameState = MinesEngine.startGame(
    {
      gridSize: (gameRecord.gameData as unknown as MinesGameData).gridSize,
      mineCount: (gameRecord.gameData as unknown as MinesGameData).mineCount,
      betAmount: parseFloat(gameRecord.betAmount.toString())
    },
    gameRecord.seed,
    gameRecord.nonce
  );

  // Apply previous reveals
  for (const cell of (gameRecord.gameData as unknown as MinesGameData).revealedCells) {
    MinesEngine.revealCell(gameState, cell);
  }

  // Cash out
  const payout = MinesEngine.cashOut(gameState);

  // Update balance
  const newBalance = await updateUserBalance(
    userId,
    payout,
    'WIN',
    `Mines cash out: ${gameState.currentMultiplier}x multiplier`
  );

  // Update game record
  await prisma.gameHistory.update({
    where: { id: gameId },
    data: {
      gameData: {
        ...(gameRecord.gameData as unknown as MinesGameData),
        isCompleted: true
      },
      payout,
      multiplier: gameState.currentMultiplier,
      isWin: true
    }
  });

  res.json({
    success: true,
    data: {
      payout,
      multiplier: gameState.currentMultiplier,
      newBalance: newBalance.toString()
    }
  });
}));

/**
 * Get Mines game statistics
 */
router.get('/mines/stats/:gridSize/:mineCount', asyncHandler(async (req: Request, res: Response) => {
  const gridSize = parseInt(req.params.gridSize);
  const mineCount = parseInt(req.params.mineCount);

  if (gridSize < 9 || gridSize > 25) {
    throw new AppError('Invalid grid size', 400);
  }

  if (mineCount < 1 || mineCount >= gridSize) {
    throw new AppError('Invalid mine count', 400);
  }

  const stats = MinesEngine.getGameStats(gridSize, mineCount);
  const strategy = MinesEngine.getOptimalStrategy(gridSize, mineCount);

  res.json({
    success: true,
    data: { stats, strategy }
  });
}));

// ===== CRASH ROUTES =====

/**
 * Get current crash game state
 */
router.get('/crash/current', asyncHandler(async (req: Request, res: Response) => {
  const gameState = crashEngine.getCurrentGameState();
  
  res.json({
    success: true,
    data: {
      gameState: gameState ? {
        roundId: gameState.roundId,
        startTime: gameState.startTime,
        currentMultiplier: gameState.currentMultiplier,
        isActive: gameState.isActive,
        isCrashed: gameState.isCrashed,
        playerCount: gameState.players.size
      } : null
    }
  });
}));

/**
 * Place bet on crash game
 */
router.post('/crash/bet', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Validate input
  const { error, value } = crashGameSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { betAmount, autoCashOut } = value;
  const userId = req.user!.id;

  // Check user balance
  const currentBalance = parseFloat(req.user!.balance);
  if (currentBalance < betAmount) {
    throw new AppError('Insufficient balance', 400);
  }

  // Get or start new round
  let gameState = crashEngine.getCurrentGameState();
  if (!gameState || !gameState.isActive) {
    gameState = crashEngine.startNewRound();
  }

  // Place bet
  crashEngine.placeBet(userId, req.user!.username, { betAmount, autoCashOut });

  // Deduct bet from balance
  const newBalance = await updateUserBalance(userId, -betAmount, 'BET', 'Crash game bet');

  res.json({
    success: true,
    data: {
      roundId: gameState.roundId,
      betAmount,
      autoCashOut,
      newBalance: newBalance.toString()
    }
  });
}));

/**
 * Cash out from crash game
 */
router.post('/crash/cashout', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const result = crashEngine.cashOut(userId);

    // Add winnings to balance
    const newBalance = await updateUserBalance(
      userId,
      result.payout,
      'WIN',
      `Crash cash out at ${result.cashOutMultiplier}x`
    );

    // Save game history
    await prisma.gameHistory.create({
      data: {
        userId,
        gameType: 'CRASH',
        betAmount: result.payout / result.cashOutMultiplier!,
        payout: result.payout,
        multiplier: result.cashOutMultiplier!,
        isWin: true,
        gameData: {
          roundId: result.roundId,
          crashPoint: result.crashPoint,
          cashedOut: result.cashedOut,
          cashOutMultiplier: result.cashOutMultiplier
        },
        seed: 'crash_seed', // This would be the actual game seed
        nonce: Date.now()
      }
    });

    res.json({
      success: true,
      data: {
        result,
        newBalance: newBalance.toString()
      }
    });
  } catch (error) {
    throw new AppError((error as Error).message, 400);
  }
}));

/**
 * Get crash game statistics
 */
router.get('/crash/stats', asyncHandler(async (req: Request, res: Response) => {
  const stats = CrashEngine.getGameStats();
  const strategy = CrashEngine.getOptimalStrategy();

  res.json({
    success: true,
    data: { stats, strategy }
  });
}));

// ===== GENERAL ROUTES =====

/**
 * Get user's game history
 */
router.get('/history', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const gameType = req.query.gameType as string;

  const where: any = { userId };
  if (gameType && ['PLINKO', 'MINES', 'CRASH'].includes(gameType.toUpperCase())) {
    where.gameType = gameType.toUpperCase();
  }

  const [games, total] = await Promise.all([
    prisma.gameHistory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        gameType: true,
        betAmount: true,
        payout: true,
        multiplier: true,
        isWin: true,
        createdAt: true,
        gameData: true
      }
    }),
    prisma.gameHistory.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      games: games.map(game => ({
        ...game,
        betAmount: game.betAmount.toString(),
        payout: game.payout.toString()
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
 * Get game statistics summary
 */
router.get('/stats/summary', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const stats = await prisma.gameHistory.aggregate({
    where: { userId },
    _count: { id: true },
    _sum: {
      betAmount: true,
      payout: true
    }
  });

  const winCount = await prisma.gameHistory.count({
    where: { userId, isWin: true }
  });

  const totalBet = parseFloat(stats._sum.betAmount?.toString() || '0');
  const totalPayout = parseFloat(stats._sum.payout?.toString() || '0');
  const totalProfit = totalPayout - totalBet;
  const winRate = stats._count.id > 0 ? (winCount / stats._count.id) * 100 : 0;

  res.json({
    success: true,
    data: {
      totalGames: stats._count.id,
      totalBet: totalBet.toString(),
      totalPayout: totalPayout.toString(),
      totalProfit: totalProfit.toString(),
      winCount,
      winRate: Math.round(winRate * 100) / 100
    }
  });
}));

export { router as gameRoutes };
