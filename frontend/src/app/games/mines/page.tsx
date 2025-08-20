'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bomb, ArrowLeft, Play, RotateCcw, Gem } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';

export default function MinesPage() {
  const { user } = useAuthStore();
  const [betAmount, setBetAmount] = useState(10);
  const [mineCount, setMineCount] = useState(5);
  const [gridSize, setGridSize] = useState(25);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameBoard, setGameBoard] = useState<any[]>([]);
  const [revealedCells, setRevealedCells] = useState<Set<number>>(new Set());
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [gameActive, setGameActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Fix hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const initializeGame = () => {
    const board = Array(gridSize).fill(null).map((_, index) => ({
      id: index,
      isMine: false,
      isRevealed: false,
      isGem: false
    }));
    
    // Randomly place mines
    const minePositions = new Set<number>();
    while (minePositions.size < mineCount) {
      const pos = Math.floor(Math.random() * gridSize);
      minePositions.add(pos);
    }
    
    minePositions.forEach(pos => {
      board[pos].isMine = true;
    });
    
    setGameBoard(board);
    setRevealedCells(new Set());
    setCurrentMultiplier(1.0);
    setGameActive(true);
  };

  const handleCellClick = (cellId: number) => {
    if (!gameActive || revealedCells.has(cellId) || isPlaying) return;
    
    const cell = gameBoard[cellId];
    const newRevealed = new Set(revealedCells);
    newRevealed.add(cellId);
    setRevealedCells(newRevealed);
    
    if (cell.isMine) {
      // Hit a mine - game over
      toast.error('💥 You hit a mine! Game over!');
      setGameActive(false);
      setIsPlaying(false);
      // Reveal all mines
      const allMines = gameBoard.map((cell, index) => 
        cell.isMine ? index : null
      ).filter(index => index !== null);
      setRevealedCells(new Set([...newRevealed, ...allMines]));
    } else {
      // Found a gem
      cell.isGem = true;
      const newMultiplier = currentMultiplier * 1.2; // Simple multiplier increase
      setCurrentMultiplier(newMultiplier);
      toast.success(`💎 Gem found! Multiplier: ${newMultiplier.toFixed(2)}x`);
    }
  };

  const handleCashOut = () => {
    if (!gameActive) return;
    
    const winAmount = betAmount * currentMultiplier;
    toast.success(`Cashed out! Won $${winAmount.toFixed(2)} (${currentMultiplier.toFixed(2)}x)`);
    setGameActive(false);
  };

  const handleNewGame = () => {
    if (!user) {
      toast.error('Please login to play');
      return;
    }

    if (betAmount > user.balance) {
      toast.error('Insufficient balance');
      return;
    }

    initializeGame();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/games">
              <button
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors hover:scale-105 transform"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Bomb className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Mines</h1>
                <p className="text-gray-400">Find gems, avoid mines!</p>
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
              <h2 className="text-xl font-bold mb-6">Game Settings</h2>
              
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
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none disabled:opacity-50"
                />
              </div>

              {/* Mine Count */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mines: {mineCount}
                </label>
                <input
                  type="range"
                  value={mineCount}
                  onChange={(e) => setMineCount(Number(e.target.value))}
                  min="1"
                  max="24"
                  disabled={gameActive}
                  className="w-full disabled:opacity-50"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1</span>
                  <span>24</span>
                </div>
              </div>

              {/* Current Multiplier */}
              {gameActive && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
                  <div className="text-center">
                    <p className="text-sm text-gray-300">Current Multiplier</p>
                    <p className="text-2xl font-bold text-purple-400">{currentMultiplier.toFixed(2)}x</p>
                    <p className="text-sm text-gray-300">
                      Potential Win: ${(betAmount * currentMultiplier).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {!gameActive ? (
                  <button
                    onClick={handleNewGame}
                    disabled={!user}
                    className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Start Game (${betAmount})
                  </button>
                ) : (
                  <button
                    onClick={handleCashOut}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl transition-all duration-300"
                  >
                    Cash Out (${(betAmount * currentMultiplier).toFixed(2)})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Game Board */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
                {gameBoard.map((cell) => (
                  <button
                    key={cell.id}
                    onClick={() => handleCellClick(cell.id)}
                    disabled={!gameActive || revealedCells.has(cell.id)}
                    className={`aspect-square rounded-lg border-2 transition-all duration-300 flex items-center justify-center ${
                      revealedCells.has(cell.id)
                        ? cell.isMine
                          ? 'bg-red-500 border-red-400'
                          : 'bg-green-500 border-green-400'
                        : 'bg-gray-700 border-gray-600 hover:border-purple-500 hover:bg-gray-600 hover:scale-105 transform'
                    }`}
                  >
                    {revealedCells.has(cell.id) && (
                      <>
                        {cell.isMine ? (
                          <Bomb className="w-6 h-6 text-white" />
                        ) : (
                          <Gem className="w-6 h-6 text-white" />
                        )}
                      </>
                    )}
                  </button>
                ))}
              </div>
              
              {!gameActive && gameBoard.length === 0 && (
                <div className="text-center py-12">
                  <Bomb className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Ready to Play Mines?</h3>
                  <p className="text-gray-400">
                    Set your bet amount and mine count, then start the game!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
