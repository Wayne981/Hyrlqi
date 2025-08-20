import crypto from 'crypto';

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
  minePositions: number[];
  isCompleted: boolean;
  isWin: boolean;
  currentMultiplier: number;
  totalPayout: number;
  seed: string;
  nonce: number;
}

export interface MinesRevealResult {
  cellIndex: number;
  isMine: boolean;
  newMultiplier: number;
  payout: number;
  gameCompleted: boolean;
  isWin: boolean;
}

export class MinesEngine {
  private static readonly HOUSE_EDGE = 0.01; // 1% house edge
  private static readonly MAX_GRID_SIZE = 25; // 5x5 grid
  private static readonly MIN_MINES = 1;
  private static readonly MAX_MINES = 24;

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
   * Generate mine positions using Fisher-Yates shuffle with provably fair randomness
   */
  private static generateMinePositions(gridSize: number, mineCount: number, seed: string, nonce: number): number[] {
    if (mineCount >= gridSize) {
      throw new Error('Mine count cannot be greater than or equal to grid size');
    }

    // Create array of all possible positions
    const positions = Array.from({ length: gridSize }, (_, i) => i);
    
    // Shuffle using Fisher-Yates with provably fair randomness
    for (let i = gridSize - 1; i > 0; i--) {
      const random = this.generateRandom(seed, nonce + i);
      const j = Math.floor(random * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    // Return first mineCount positions as mine locations
    return positions.slice(0, mineCount).sort((a, b) => a - b);
  }

  /**
   * Calculate multiplier based on revealed safe cells
   */
  private static calculateMultiplier(
    revealedSafeCells: number,
    totalCells: number,
    mineCount: number
  ): number {
    if (revealedSafeCells === 0) {
      return 1;
    }

    const safeCells = totalCells - mineCount;
    
    if (revealedSafeCells >= safeCells) {
      // All safe cells revealed - maximum multiplier
      revealedSafeCells = safeCells;
    }

    // Calculate probability-based multiplier
    // Using hypergeometric distribution
    let multiplier = 1;
    
    for (let i = 0; i < revealedSafeCells; i++) {
      const remainingSafeCells = safeCells - i;
      const remainingTotalCells = totalCells - i;
      const probability = remainingSafeCells / remainingTotalCells;
      
      // Apply house edge
      const adjustedProbability = probability * (1 - this.HOUSE_EDGE);
      multiplier *= (1 / adjustedProbability);
    }

    return Math.round(multiplier * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Validate game configuration
   */
  private static validateConfig(config: MinesConfig): void {
    const { gridSize, mineCount, betAmount } = config;

    if (gridSize < 9 || gridSize > this.MAX_GRID_SIZE) {
      throw new Error(`Grid size must be between 9 and ${this.MAX_GRID_SIZE}`);
    }

    if (mineCount < this.MIN_MINES || mineCount > this.MAX_MINES || mineCount >= gridSize) {
      throw new Error(`Mine count must be between ${this.MIN_MINES} and ${Math.min(this.MAX_MINES, gridSize - 1)}`);
    }

    if (betAmount <= 0 || betAmount > 10000) {
      throw new Error('Bet amount must be between 0.01 and 10000');
    }
  }

  /**
   * Start a new Mines game
   */
  public static startGame(config: MinesConfig, seed: string, nonce: number): MinesGameState {
    this.validateConfig(config);

    const { gridSize, mineCount, betAmount } = config;
    const gameId = crypto.randomUUID();

    // Generate mine positions
    const minePositions = this.generateMinePositions(gridSize, mineCount, seed, nonce);

    return {
      gameId,
      gridSize,
      mineCount,
      betAmount,
      revealedCells: [],
      minePositions,
      isCompleted: false,
      isWin: false,
      currentMultiplier: 1,
      totalPayout: 0,
      seed,
      nonce
    };
  }

  /**
   * Reveal a cell in the game
   */
  public static revealCell(gameState: MinesGameState, cellIndex: number): MinesRevealResult {
    if (gameState.isCompleted) {
      throw new Error('Game is already completed');
    }

    if (cellIndex < 0 || cellIndex >= gameState.gridSize) {
      throw new Error('Invalid cell index');
    }

    if (gameState.revealedCells.includes(cellIndex)) {
      throw new Error('Cell already revealed');
    }

    const isMine = gameState.minePositions.includes(cellIndex);
    
    // Update revealed cells
    gameState.revealedCells.push(cellIndex);

    if (isMine) {
      // Hit a mine - game over
      gameState.isCompleted = true;
      gameState.isWin = false;
      gameState.totalPayout = 0;

      return {
        cellIndex,
        isMine: true,
        newMultiplier: 0,
        payout: 0,
        gameCompleted: true,
        isWin: false
      };
    } else {
      // Safe cell revealed
      const safeCellsRevealed = gameState.revealedCells.length;
      const totalSafeCells = gameState.gridSize - gameState.mineCount;
      
      // Calculate new multiplier
      const newMultiplier = this.calculateMultiplier(
        safeCellsRevealed,
        gameState.gridSize,
        gameState.mineCount
      );

      gameState.currentMultiplier = newMultiplier;
      const payout = gameState.betAmount * newMultiplier;
      gameState.totalPayout = payout;

      // Check if all safe cells are revealed
      const gameCompleted = safeCellsRevealed >= totalSafeCells;
      if (gameCompleted) {
        gameState.isCompleted = true;
        gameState.isWin = true;
      }

      return {
        cellIndex,
        isMine: false,
        newMultiplier,
        payout,
        gameCompleted,
        isWin: gameCompleted
      };
    }
  }

  /**
   * Cash out the current game
   */
  public static cashOut(gameState: MinesGameState): number {
    if (gameState.isCompleted) {
      throw new Error('Game is already completed');
    }

    if (gameState.revealedCells.length === 0) {
      throw new Error('Cannot cash out without revealing any cells');
    }

    gameState.isCompleted = true;
    gameState.isWin = true;

    return gameState.totalPayout;
  }

  /**
   * Get game statistics for a configuration
   */
  public static getGameStats(gridSize: number, mineCount: number) {
    if (mineCount >= gridSize || mineCount < 1) {
      throw new Error('Invalid mine configuration');
    }

    const safeCells = gridSize - mineCount;
    const maxMultiplier = this.calculateMultiplier(safeCells, gridSize, mineCount);
    
    // Calculate multipliers for each step
    const multipliers: { step: number; multiplier: number; probability: number }[] = [];
    
    for (let step = 1; step <= safeCells; step++) {
      const multiplier = this.calculateMultiplier(step, gridSize, mineCount);
      
      // Calculate probability of reaching this step
      let probability = 1;
      for (let i = 0; i < step; i++) {
        const remainingSafeCells = safeCells - i;
        const remainingTotalCells = gridSize - i;
        probability *= remainingSafeCells / remainingTotalCells;
      }

      multipliers.push({
        step,
        multiplier,
        probability
      });
    }

    // Calculate expected return
    const expectedReturn = multipliers.reduce((sum, item) => {
      return sum + (item.probability * item.multiplier);
    }, 0) / safeCells; // Average across all possible outcomes

    const houseEdge = Math.max(0, (1 - expectedReturn) * 100);

    return {
      gridSize,
      mineCount,
      safeCells,
      maxMultiplier,
      expectedReturn,
      houseEdge,
      multipliers
    };
  }

  /**
   * Generate cryptographically secure seed
   */
  public static generateSeed(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Verify game result for provably fair gaming
   */
  public static verifyGame(gameState: MinesGameState): boolean {
    try {
      // Regenerate mine positions with same seed and nonce
      const verifyMines = this.generateMinePositions(
        gameState.gridSize,
        gameState.mineCount,
        gameState.seed,
        gameState.nonce
      );

      // Check if mine positions match
      if (JSON.stringify(verifyMines) !== JSON.stringify(gameState.minePositions)) {
        return false;
      }

      // Verify multiplier calculation
      const safeCellsRevealed = gameState.revealedCells.filter(
        cell => !gameState.minePositions.includes(cell)
      ).length;

      const expectedMultiplier = this.calculateMultiplier(
        safeCellsRevealed,
        gameState.gridSize,
        gameState.mineCount
      );

      return Math.abs(gameState.currentMultiplier - expectedMultiplier) < 0.01;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get optimal strategy recommendation
   */
  public static getOptimalStrategy(gridSize: number, mineCount: number): {
    recommendedCashOutStep: number;
    expectedValue: number;
    riskLevel: 'low' | 'medium' | 'high';
  } {
    const stats = this.getGameStats(gridSize, mineCount);
    const safeCells = gridSize - mineCount;
    
    // Find step with best risk/reward ratio
    let bestStep = 1;
    let bestExpectedValue = 0;

    for (const item of stats.multipliers) {
      const expectedValue = item.probability * item.multiplier;
      if (expectedValue > bestExpectedValue) {
        bestExpectedValue = expectedValue;
        bestStep = item.step;
      }
    }

    // Determine risk level based on mine density
    const mineDensity = mineCount / gridSize;
    let riskLevel: 'low' | 'medium' | 'high';
    
    if (mineDensity < 0.3) {
      riskLevel = 'low';
    } else if (mineDensity < 0.6) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'high';
    }

    return {
      recommendedCashOutStep: bestStep,
      expectedValue: bestExpectedValue,
      riskLevel
    };
  }
}
