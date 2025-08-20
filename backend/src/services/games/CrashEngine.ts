import crypto from 'crypto';
import { EventEmitter } from 'events';

export interface CrashConfig {
  betAmount: number;
  autoCashOut?: number; // Auto cash out at this multiplier
}

export interface CrashGameState {
  roundId: string;
  startTime: number;
  currentMultiplier: number;
  crashPoint: number;
  isActive: boolean;
  isCrashed: boolean;
  players: Map<string, CrashPlayer>;
  seed: string;
  nonce: number;
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

export interface CrashResult {
  roundId: string;
  crashPoint: number;
  cashedOut: boolean;
  cashOutMultiplier?: number;
  payout: number;
  profit: number;
}

export class CrashEngine extends EventEmitter {
  private static readonly HOUSE_EDGE = 0.01; // 1% house edge
  private static readonly MIN_MULTIPLIER = 1.00;
  private static readonly MAX_MULTIPLIER = 1000000; // 1M max multiplier
  private static readonly GAME_DURATION = 20000; // 20 seconds max game duration
  private static readonly MULTIPLIER_GROWTH_RATE = 0.1; // 10% per 100ms

  private gameState: CrashGameState | null = null;
  private gameInterval: NodeJS.Timeout | null = null;
  private roundCounter = 0;

  /**
   * Generate cryptographically secure random number
   */
  private static generateRandom(seed: string, nonce: number): number {
    const hmac = crypto.createHmac('sha256', seed);
    hmac.update(`${nonce}`);
    const hash = hmac.digest('hex');
    
    const randomInt = parseInt(hash.substring(0, 8), 16);
    return randomInt / 0xffffffff;
  }

  /**
   * Calculate crash point using exponential distribution
   */
  private static calculateCrashPoint(seed: string, nonce: number): number {
    const random = this.generateRandom(seed, nonce);
    
    // Use exponential distribution with house edge
    // Formula: -ln(random) / lambda, where lambda controls the distribution
    const lambda = 1 / (1 - this.HOUSE_EDGE);
    const crashPoint = Math.max(
      this.MIN_MULTIPLIER,
      Math.min(
        this.MAX_MULTIPLIER,
        -Math.log(random) / lambda + 1
      )
    );

    // Round to 2 decimal places
    return Math.round(crashPoint * 100) / 100;
  }

  /**
   * Calculate current multiplier based on elapsed time
   */
  private static calculateCurrentMultiplier(startTime: number): number {
    const elapsed = Date.now() - startTime;
    const seconds = elapsed / 1000;
    
    // Exponential growth: 1.00x at start, growing exponentially
    const multiplier = Math.pow(1 + this.MULTIPLIER_GROWTH_RATE, seconds);
    
    return Math.round(multiplier * 100) / 100;
  }

  /**
   * Validate crash configuration
   */
  private static validateConfig(config: CrashConfig): void {
    const { betAmount, autoCashOut } = config;

    if (betAmount <= 0 || betAmount > 10000) {
      throw new Error('Bet amount must be between 0.01 and 10000');
    }

    if (autoCashOut !== undefined) {
      if (autoCashOut < this.MIN_MULTIPLIER || autoCashOut > this.MAX_MULTIPLIER) {
        throw new Error(`Auto cash out must be between ${this.MIN_MULTIPLIER} and ${this.MAX_MULTIPLIER}`);
      }
    }
  }

  /**
   * Start a new crash game round
   */
  public startNewRound(): CrashGameState {
    if (this.gameState && this.gameState.isActive) {
      throw new Error('Game is already active');
    }

    this.roundCounter++;
    const seed = this.generateSeed();
    const nonce = this.roundCounter;
    
    const crashPoint = CrashEngine.calculateCrashPoint(seed, nonce);
    
    this.gameState = {
      roundId: crypto.randomUUID(),
      startTime: Date.now(),
      currentMultiplier: CrashEngine.MIN_MULTIPLIER,
      crashPoint,
      isActive: true,
      isCrashed: false,
      players: new Map(),
      seed,
      nonce
    };

    this.emit('roundStarted', {
      roundId: this.gameState.roundId,
      startTime: this.gameState.startTime
    });

    this.startGameLoop();
    return this.gameState;
  }

  /**
   * Add player to current round
   */
  public placeBet(userId: string, username: string, config: CrashConfig): void {
    CrashEngine.validateConfig(config);

    if (!this.gameState || !this.gameState.isActive || this.gameState.isCrashed) {
      throw new Error('No active game to place bet on');
    }

    if (this.gameState.players.has(userId)) {
      throw new Error('Player already placed a bet this round');
    }

    const player: CrashPlayer = {
      userId,
      username,
      betAmount: config.betAmount,
      autoCashOut: config.autoCashOut,
      cashedOut: false,
      payout: 0
    };

    this.gameState.players.set(userId, player);

    this.emit('betPlaced', {
      roundId: this.gameState.roundId,
      userId,
      username,
      betAmount: config.betAmount,
      autoCashOut: config.autoCashOut
    });
  }

  /**
   * Cash out player manually
   */
  public cashOut(userId: string): CrashResult {
    if (!this.gameState || !this.gameState.isActive || this.gameState.isCrashed) {
      throw new Error('No active game to cash out from');
    }

    const player = this.gameState.players.get(userId);
    if (!player) {
      throw new Error('Player not found in current round');
    }

    if (player.cashedOut) {
      throw new Error('Player already cashed out');
    }

    // Cash out at current multiplier
    player.cashedOut = true;
    player.cashOutMultiplier = this.gameState.currentMultiplier;
    player.payout = player.betAmount * this.gameState.currentMultiplier;

    const result: CrashResult = {
      roundId: this.gameState.roundId,
      crashPoint: this.gameState.crashPoint,
      cashedOut: true,
      cashOutMultiplier: this.gameState.currentMultiplier,
      payout: player.payout,
      profit: player.payout - player.betAmount
    };

    this.emit('playerCashedOut', {
      roundId: this.gameState.roundId,
      userId,
      username: player.username,
      multiplier: this.gameState.currentMultiplier,
      payout: player.payout
    });

    return result;
  }

