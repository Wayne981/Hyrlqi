'use client';

import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.token = token;
    const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.reconnectAttempts = 0;
      toast.success('Connected to live updates');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect
        return;
      }
      this.handleReconnection();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.handleReconnection();
    });

    // User count updates
    this.socket.on('user_count', (data) => {
      this.emit('userCount', data);
    });

    // Chat messages
    this.socket.on('chat_message', (message) => {
      this.emit('chatMessage', message);
    });

    // Game-specific events
    this.setupGameEventListeners();
  }

  private setupGameEventListeners() {
    if (!this.socket) return;

    // Plinko events
    this.socket.on('plinko_result', (result) => {
      this.emit('plinkoResult', result);
    });

    this.socket.on('plinko_public_result', (result) => {
      this.emit('plinkoPublicResult', result);
    });

    // Mines events
    this.socket.on('mines_result', (result) => {
      this.emit('minesResult', result);
    });

    this.socket.on('mines_update', (update) => {
      this.emit('minesUpdate', update);
    });

    // Crash events
    this.socket.on('crash_round_started', (data) => {
      this.emit('crashRoundStarted', data);
    });

    this.socket.on('crash_multiplier_update', (data) => {
      this.emit('crashMultiplierUpdate', data);
    });

    this.socket.on('crash_round_ended', (data) => {
      this.emit('crashRoundEnded', data);
    });

    // General game events
    this.socket.on('game_update', (data) => {
      this.emit('gameUpdate', data);
    });

    this.socket.on('live_stats', (stats) => {
      this.emit('liveStats', stats);
    });
  }

  private handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      toast.error('Connection lost. Please refresh the page.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      if (this.token) {
        this.connect(this.token);
      }
    }, delay);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.token = null;
    this.reconnectAttempts = 0;
  }

  // Game actions
  joinGame(gameType: string, roomId?: string) {
    this.socket?.emit('join_game', { gameType, roomId });
  }

  leaveGame(gameType: string, roomId?: string) {
    this.socket?.emit('leave_game', { gameType, roomId });
  }

  placeBet(betData: any) {
    this.socket?.emit('place_bet', betData);
  }

  gameAction(actionData: any) {
    this.socket?.emit('game_action', actionData);
  }

  // Chat
  sendChatMessage(message: string, room?: string) {
    this.socket?.emit('chat_message', { message, room });
  }

  // Event emitter functionality
  private eventListeners: { [key: string]: Function[] } = {};

  on(event: string, callback: Function) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event: string, callback?: Function) {
    if (!this.eventListeners[event]) return;

    if (callback) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    } else {
      delete this.eventListeners[event];
    }
  }

  private emit(event: string, data: any) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
    }
  }

  // Getters
  get connected() {
    return this.socket?.connected || false;
  }

  get id() {
    return this.socket?.id;
  }
}

// Create singleton instance
export const socketService = new SocketService();

// React hook for using socket in components
import { useEffect, useRef, useState } from 'react';

export function useSocket() {
  const socketRef = useRef(socketService);

  useEffect(() => {
    return () => {
      // Cleanup on unmount if needed
    };
  }, []);

  return socketRef.current;
}

// Hook for specific socket events
export function useSocketEvent(event: string, callback: Function) {
  const socket = useSocket();

  useEffect(() => {
    socket.on(event, callback);

    return () => {
      socket.off(event, callback);
    };
  }, [socket, event, callback]);
}

// Hook for socket connection status
export function useSocketConnection() {
  const socket = useSocket();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Set initial state
    setConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket]);

  return connected;
}

export default socketService;
