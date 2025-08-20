import express, { Request, Response } from 'express';
import { prisma } from '../server';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

/**
 * Get platform statistics
 */
router.get('/platform', asyncHandler(async (req: Request, res: Response) => {
  // Get overall platform stats
  const [
    totalUsers,
    totalGames,
    gameStats,
    recentActivity
  ] = await Promise.all([
    // Total users
    prisma.user.count(),
    
    // Total games played
    prisma.gameHistory.count(),
    
    // Game statistics by type
    prisma.gameHistory.groupBy({
      by: ['gameType'],
      _count: { id: true },
      _sum: {
        betAmount: true,
        payout: true
      }
    }),
    
    // Recent activity (last 24 hours)
    prisma.gameHistory.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })
  ]);

  // Calculate total volume and payout
  const totalVolume = gameStats.reduce((sum, stat) => {
    return sum + parseFloat(stat._sum.betAmount?.toString() || '0');
  }, 0);

  const totalPayout = gameStats.reduce((sum, stat) => {
    return sum + parseFloat(stat._sum.payout?.toString() || '0');
  }, 0);

  const houseProfit = totalVolume - totalPayout;

  // Format game statistics
  const gameStatsFormatted = gameStats.map(stat => ({
    gameType: stat.gameType,
    totalGames: stat._count.id,
    totalVolume: stat._sum.betAmount?.toString() || '0',
    totalPayout: stat._sum.payout?.toString() || '0'
  }));

  res.json({
    success: true,
    data: {
      totalUsers,
      totalGames,
      totalVolume: totalVolume.toString(),
      totalPayout: totalPayout.toString(),
      houseProfit: houseProfit.toString(),
      recentActivity,
      gameStats: gameStatsFormatted
    }
  });
}));

/**
 * Get leaderboard
 */
