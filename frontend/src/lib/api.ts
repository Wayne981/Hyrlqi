import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now(),
    };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login or clear auth
      if (typeof window !== 'undefined') {
        // Clear auth state
        localStorage.removeItem('hyrlqi-auth');
        delete api.defaults.headers.common['Authorization'];
        
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/auth/')) {
          window.location.href = '/auth/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (email: string, username: string, password: string, confirmPassword: string) =>
    api.post('/auth/register', { email, username, password, confirmPassword }),
  
  logout: () => api.post('/auth/logout'),
  
  getProfile: () => api.get('/auth/me'),
  
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) =>
    api.put('/auth/change-password', { currentPassword, newPassword, confirmPassword }),
  
  refreshToken: () => api.post('/auth/refresh'),
  
  verifyToken: () => api.get('/auth/verify'),
};

export const gameAPI = {
  // Plinko
  playPlinko: (rows: number, risk: string, betAmount: number) =>
    api.post('/games/plinko/play', { rows, risk, betAmount }),
  
  getPlinkoStats: (rows: number, risk: string) =>
    api.get(`/games/plinko/stats/${rows}/${risk}`),
  
  // Mines
  startMines: (gridSize: number, mineCount: number, betAmount: number) =>
    api.post('/games/mines/start', { gridSize, mineCount, betAmount }),
  
  revealMinesCell: (gameId: string, cellIndex: number) =>
    api.post('/games/mines/reveal', { gameId, cellIndex }),
  
  cashOutMines: (gameId: string) =>
    api.post('/games/mines/cashout', { gameId }),
  
  getMinesStats: (gridSize: number, mineCount: number) =>
    api.get(`/games/mines/stats/${gridSize}/${mineCount}`),
  
  // Crash
  getCurrentCrash: () => api.get('/games/crash/current'),
  
  placeCrashBet: (betAmount: number, autoCashOut?: number) =>
    api.post('/games/crash/bet', { betAmount, autoCashOut }),
  
  crashCashOut: () => api.post('/games/crash/cashout'),
  
  getCrashStats: () => api.get('/games/crash/stats'),
  
  // General
  getGameHistory: (page?: number, limit?: number, gameType?: string) =>
    api.get('/games/history', { params: { page, limit, gameType } }),
  
  getGameSummary: () => api.get('/games/stats/summary'),
};

export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  
  updateProfile: (data: { username?: string; email?: string }) =>
    api.put('/user/profile', data),
  
  getBalance: () => api.get('/user/balance'),
  
  getTransactions: (page?: number, limit?: number, type?: string) =>
    api.get('/user/transactions', { params: { page, limit, type } }),
  
  getStats: () => api.get('/user/stats'),
  
  getSessions: () => api.get('/user/sessions'),
  
  deleteSession: (sessionId: string) =>
    api.delete(`/user/sessions/${sessionId}`),
  
  deactivateAccount: () => api.post('/user/deactivate'),
};

export const statsAPI = {
  getPlatformStats: () => api.get('/stats/platform'),
  
  getLeaderboard: (gameType?: string, timeframe?: string, limit?: number) =>
    api.get('/stats/leaderboard', { params: { gameType, timeframe, limit } }),
  
  getLiveStats: () => api.get('/stats/live'),
  
  getGameStats: (gameType: string) => api.get(`/stats/games/${gameType}`),
};

export default api;
