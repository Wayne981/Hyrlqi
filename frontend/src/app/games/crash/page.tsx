'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowLeft, Play, RotateCcw, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';

export default function CrashPage() {
  const { user } = useAuthStore();
  const [betAmount, setBetAmount] = useState(10);
  const [autoCashOut, setAutoCashOut] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [gameHistory, setGameHistory] = useState<number[]>([]);
  const [hasActiveBet, setHasActiveBet] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  const startGame = () => {
    if (!user) {
      toast.error('Please login to play');
      return;
    }

    if (betAmount > user.balance) {
      toast.error('Insufficient balance');
      return;
    }

    setIsPlaying(true);
    setGameActive(true);
    setCurrentMultiplier(1.0);
    setHasActiveBet(true);
    
    // Simulate crash game
    const crashPoint = Math.random() * 10 + 1; // Random crash between 1x and 11x
    let multiplier = 1.0;
    
    intervalRef.current = setInterval(() => {
      multiplier += 0.01;
      setCurrentMultiplier(multiplier);
      
      // Check auto cash out
      if (autoCashOut && multiplier >= autoCashOut) {
        handleCashOut(multiplier);
        return;
      }
      
      // Check if crashed
      if (multiplier >= crashPoint) {
        handleCrash(crashPoint);
        return;
      }
    }, 50);
  };

  const handleCashOut = (multiplier?: number) => {
    if (!hasActiveBet) return;
    
    const finalMultiplier = multiplier || currentMultiplier;
    const winAmount = betAmount * finalMultiplier;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setGameActive(false);
    setIsPlaying(false);
    setHasActiveBet(false);
    
    // Add to history
    setGameHistory(prev => [finalMultiplier, ...prev.slice(0, 9)]);
    
    toast.success(`Cashed out at ${finalMultiplier.toFixed(2)}x! Won $${winAmount.toFixed(2)}`);
  };

  const handleCrash = (crashPoint: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setCurrentMultiplier(crashPoint);
    setGameActive(false);
    setIsPlaying(false);
    
    if (hasActiveBet) {
      setHasActiveBet(false);
      toast.error(`💥 Crashed at ${crashPoint.toFixed(2)}x! You lost $${betAmount}`);
    }
    
    // Add to history
    setGameHistory(prev => [crashPoint, ...prev.slice(0, 9)]);
    
    // Auto start next round after 3 seconds
    setTimeout(() => {
      setCurrentMultiplier(1.0);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/games">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Crash</h1>
                <p className="text-gray-400">Cash out before it crashes!</p>
              </div>
            </div>
          </div>
          
          {user && (
            <div className="text-right">
              <p className="text-gray-400">Balance</p>
              <p className="text-2xl font-bold text-green-400">${user.balance}</p>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Game Controls */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-6">Game Controls</h2>
              
              {/* Bet Amount */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bet Amount
                </label>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  min="1"
                  max={user?.balance || 1000}
                  disabled={gameActive}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-green-500 focus:outline-none disabled:opacity-50"
                />
              </div>

              {/* Auto Cash Out */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Auto Cash Out (Optional)
                </label>
                <input
                  type="number"
                  value={autoCashOut || ''}
                  onChange={(e) => setAutoCashOut(e.target.value ? Number(e.target.value) : null)}
                  min="1.01"
                  step="0.01"
                  placeholder="e.g. 2.00"
                  disabled={gameActive}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-green-500 focus:outline-none disabled:opacity-50"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {!gameActive ? (
                  <button
                    onClick={startGame}
                    disabled={!user}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Place Bet (${betAmount})
                  </button>
                ) : hasActiveBet ? (
                  <button
                    onClick={() => handleCashOut()}
                    className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all duration-300"
                  >
                    Cash Out (${(betAmount * currentMultiplier).toFixed(2)})
                  </button>
                ) : (
                  <div className="w-full py-4 bg-gray-600 text-gray-400 font-bold rounded-xl text-center">
                    Watching Game
                  </div>
                )}
              </div>
            </div>

            {/* Game History */}
            <div className="mt-6 bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <h3 className="text-lg font-bold mb-4">Recent Crashes</h3>
              <div className="grid grid-cols-2 gap-2">
                {gameHistory.map((crash, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-lg text-center text-sm font-bold ${
                      crash >= 2 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {crash.toFixed(2)}x
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Game Display */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 min-h-[600px] flex flex-col">
              {/* Multiplier Display */}
              <div className="text-center mb-8">
                <motion.div
                  animate={{ scale: gameActive ? [1, 1.1, 1] : 1 }}
                  transition={{ repeat: gameActive ? Infinity : 0, duration: 1 }}
                  className={`text-6xl font-bold mb-4 ${
                    gameActive 
                      ? currentMultiplier >= 2 
                        ? 'text-green-400' 
                        : 'text-yellow-400'
                      : 'text-gray-400'
                  }`}
                >
                  {currentMultiplier.toFixed(2)}x
                </motion.div>
                
                {gameActive ? (
                  <p className="text-lg text-gray-300">
                    {hasActiveBet ? 'Your bet is active!' : 'Watching the multiplier...'}
                  </p>
                ) : (
                  <p className="text-lg text-gray-400">
                    Place a bet to start the next round
                  </p>
                )}
              </div>

              {/* Game Visualization */}
              <div className="flex-1 flex items-center justify-center">
                <div className="relative w-full max-w-2xl h-64 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl border border-gray-600 overflow-hidden">
                  {/* Grid Lines */}
                  <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Horizontal lines */}
                    {Array.from({ length: 5 }, (_, i) => (
                      <line key={`h-${i}`} x1="0" y1={i * 25} x2="100" y2={i * 25} stroke="currentColor" strokeWidth="0.2"/>
                    ))}
                    {/* Vertical lines */}
                    {Array.from({ length: 6 }, (_, i) => (
                      <line key={`v-${i}`} x1={i * 20} y1="0" x2={i * 20} y2="100" stroke="currentColor" strokeWidth="0.2"/>
                    ))}
                  </svg>

                  {/* Multiplier Curve */}
                  <motion.div
                    className="absolute bottom-0 left-0 bg-gradient-to-r from-green-500 to-emerald-500 h-1 shadow-lg"
                    style={{ 
                      width: gameActive 
                        ? `${Math.min((currentMultiplier - 1) * 15, 100)}%` 
                        : '0%' 
                    }}
                    animate={{ 
                      width: gameActive 
                        ? `${Math.min((currentMultiplier - 1) * 15, 100)}%` 
                        : '0%' 
                    }}
                    transition={{ duration: 0.1 }}
                  />
                  
                  {/* Animated Plane */}
                  {gameActive && (
                    <motion.div
                      className="absolute text-2xl"
                      style={{
                        left: `${Math.min((currentMultiplier - 1) * 15, 95)}%`,
                        bottom: `${Math.min((currentMultiplier - 1) * 8, 80)}%`,
                      }}
                      animate={{
                        left: `${Math.min((currentMultiplier - 1) * 15, 95)}%`,
                        bottom: `${Math.min((currentMultiplier - 1) * 8, 80)}%`,
                        rotate: gameActive ? [0, 5, 0] : 0,
                      }}
                      transition={{ 
                        left: { duration: 0.1 },
                        bottom: { duration: 0.1 },
                        rotate: { repeat: Infinity, duration: 2 }
                      }}
                    >
                      ✈️
                    </motion.div>
                  )}
                  
                  {/* Crash Effect */}
                  {!gameActive && gameHistory.length > 0 && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="text-center">
                        <motion.div 
                          className="text-4xl mb-2"
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 0.5 }}
                        >
                          💥
                        </motion.div>
                        <div className="text-xl font-bold text-red-400">
                          CRASHED AT {gameHistory[0]?.toFixed(2)}x
                        </div>
                        <motion.div
                          className="text-6xl mt-2"
                          initial={{ y: -50, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          🔥
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Waiting State */}
                  {!gameActive && gameHistory.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <motion.div 
                          className="text-4xl mb-4"
                          animate={{ y: [0, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          ✈️
                        </motion.div>
                        <p className="text-gray-400">Ready for takeoff!</p>
                        <p className="text-sm text-gray-500">Place your bet to start</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Multiplier Trail */}
                  {gameActive && (
                    <div className="absolute top-4 left-4 text-xs text-gray-400 space-y-1">
                      <div>Height: {((currentMultiplier - 1) * 1000).toFixed(0)}ft</div>
                      <div>Speed: {(currentMultiplier * 50).toFixed(0)} mph</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