router.get('/leaderboard', asyncHandler(async (req: Request, res: Response) => {
  const gameType = req.query.gameType as string;
  const timeframe = req.query.timeframe as string || 'all'; // all, day, week, month
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

  // Calculate timeframe filter
  let timeFilter: any = {};
  const now = new Date();
  
  switch (timeframe) {
    case 'day':
      timeFilter.createdAt = { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
      break;
    case 'week':
      timeFilter.createdAt = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
      break;
    case 'month':
      timeFilter.createdAt = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
      break;
  }

  // Build where clause
  const where: any = { ...timeFilter };
  if (gameType && ['PLINKO', 'MINES', 'CRASH'].includes(gameType.toUpperCase())) {
    where.gameType = gameType.toUpperCase();
  }

  // Get top players by total payout
  const topWinners = await prisma.gameHistory.groupBy({
    by: ['userId'],
    where,
    _sum: {
      payout: true
    },
    orderBy: {
      _sum: {
        payout: 'desc'
      }
    },
    take: limit
  });

  // Get user details for top winners
  const topWinnersWithDetails = await Promise.all(
    topWinners.map(async (winner, index) => {
      const user = await prisma.user.findUnique({
        where: { id: winner.userId },
        select: { username: true }
      });

      return {
        rank: index + 1,
        username: user?.username || 'Anonymous',
        totalPayout: winner._sum.payout?.toString() || '0'
      };
    })
  );

  // Get top players by profit
  const profitLeaderboard = await prisma.$queryRaw`
    SELECT 
      u.username,
      SUM(gh.payout - gh.bet_amount) as profit,
      COUNT(gh.id) as total_games
    FROM game_history gh
    JOIN users u ON gh.user_id = u.id
    ${gameType ? `WHERE gh.game_type = ${gameType.toUpperCase()}` : ''}
    ${timeframe !== 'all' ? `${gameType ? 'AND' : 'WHERE'} gh.created_at >= ${timeFilter.createdAt?.gte}` : ''}
    GROUP BY gh.user_id, u.username
    ORDER BY profit DESC
    LIMIT ${limit}
  ` as any[];

  const profitLeaderboardFormatted = profitLeaderboard.map((player: any, index: number) => ({
    rank: index + 1,
    username: player.username,
    profit: player.profit?.toString() || '0',
    totalGames: parseInt(player.total_games)
  }));

  // Get biggest wins
  const biggestWins = await prisma.gameHistory.findMany({
    where,
    orderBy: { payout: 'desc' },
    take: limit,
    select: {
      payout: true,
      multiplier: true,
      gameType: true,
      createdAt: true,
      user: {
        select: { username: true }
      }
    }
  });

  const biggestWinsFormatted = biggestWins.map((win, index) => ({
    rank: index + 1,
    username: win.user.username,
    payout: win.payout.toString(),
    multiplier: win.multiplier,
    gameType: win.gameType,
    createdAt: win.createdAt
  }));

  res.json({
    success: true,
    data: {
      topWinners: topWinnersWithDetails,
      profitLeaderboard: profitLeaderboardFormatted,
      biggestWins: biggestWinsFormatted,
      filters: {
        gameType: gameType || 'all',
        timeframe,
        limit
      }
    }
  });
}));

/**
 * Get live statistics
 */
router.get('/live', asyncHandler(async (req: Request, res: Response) => {
  // Get recent games (last 10 minutes)
  const recentGames = await prisma.gameHistory.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 10 * 60 * 1000)
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      gameType: true,
      payout: true,
      multiplier: true,
      createdAt: true,
      user: {
        select: { username: true }
      }
    }
  });

  // Get active users count (users who played in last hour)
  const activeUsers = await prisma.gameHistory.groupBy({
    by: ['userId'],
    where: {
      createdAt: {
        gte: new Date(Date.now() - 60 * 60 * 1000)
      }
    },
    _count: { userId: true }
  });

  // Get games played in last hour by type
  const hourlyGameStats = await prisma.gameHistory.groupBy({
    by: ['gameType'],
    where: {
      createdAt: {
        gte: new Date(Date.now() - 60 * 60 * 1000)
      }
    },
    _count: { id: true },
    _sum: {
      betAmount: true,
      payout: true
    }
  });

  const recentGamesFormatted = recentGames.map(game => ({
    gameType: game.gameType,
    username: game.user.username,
    payout: game.payout.toString(),
    multiplier: game.multiplier,
    createdAt: game.createdAt
  }));

  const hourlyStatsFormatted = hourlyGameStats.map(stat => ({
    gameType: stat.gameType,
    gamesPlayed: stat._count.id,
    totalVolume: stat._sum.betAmount?.toString() || '0',
    totalPayout: stat._sum.payout?.toString() || '0'
  }));

  res.json({
    success: true,
    data: {
      recentGames: recentGamesFormatted,
      activeUsers: activeUsers.length,
      hourlyStats: hourlyStatsFormatted,
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * Get game-specific statistics
 */
router.get('/games/:gameType', asyncHandler(async (req: Request, res: Response) => {
  const gameType = req.params.gameType.toUpperCase();
  
  if (!['PLINKO', 'MINES', 'CRASH'].includes(gameType)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid game type'
    });
  }

  // Get game statistics
  const gameStats = await prisma.gameHistory.aggregate({
    where: { gameType: gameType as any },
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

  // Get recent activity (last 24 hours)
  const recentActivity = await prisma.gameHistory.aggregate({
    where: {
      gameType: gameType as any,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    },
    _count: { id: true },
    _sum: {
      betAmount: true,
      payout: true
    }
  });

  // Get multiplier distribution (for Plinko and Mines)
  const multiplierDistribution = await prisma.$queryRaw`
    SELECT 
      CASE 
        WHEN multiplier < 1 THEN '0-1x'
        WHEN multiplier < 2 THEN '1-2x'
        WHEN multiplier < 5 THEN '2-5x'
        WHEN multiplier < 10 THEN '5-10x'
        WHEN multiplier < 50 THEN '10-50x'
        ELSE '50x+'
      END as range,
      COUNT(*) as count
    FROM game_history 
    WHERE game_type = ${gameType}
    GROUP BY range
    ORDER BY MIN(multiplier)
  ` as any[];

  const totalBet = parseFloat(gameStats._sum.betAmount?.toString() || '0');
  const totalPayout = parseFloat(gameStats._sum.payout?.toString() || '0');
  const recentTotalBet = parseFloat(recentActivity._sum.betAmount?.toString() || '0');
  const recentTotalPayout = parseFloat(recentActivity._sum.payout?.toString() || '0');

  res.json({
    success: true,
    data: {
      gameType,
      overall: {
        totalGames: gameStats._count.id,
        totalBet: totalBet.toString(),
        totalPayout: totalPayout.toString(),
        houseProfit: (totalBet - totalPayout).toString(),
        averageMultiplier: gameStats._avg.multiplier || 0,
        maxPayout: gameStats._max.payout?.toString() || '0',
        maxMultiplier: gameStats._max.multiplier || 0
      },
      recent: {
        totalGames: recentActivity._count.id,
        totalBet: recentTotalBet.toString(),
        totalPayout: recentTotalPayout.toString(),
        houseProfit: (recentTotalBet - recentTotalPayout).toString()
      },
      multiplierDistribution: multiplierDistribution.map((item: any) => ({
        range: item.range,
        count: parseInt(item.count)
      }))
    }
  });
}));

export { router as statsRoutes };
