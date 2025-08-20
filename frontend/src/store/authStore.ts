'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  username: string;
  balance: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateBalance: (newBalance: string) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isInitialized: false,

      initialize: () => {
        const state = get();
        if (state.token && !state.isInitialized) {
          // Set the token in API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
          
          // Refresh user data
          state.refreshUser().catch(() => {
            // If refresh fails, clear the auth state
            state.logout();
          });
        }
        set({ isInitialized: true });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          const response = await api.post('/auth/login', {
            email,
            password,
          });

          const { user, token } = response.data.data;
          
          // Set token in API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          set({ 
            user, 
            token, 
            isLoading: false 
          });
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.response?.data?.error?.message || 'Login failed');
        }
      },

      register: async (email: string, username: string, password: string, confirmPassword: string) => {
        set({ isLoading: true });
        
        try {
          const response = await api.post('/auth/register', {
            email,
            username,
            password,
            confirmPassword,
          });

          const { user, token } = response.data.data;
          
          // Set token in API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          set({ 
            user, 
            token, 
            isLoading: false 
          });
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.response?.data?.error?.message || 'Registration failed');
        }
      },

      logout: async () => {
        const { token } = get();
        
        if (token) {
          try {
            await api.post('/auth/logout');
          } catch (error) {
            // Ignore logout errors
            console.warn('Logout request failed:', error);
          }
        }

        // Clear token from API headers
        delete api.defaults.headers.common['Authorization'];
        
        set({ 
          user: null, 
          token: null, 
          isLoading: false 
        });
      },

      refreshUser: async () => {
        const { token } = get();
        
        if (!token) {
          throw new Error('No token available');
        }

        try {
          const response = await api.get('/auth/me');
          const { user } = response.data.data;
          
          set({ user });
        } catch (error: any) {
          // If refresh fails, clear auth state
          set({ 
            user: null, 
            token: null 
          });
          delete api.defaults.headers.common['Authorization'];
          throw error;
        }
      },

      updateBalance: (newBalance: string) => {
        const { user } = get();
        if (user) {
          set({ 
            user: { 
              ...user, 
              balance: newBalance 
            } 
          });
        }
      },
    }),
    {
      name: 'hyrlqi-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);
