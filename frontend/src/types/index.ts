// User types
export interface User {
  id: string;
  email: string;
  username: string;
  balance: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Game types
export type GameType = 'PLINKO' | 'MINES' | 'CRASH';

export interface GameResult {
  id: string;
  gameType: GameType;
  betAmount: string;
  payout: string;
  multiplier: number;
  isWin: boolean;
  createdAt: string;
  gameData: any;
}

// Plinko types
export interface PlinkoConfig {
  rows: 8 | 12 | 16;
  risk: 'low' | 'medium' | 'high';
  betAmount: number;
}

export interface PlinkoResult {
  ballPath: number[];
  finalSlot: number;
  multiplier: number;
  payout: number;
  isWin: boolean;
  seed: string;
  nonce: number;
  profit: number;
  newBalance: string;
}

export interface PlinkoStats {
  rows: number;
  risk: string;
  multipliers: number[];
  maxMultiplier: number;
  minMultiplier: number;
  expectedReturn: number;
  houseEdge: number;
  probabilities: Array<{
    slot: number;
    multiplier: number;
    probability: number;
  }>;
  totalSlots: number;
}

// Mines types
export interface MinesConfig {
  gridSize: number;
  mineCount: number;
  betAmount: number;
}

export interface MinesGameState {
  gameId: string;
  gridSize: number;
  mineCount: number;
  betAmount: number;
  revealedCells: number[];
  isCompleted: boolean;
  isWin: boolean;
  currentMultiplier: number;
  totalPayout: number;
}

export interface MinesRevealResult {
  cellIndex: number;
  isMine: boolean;
  newMultiplier: number;
  payout: number;
  gameCompleted: boolean;
  isWin: boolean;
}

export interface MinesStats {
  gridSize: number;
  mineCount: number;
  safeCells: number;
  maxMultiplier: number;
  expectedReturn: number;
  houseEdge: number;
  multipliers: Array<{
    step: number;
    multiplier: number;
    probability: number;
  }>;
}

// Crash types
export interface CrashConfig {
  betAmount: number;
  autoCashOut?: number;
}

export interface CrashGameState {
  roundId: string;
  startTime: number;
  currentMultiplier: number;
  isActive: boolean;
  isCrashed: boolean;
  playerCount: number;
}

export interface CrashResult {
  roundId: string;
  crashPoint: number;
  cashedOut: boolean;
  cashOutMultiplier?: number;
  payout: number;
  profit: number;
}

export interface CrashPlayer {
  userId: string;
  username: string;
  betAmount: number;
  autoCashOut?: number;
  cashedOut: boolean;
  cashOutMultiplier?: number;
  payout: number;
}

// Transaction types
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'BET' | 'WIN' | 'BONUS' | 'REFUND';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  description?: string;
  createdAt: string;
}

// Statistics types
export interface UserStats {
  overall: {
    totalGames: number;
    totalBet: string;
    totalPayout: string;
    totalProfit: string;
    averageMultiplier: number;
    biggestWin: string;
    biggestMultiplier: number;
  };
  byGame: Array<{
    gameType: GameType;
    totalGames: number;
    wins: number;
    winRate: number;
    totalBet: string;
    totalPayout: string;
    profit: string;
  }>;
  recent: {
    totalGames: number;
    totalBet: string;
    totalPayout: string;
    totalProfit: string;
  };
}

export interface PlatformStats {
  totalUsers: number;
  totalGames: number;
  totalVolume: string;
  totalPayout: string;
  houseProfit: string;
  recentActivity: number;
  gameStats: Array<{
    gameType: GameType;
    totalGames: number;
    totalVolume: string;
    totalPayout: string;
  }>;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  totalPayout?: string;
  profit?: string;
  payout?: string;
  multiplier?: number;
  totalGames?: number;
  gameType?: GameType;
  createdAt?: string;
}

export interface Leaderboard {
  topWinners: LeaderboardEntry[];
  profitLeaderboard: LeaderboardEntry[];
  biggestWins: LeaderboardEntry[];
  filters: {
    gameType: string;
    timeframe: string;
    limit: number;
  };
}

// Live activity types
export interface LiveActivity {
  recentGames: Array<{
    gameType: GameType;
    username: string;
    payout: string;
    multiplier: number;
    createdAt: string;
  }>;
  activeUsers: number;
  hourlyStats: Array<{
    gameType: GameType;
    gamesPlayed: number;
    totalVolume: string;
    totalPayout: string;
  }>;
  timestamp: string;
}

// Socket event types
export interface SocketEvents {
  // Connection events
  connect: () => void;
  disconnect: (reason: string) => void;
  
  // User events
  userCount: (data: { count: number; timestamp: string }) => void;
  
  // Chat events
  chatMessage: (message: {
    id: string;
    userId: string;
    username: string;
    message: string;
    timestamp: string;
  }) => void;
  
  // Game events
  gameUpdate: (data: any) => void;
  liveStats: (stats: any) => void;
  
  // Plinko events
  plinkoResult: (result: PlinkoResult) => void;
  plinkoPublicResult: (result: {
    username: string;
    multiplier: number;
    payout: number;
  }) => void;
  
  // Mines events
  minesResult: (result: any) => void;
  minesUpdate: (update: any) => void;
  
  // Crash events
  crashRoundStarted: (data: {
    roundId: string;
    startTime: number;
  }) => void;
  crashMultiplierUpdate: (data: {
    roundId: string;
    multiplier: number;
  }) => void;
  crashRoundEnded: (data: {
    roundId: string;
    crashPoint: number;
    winners: any[];
  }) => void;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileForm {
  username?: string;
  email?: string;
}

// Error types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

// Game configuration types
export interface GameSettings {
  id: string;
  gameType: GameType;
  settings: {
    houseEdge: number;
    minBet: number;
    maxBet: number;
    [key: string]: any;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Session types
export interface Session {
  id: string;
  isCurrentSession: boolean;
  expiresAt: string;
  createdAt: string;
}
