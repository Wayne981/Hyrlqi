import { createClient, RedisClientType } from 'redis';

export class RedisClient {
  private client: RedisClientType;
  private connected: boolean = false;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500)
      }
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.connected = false;
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
      this.connected = true;
    });

    this.client.on('disconnect', () => {
      console.log('Redis Client Disconnected');
      this.connected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.connected) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.disconnect();
    }
  }

  async ping(): Promise<string> {
    return await this.client.ping();
  }

  // Session management
  async setSession(sessionId: string, userId: string, expirationSeconds: number = 86400): Promise<void> {
    await this.client.setEx(`session:${sessionId}`, expirationSeconds, userId);
  }

  async getSession(sessionId: string): Promise<string | null> {
    return await this.client.get(`session:${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.client.del(`session:${sessionId}`);
  }

  // User balance caching
  async cacheUserBalance(userId: string, balance: string, expirationSeconds: number = 300): Promise<void> {
    await this.client.setEx(`balance:${userId}`, expirationSeconds, balance);
  }

  async getCachedUserBalance(userId: string): Promise<string | null> {
    return await this.client.get(`balance:${userId}`);
  }

  async invalidateUserBalance(userId: string): Promise<void> {
    await this.client.del(`balance:${userId}`);
  }

  // Rate limiting
  async incrementRateLimit(key: string, windowSeconds: number, maxRequests: number): Promise<{ count: number; allowed: boolean }> {
    const multi = this.client.multi();
    const redisKey = `rate_limit:${key}`;
    
    multi.incr(redisKey);
    multi.expire(redisKey, windowSeconds);
    
    const results = await multi.exec();
    const count = results?.[0] as number || 0;
    
    return {
      count,
      allowed: count <= maxRequests
    };
  }

  // Game state caching
  async cacheGameState(gameId: string, state: any, expirationSeconds: number = 3600): Promise<void> {
    await this.client.setEx(`game_state:${gameId}`, expirationSeconds, JSON.stringify(state));
  }

  async getCachedGameState(gameId: string): Promise<any | null> {
    const state = await this.client.get(`game_state:${gameId}`);
    return state ? JSON.parse(state) : null;
  }

  async deleteCachedGameState(gameId: string): Promise<void> {
    await this.client.del(`game_state:${gameId}`);
  }

  // Leaderboard management
  async addToLeaderboard(leaderboardName: string, userId: string, score: number): Promise<void> {
    await this.client.zAdd(`leaderboard:${leaderboardName}`, { score, value: userId });
  }

  async getLeaderboard(leaderboardName: string, start: number = 0, end: number = 9): Promise<Array<{ userId: string; score: number; rank: number }>> {
    const results = await this.client.zRangeWithScores(`leaderboard:${leaderboardName}`, start, end, { REV: true });
    
    return results.map((result, index) => ({
      userId: result.value,
      score: result.score,
      rank: start + index + 1
    }));
  }

  async getUserRank(leaderboardName: string, userId: string): Promise<number | null> {
    const rank = await this.client.zRevRank(`leaderboard:${leaderboardName}`, userId);
    return rank !== null ? rank + 1 : null;
  }

  // Live game statistics
  async incrementGameStats(gameType: string, field: string, value: number = 1): Promise<void> {
    await this.client.hIncrBy(`game_stats:${gameType}`, field, value);
  }

  async getGameStats(gameType: string): Promise<Record<string, string>> {
    return await this.client.hGetAll(`game_stats:${gameType}`);
  }

  // Pub/Sub for real-time features
  async publish(channel: string, message: any): Promise<number> {
    return await this.client.publish(channel, JSON.stringify(message));
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    const subscriber = this.client.duplicate();
    await subscriber.connect();
    
    await subscriber.subscribe(channel, (message) => {
      try {
        const parsedMessage = JSON.parse(message);
        callback(parsedMessage);
      } catch (error) {
        console.error('Error parsing Redis message:', error);
      }
    });
  }

  // Generic key-value operations
  async set(key: string, value: string, expirationSeconds?: number): Promise<void> {
    if (expirationSeconds) {
      await this.client.setEx(key, expirationSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  async flushAll(): Promise<void> {
    await this.client.flushAll();
  }

  // Health check
  isConnected(): boolean {
    return this.connected;
  }
}
