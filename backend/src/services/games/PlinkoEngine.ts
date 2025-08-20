import crypto from 'crypto';

export interface PlinkoConfig {
  rows: number;
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
}

export class PlinkoEngine {
  private static readonly MULTIPLIERS = {
    low: {
      8: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
      12: [8.4, 3, 1.9, 1.2, 1, 0.7, 0.7, 1, 1.2, 1.9, 3, 8.4],
      16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16]
    },
    medium: {
      8: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
      12: [24, 5, 2, 1.4, 0.6, 0.4, 0.4, 0.6, 1.4, 2, 5, 24],
      16: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.2, 0.2, 0.3, 0.6, 1.1, 2, 4, 11, 33]
    },
    high: {
      8: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
      12: [43, 7, 2, 0.6, 0.2, 0.1, 0.1, 0.2, 0.6, 2, 7, 43],
      16: [58, 15, 7, 2, 0.7, 0.2, 0.1, 0.1, 0.1, 0.1, 0.2, 0.7, 2, 7, 15, 58]
    }
  };

  private static readonly HOUSE_EDGE = 0.01; // 1% house edge

  /**
   * Generate a provably fair random number using HMAC-SHA256
   */
  private static generateRandom(seed: string, nonce: number): number {
    const hmac = crypto.createHmac('sha256', seed);
    hmac.update(`${nonce}`);
    const hash = hmac.digest('hex');
    
    // Convert first 8 characters of hash to integer
    const randomInt = parseInt(hash.substring(0, 8), 16);
    
    // Convert to float between 0 and 1
    return randomInt / 0xffffffff;
  }

  /**
   * Simulate ball path through Plinko board
   */
  private static simulateBallPath(rows: number, seed: string, nonce: number): number[] {
    const path: number[] = [];
    let position = 0;

    for (let row = 0; row < rows; row++) {
      const random = this.generateRandom(seed, nonce + row);
      
      // Ball bounces left (0) or right (1)
      const direction = random < 0.5 ? 0 : 1;
      path.push(direction);
      
      if (direction === 1) {
        position++;
      }
    }

    return path;
  }

  /**
   * Calculate final slot based on ball path
   */
  private static calculateFinalSlot(ballPath: number[]): number {
    return ballPath.reduce((position, direction) => position + direction, 0);
  }

  /**
   * Get multiplier for specific slot
   */
  private static getMultiplier(rows: number, risk: 'low' | 'medium' | 'high', slot: number): number {
    const multipliers = this.MULTIPLIERS[risk][rows as keyof typeof this.MULTIPLIERS[typeof risk]];
    
    if (!multipliers) {
      throw new Error(`Invalid configuration: ${rows} rows with ${risk} risk`);
    }

    return multipliers[slot] || 0;
  }

  /**
   * Calculate expected return for validation
   */
  private static calculateExpectedReturn(rows: number, risk: 'low' | 'medium' | 'high'): number {
    const multipliers = this.MULTIPLIERS[risk][rows as keyof typeof this.MULTIPLIERS[typeof risk]];
    
    if (!multipliers) {
      return 0;
    }

    // Calculate probability for each slot (binomial distribution)
    const totalSlots = multipliers.length;
    let expectedReturn = 0;

    for (let slot = 0; slot < totalSlots; slot++) {
      // Binomial probability: C(n,k) * p^k * (1-p)^(n-k)
      // where n = rows, k = slot, p = 0.5
      const probability = this.binomialProbability(rows, slot, 0.5);
      expectedReturn += probability * multipliers[slot];
    }

    return expectedReturn;
  }

  /**
   * Calculate binomial probability
   */
  private static binomialProbability(n: number, k: number, p: number): number {
    const coefficient = this.binomialCoefficient(n, k);
    return coefficient * Math.pow(p, k) * Math.pow(1 - p, n - k);
  }

  /**
   * Calculate binomial coefficient (n choose k)
   */
  private static binomialCoefficient(n: number, k: number): number {
    if (k > n || k < 0) return 0;
    if (k === 0 || k === n) return 1;

    let result = 1;
    for (let i = 1; i <= Math.min(k, n - k); i++) {
      result = result * (n - i + 1) / i;
    }
    return result;
  }

  /**
   * Validate game configuration
   */
  private static validateConfig(config: PlinkoConfig): void {
    const { rows, risk, betAmount } = config;

    if (![8, 12, 16].includes(rows)) {
      throw new Error('Invalid rows count. Must be 8, 12, or 16.');
    }

    if (!['low', 'medium', 'high'].includes(risk)) {
      throw new Error('Invalid risk level. Must be low, medium, or high.');
    }

    if (betAmount <= 0 || betAmount > 10000) {
      throw new Error('Invalid bet amount. Must be between 0.01 and 10000.');
    }

    // Validate expected return is close to (1 - house edge)
    const expectedReturn = this.calculateExpectedReturn(rows, risk);
    const targetReturn = 1 - this.HOUSE_EDGE;
    
    if (Math.abs(expectedReturn - targetReturn) > 0.05) {
      console.warn(`Expected return ${expectedReturn} differs significantly from target ${targetReturn}`);
    }
  }

  /**
   * Play a single Plinko game
   */
  public static playGame(config: PlinkoConfig, seed: string, nonce: number): PlinkoResult {
    this.validateConfig(config);

    const { rows, risk, betAmount } = config;

    // Simulate ball path
    const ballPath = this.simulateBallPath(rows, seed, nonce);
    
    // Calculate final slot
    const finalSlot = this.calculateFinalSlot(ballPath);
    
    // Get multiplier
    const multiplier = this.getMultiplier(rows, risk, finalSlot);
    
    // Calculate payout
    const payout = betAmount * multiplier;
    const isWin = payout > betAmount;

    return {
      ballPath,
      finalSlot,
      multiplier,
      payout,
      isWin,
      seed,
      nonce
    };
  }

  /**
   * Get game statistics
   */
  public static getGameStats(rows: number, risk: 'low' | 'medium' | 'high') {
    const multipliers = this.MULTIPLIERS[risk][rows as keyof typeof this.MULTIPLIERS[typeof risk]];
    
    if (!multipliers) {
      throw new Error(`Invalid configuration: ${rows} rows with ${risk} risk`);
    }

    const maxMultiplier = Math.max(...multipliers);
    const minMultiplier = Math.min(...multipliers);
    const expectedReturn = this.calculateExpectedReturn(rows, risk);
    const houseEdge = (1 - expectedReturn) * 100;

    // Calculate probability distribution
    const probabilities = multipliers.map((_, slot) => ({
      slot,
      multiplier: multipliers[slot],
      probability: this.binomialProbability(rows, slot, 0.5)
    }));

    return {
      rows,
      risk,
      multipliers,
      maxMultiplier,
      minMultiplier,
      expectedReturn,
      houseEdge,
      probabilities,
      totalSlots: multipliers.length
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
  public static verifyResult(config: PlinkoConfig, result: PlinkoResult): boolean {
    try {
      const recalculated = this.playGame(config, result.seed, result.nonce);
      
      return (
        JSON.stringify(recalculated.ballPath) === JSON.stringify(result.ballPath) &&
        recalculated.finalSlot === result.finalSlot &&
        recalculated.multiplier === result.multiplier &&
        Math.abs(recalculated.payout - result.payout) < 0.01
      );
    } catch (error) {
      return false;
    }
  }
}