  /**
   * Start the game loop
   */
  private startGameLoop(): void {
    if (!this.gameState) return;

    this.gameInterval = setInterval(() => {
      if (!this.gameState || !this.gameState.isActive) {
        this.stopGameLoop();
        return;
      }

      // Update current multiplier
      this.gameState.currentMultiplier = CrashEngine.calculateCurrentMultiplier(this.gameState.startTime);

      // Check for auto cash outs
      this.processAutoCashOuts();

      // Check if we've reached the crash point
      if (this.gameState.currentMultiplier >= this.gameState.crashPoint) {
        this.crashGame();
        return;
      }

      // Check for maximum game duration
      const elapsed = Date.now() - this.gameState.startTime;
      if (elapsed >= CrashEngine.GAME_DURATION) {
        this.crashGame();
        return;
      }

      // Emit multiplier update
      this.emit('multiplierUpdate', {
        roundId: this.gameState.roundId,
        multiplier: this.gameState.currentMultiplier,
        elapsed
      });

    }, 100); // Update every 100ms
  }

  /**
   * Process auto cash outs
   */
  private processAutoCashOuts(): void {
    if (!this.gameState) return;

    this.gameState.players.forEach((player, userId) => {
      if (!player.cashedOut && 
          player.autoCashOut && 
          this.gameState!.currentMultiplier >= player.autoCashOut) {
        
        player.cashedOut = true;
        player.cashOutMultiplier = player.autoCashOut;
        player.payout = player.betAmount * player.autoCashOut;

        this.emit('playerCashedOut', {
          roundId: this.gameState!.roundId,
          userId,
          username: player.username,
          multiplier: player.autoCashOut,
          payout: player.payout,
          auto: true
        });
      }
    });
  }

  /**
   * Crash the game
   */
  private crashGame(): void {
    if (!this.gameState) return;

    this.gameState.isCrashed = true;
    this.gameState.isActive = false;
    this.stopGameLoop();

    // Calculate results for all players
    const results: Array<{ userId: string; result: CrashResult }> = [];

    this.gameState.players.forEach((player, userId) => {
      const result: CrashResult = {
        roundId: this.gameState!.roundId,
        crashPoint: this.gameState!.crashPoint,
        cashedOut: player.cashedOut,
        cashOutMultiplier: player.cashOutMultiplier,
        payout: player.cashedOut ? player.payout : 0,
        profit: player.cashedOut ? player.payout - player.betAmount : -player.betAmount
      };

      results.push({ userId, result });
    });

    this.emit('gameCrashed', {
      roundId: this.gameState.roundId,
      crashPoint: this.gameState.crashPoint,
      results
    });
  }

  /**
   * Stop the game loop
   */
  private stopGameLoop(): void {
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }
  }

  /**
   * Get current game state
   */
  public getCurrentGameState(): CrashGameState | null {
    return this.gameState;
  }

  /**
   * Get game statistics
   */
  public static getGameStats(): {
    houseEdge: number;
    averageCrashPoint: number;
    minMultiplier: number;
    maxMultiplier: number;
    expectedReturn: number;
  } {
    // Theoretical average crash point with house edge
    const averageCrashPoint = 1 / (1 - this.HOUSE_EDGE);
    const expectedReturn = 1 - this.HOUSE_EDGE;

    return {
      houseEdge: this.HOUSE_EDGE * 100,
      averageCrashPoint,
      minMultiplier: this.MIN_MULTIPLIER,
      maxMultiplier: this.MAX_MULTIPLIER,
      expectedReturn
    };
  }

  /**
   * Generate cryptographically secure seed
   */
  public generateSeed(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Verify game result for provably fair gaming
   */
  public static verifyResult(seed: string, nonce: number, claimedCrashPoint: number): boolean {
    try {
      const calculatedCrashPoint = this.calculateCrashPoint(seed, nonce);
      return Math.abs(calculatedCrashPoint - claimedCrashPoint) < 0.01;
    } catch (error) {
      return false;
    }
  }

  /**
   * Calculate probability of crash at specific multiplier
   */
  public static calculateCrashProbability(multiplier: number): number {
    if (multiplier < this.MIN_MULTIPLIER) return 0;
    if (multiplier >= this.MAX_MULTIPLIER) return 1;

    // Exponential distribution CDF
    const lambda = 1 / (1 - this.HOUSE_EDGE);
    return 1 - Math.exp(-lambda * (multiplier - 1));
  }

  /**
   * Get optimal cash out strategy
   */
  public static getOptimalStrategy(): {
    recommendedCashOut: number;
    expectedValue: number;
    winProbability: number;
  } {
    // Kelly criterion for optimal betting
    const optimalMultiplier = 1 / (1 - this.HOUSE_EDGE);
    const winProbability = 1 - this.calculateCrashProbability(optimalMultiplier);
    const expectedValue = winProbability * optimalMultiplier - (1 - winProbability);

    return {
      recommendedCashOut: Math.round(optimalMultiplier * 100) / 100,
      expectedValue,
      winProbability
    };
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.stopGameLoop();
    this.removeAllListeners();
    this.gameState = null;
  }
}
