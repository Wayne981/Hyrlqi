'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings, 
  Wallet,
  Trophy,
  History,
  Zap
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';

const navigation = [
  { name: 'Games', href: '/games' },
  { name: 'Leaderboard', href: '/leaderboard' },
  { name: 'Statistics', href: '/stats' },
  { name: 'Help', href: '/help' },
];

const userMenuItems = [
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Wallet', href: '/wallet', icon: Wallet },
  { name: 'Game History', href: '/history', icon: History },
  { name: 'Achievements', href: '/achievements', icon: Trophy },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Navbar() {
  const { user, logout, isLoading, initialize } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initialize();
  }, [initialize]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      setUserMenuOpen(false);
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Hyrlqi</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Balance */}
                <div className="hidden sm:flex items-center space-x-2 bg-green-900/20 border border-green-500/20 rounded-lg px-3 py-2">
                  <Wallet className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-semibold">
                    ${parseFloat(user.balance).toLocaleString()}
                  </span>
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg px-3 py-2 transition-colors duration-200"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="hidden sm:block text-white font-medium">
                      {user.username}
                    </span>
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-gray-900/95 backdrop-blur-lg border border-gray-700 rounded-xl shadow-xl overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-gray-700">
                          <p className="text-sm text-gray-300">Signed in as</p>
                          <p className="text-sm font-semibold text-white truncate">
                            {user.email}
                          </p>
                        </div>

                        <div className="py-2">
                          {userMenuItems.map((item) => (
                            <Link
                              key={item.name}
                              href={item.href}
                              className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors duration-200"
                            >
                              <item.icon className="w-4 h-4" />
                              <span>{item.name}</span>
                            </Link>
                          ))}
                        </div>

                        <div className="border-t border-gray-700">
                          <button
                            onClick={handleLogout}
                            disabled={isLoading}
                            className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-gray-800/50 transition-colors duration-200 disabled:opacity-50"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>{isLoading ? 'Logging out...' : 'Sign out'}</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors duration-200"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-gray-900/95 backdrop-blur-lg border-t border-gray-800"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {/* Balance for mobile */}
              {user && (
                <div className="flex items-center justify-center space-x-2 bg-green-900/20 border border-green-500/20 rounded-lg px-3 py-2">
                  <Wallet className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-semibold">
                    ${parseFloat(user.balance).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Navigation items */}
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block text-gray-300 hover:text-white transition-colors duration-200 font-medium py-2"
                >
                  {item.name}
                </Link>
              ))}

              {/* User menu items for mobile */}
              {user && (
                <>
                  <div className="border-t border-gray-700 pt-4">
                    {userMenuItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors duration-200 py-2"
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </div>

                  <button
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="flex items-center space-x-3 text-red-400 hover:text-red-300 transition-colors duration-200 py-2 disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{isLoading ? 'Logging out...' : 'Sign out'}</span>
                  </button>
                </>
              )}

              {/* Auth buttons for mobile */}
              {!user && (
                <div className="border-t border-gray-700 pt-4 space-y-3">
                  <Link
                    href="/auth/login"
                    className="block text-center text-gray-300 hover:text-white transition-colors duration-200 font-medium py-2"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block text-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for user menu */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </nav>
  );
}
