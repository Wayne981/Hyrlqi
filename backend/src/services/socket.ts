import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

export class SocketService {
  private io: Server;
  private connectedUsers: Map<string, AuthenticatedSocket> = new Map();

  constructor(io: Server) {
    this.io = io;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.use(this.authenticateSocket.bind(this));

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.username} connected with socket ${socket.id}`);
      
      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket);
        this.emitUserCount();
      }

      // Game-specific handlers
      socket.on('join_game', this.handleJoinGame.bind(this, socket));
      socket.on('leave_game', this.handleLeaveGame.bind(this, socket));
      socket.on('place_bet', this.handlePlaceBet.bind(this, socket));
      socket.on('game_action', this.handleGameAction.bind(this, socket));

      // Chat handlers
      socket.on('chat_message', this.handleChatMessage.bind(this, socket));

      // Disconnect handler
      socket.on('disconnect', () => {
        console.log(`User ${socket.username} disconnected`);
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          this.emitUserCount();
        }
      });
    });
  }

  private async authenticateSocket(socket: AuthenticatedSocket, next: (err?: any) => void): Promise<void> {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, username: true, isActive: true }
      });

      if (!user || !user.isActive) {
        return next(new Error('Invalid or inactive user'));
      }

      socket.userId = user.id;
      socket.username = user.username;
      
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  }

  private handleJoinGame(socket: AuthenticatedSocket, data: { gameType: string; roomId?: string }): void {
    const { gameType, roomId } = data;
    const room = roomId || gameType;
    
    socket.join(room);
    socket.emit('game_joined', { gameType, room });
    
    // Notify others in the room
    socket.to(room).emit('user_joined', {
      userId: socket.userId,
      username: socket.username
    });

    console.log(`User ${socket.username} joined ${gameType} game`);
  }

  private handleLeaveGame(socket: AuthenticatedSocket, data: { gameType: string; roomId?: string }): void {
    const { gameType, roomId } = data;
    const room = roomId || gameType;
    
    socket.leave(room);
    socket.emit('game_left', { gameType, room });
    
    // Notify others in the room
    socket.to(room).emit('user_left', {
      userId: socket.userId,
      username: socket.username
    });

    console.log(`User ${socket.username} left ${gameType} game`);
  }

  private handlePlaceBet(socket: AuthenticatedSocket, data: any): void {
    // This will be handled by individual game services
    socket.emit('bet_placed', data);
  }

  private handleGameAction(socket: AuthenticatedSocket, data: any): void {
    // This will be handled by individual game services
    socket.emit('game_action_received', data);
  }

  private handleChatMessage(socket: AuthenticatedSocket, data: { message: string; room?: string }): void {
    const { message, room = 'general' } = data;
    
    if (!message || message.trim().length === 0 || message.length > 500) {
      return;
    }

    const chatMessage = {
      id: Date.now().toString(),
      userId: socket.userId,
      username: socket.username,
      message: message.trim(),
      timestamp: new Date().toISOString()
    };

    // Emit to all users in the room
    this.io.to(room).emit('chat_message', chatMessage);
  }

  // Public methods for game services
  public emitToUser(userId: string, event: string, data: any): void {
    const socket = this.connectedUsers.get(userId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  public emitToRoom(room: string, event: string, data: any): void {
    this.io.to(room).emit(event, data);
  }

  public emitToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }

  public getUserSocket(userId: string): AuthenticatedSocket | undefined {
    return this.connectedUsers.get(userId);
  }

  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  public getConnectedUsersInRoom(room: string): AuthenticatedSocket[] {
    const sockets: AuthenticatedSocket[] = [];
    const roomSockets = this.io.sockets.adapter.rooms.get(room);
    
    if (roomSockets) {
      roomSockets.forEach(socketId => {
        const socket = this.io.sockets.sockets.get(socketId) as AuthenticatedSocket;
        if (socket && socket.userId) {
          sockets.push(socket);
        }
      });
    }
    
    return sockets;
  }

  private emitUserCount(): void {
    this.emitToAll('user_count', {
      count: this.getConnectedUsersCount(),
      timestamp: new Date().toISOString()
    });
  }

  // Game-specific methods
  public emitGameUpdate(gameType: string, data: any): void {
    this.emitToRoom(gameType, 'game_update', data);
  }

  public emitGameResult(gameType: string, data: any): void {
    this.emitToRoom(gameType, 'game_result', data);
  }

  public emitLiveStats(gameType: string, stats: any): void {
    this.emitToRoom(gameType, 'live_stats', stats);
  }

  // Crash game specific methods
  public startCrashRound(roundId: string, data: any): void {
    this.emitToRoom('crash', 'crash_round_started', { roundId, ...data });
  }

  public updateCrashMultiplier(roundId: string, multiplier: number): void {
    this.emitToRoom('crash', 'crash_multiplier_update', { roundId, multiplier });
  }

  public crashRoundEnded(roundId: string, crashPoint: number, winners: any[]): void {
    this.emitToRoom('crash', 'crash_round_ended', { roundId, crashPoint, winners });
  }

  // Plinko game specific methods
  public emitPlinkoResult(userId: string, result: any): void {
    this.emitToUser(userId, 'plinko_result', result);
    this.emitToRoom('plinko', 'plinko_public_result', {
      username: this.connectedUsers.get(userId)?.username,
      multiplier: result.multiplier,
      payout: result.payout
    });
  }

  // Mines game specific methods
  public emitMinesResult(userId: string, result: any): void {
    this.emitToUser(userId, 'mines_result', result);
  }

  public emitMinesUpdate(userId: string, update: any): void {
    this.emitToUser(userId, 'mines_update', update);
  }
}
