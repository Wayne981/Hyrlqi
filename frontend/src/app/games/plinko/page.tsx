'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, ArrowLeft, Play, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';

export default function PlinkoPage() {
  const { user } = useAuthStore();
  const [betAmount, setBetAmount] = useState(10);
  const [riskLevel, setRiskLevel] = useState('medium');
  const [rows, setRows] = useState(16);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const riskLevels = [
    { value: 'low', label: 'Low Risk', color: 'from-green-500 to-emerald-500' },
    { value: 'medium', label: 'Medium Risk', color: 'from-yellow-500 to-orange-500' },
    { value: 'high', label: 'High Risk', color: 'from-red-500 to-pink-500' }
  ];

  const handlePlay = async () => {
    if (!user) {
      toast.error('Please login to play');
      return;
    }

    if (betAmount > user.balance) {
      toast.error('Insufficient balance');
      return;
    }

    setIsPlaying(true);
    
    try {
      // Simulate game logic for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const multiplier = Math.random() * 10 + 0.5; // Random multiplier between 0.5x and 10.5x
      const winAmount = betAmount * multiplier;
      
      setLastResult({
        betAmount,
        multiplier: multiplier.toFixed(2),
        winAmount: winAmount.toFixed(2),
        profit: (winAmount - betAmount).toFixed(2)
      });
      
      if (multiplier > 1) {
        toast.success(`You won ${winAmount.toFixed(2)}! (${multiplier.toFixed(2)}x)`);
      } else {
        toast.error(`You lost ${betAmount}. Better luck next time!`);
      }
    } catch (error) {
      toast.error('Game error occurred');
    } finally {
      setIsPlaying(false);
    }
  };

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
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Plinko</h1>
                <p className="text-gray-400">Drop the ball and watch it bounce!</p>
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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Game Controls */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-6">Game Settings</h2>
              
              {/* Bet Amount */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bet Amount
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    min="1"
                    max={user?.balance || 1000}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-gray-400">$</span>
                </div>
              </div>

              {/* Risk Level */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Risk Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {riskLevels.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setRiskLevel(level.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        riskLevel === level.value
                          ? 'border-blue-500 bg-blue-500/20'
                          : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-xs font-medium">{level.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rows */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rows: {rows}
                </label>
                <input
                  type="range"
                  value={rows}
                  onChange={(e) => setRows(Number(e.target.value))}
                  min="8"
                  max="16"
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>8</span>
                  <span>16</span>
                </div>
              </div>

              {/* Play Button */}
              <button
                onClick={handlePlay}
                disabled={isPlaying || !user}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                {isPlaying ? (
                  <>
                    <RotateCcw className="w-5 h-5 animate-spin" />
                    Playing...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Drop Ball (${betAmount})
                  </>
                )}
              </button>
            </div>

            {/* Last Result */}
            {lastResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
              >
                <h3 className="text-lg font-bold mb-4">Last Result</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bet:</span>
                    <span>${lastResult.betAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Multiplier:</span>
                    <span className="font-bold">{lastResult.multiplier}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Win:</span>
                    <span className="font-bold text-green-400">${lastResult.winAmount}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-600 pt-2">
                    <span className="text-gray-400">Profit:</span>
                    <span className={`font-bold ${Number(lastResult.profit) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {Number(lastResult.profit) >= 0 ? '+' : ''}${lastResult.profit}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Game Board */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 min-h-[600px] flex items-center justify-center">
              <div className="text-center">
                <Target className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Plinko Game Board</h3>
                <p className="text-gray-400 mb-6">
                  Interactive game board will be rendered here
                </p>
                <div className="text-sm text-gray-500">
                  <p>• Ball will drop from the top</p>
                  <p>• Bounce through {rows} rows of pegs</p>
                  <p>• Land in multiplier slots at bottom</p>
                  <p>• Risk level: {riskLevel}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
